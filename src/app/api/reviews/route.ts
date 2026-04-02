import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { reviewSchema } from "@/lib/validations/guides";

// GET: Fetch reviews
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const guideId = searchParams.get("guide_id");
    const bookingId = searchParams.get("booking_id");
    const subjectId = searchParams.get("subject_id");

    const admin = createAdminClient();

    if (guideId) {
      // Public: revealed reviews for a guide (by guide_profile.user_id)
      const { data: reviews, error } = await admin
        .from("reviews")
        .select(
          "id, rating, title, body, created_at, reviewer_role, profiles!reviews_reviewer_id_fkey(display_name)"
        )
        .eq("subject_id", guideId)
        .eq("subject_role", "guide")
        .eq("is_revealed", true)
        .order("created_at", { ascending: false });

      if (error) {
        return NextResponse.json(
          { error: "Failed to fetch reviews" },
          { status: 500 }
        );
      }

      return NextResponse.json({ reviews: reviews ?? [] });
    }

    if (bookingId) {
      // Fetch reviews for a booking (revealed or user is participant)
      const { data: reviews, error } = await admin
        .from("reviews")
        .select(
          "id, rating, title, body, created_at, reviewer_id, reviewer_role, subject_id, subject_role, is_revealed, profiles!reviews_reviewer_id_fkey(display_name)"
        )
        .eq("booking_id", bookingId);

      if (error) {
        return NextResponse.json(
          { error: "Failed to fetch reviews" },
          { status: 500 }
        );
      }

      // Filter: only show revealed reviews or ones written by the current user
      const filtered = (reviews ?? []).filter(
        (r) => r.is_revealed || r.reviewer_id === user.id
      );

      return NextResponse.json({ reviews: filtered });
    }

    if (subjectId) {
      // Revealed reviews where user is the subject
      const { data: reviews, error } = await admin
        .from("reviews")
        .select(
          "id, rating, title, body, created_at, reviewer_role, is_revealed, profiles!reviews_reviewer_id_fkey(display_name)"
        )
        .eq("subject_id", subjectId)
        .eq("is_revealed", true)
        .order("created_at", { ascending: false });

      if (error) {
        return NextResponse.json(
          { error: "Failed to fetch reviews" },
          { status: 500 }
        );
      }

      return NextResponse.json({ reviews: reviews ?? [] });
    }

    // Default: user's pending reviews to write
    const { data: bookings } = await admin
      .from("bookings")
      .select("id, booking_date, guide_id, property_id, angler_id, guide_profiles(user_id, display_name), properties(name)")
      .or(`angler_id.eq.${user.id},guide_profiles.user_id.eq.${user.id}`)
      .eq("status", "confirmed")
      .lt("booking_date", new Date().toISOString().split("T")[0])
      .not("guide_id", "is", null);

    // Find which ones the user hasn't reviewed yet
    const bookingIds = (bookings ?? []).map((b) => b.id);
    const { data: existingReviews } = await admin
      .from("reviews")
      .select("booking_id, reviewer_id")
      .in("booking_id", bookingIds.length ? bookingIds : ["none"])
      .eq("reviewer_id", user.id);

    const reviewedBookings = new Set(
      (existingReviews ?? []).map((r) => r.booking_id)
    );

    const pendingReviews = (bookings ?? [])
      .filter((b) => !reviewedBookings.has(b.id))
      .filter((b) => {
        // Check review window (14 days)
        const bookingDate = new Date(b.booking_date);
        const windowClose = new Date(bookingDate);
        windowClose.setDate(windowClose.getDate() + 14);
        return new Date() <= windowClose;
      });

    return NextResponse.json({ pending_reviews: pendingReviews });
  } catch (err) {
    console.error("[reviews] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Submit a review
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = reviewSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Fetch booking
    const { data: booking } = await admin
      .from("bookings")
      .select("id, angler_id, guide_id, booking_date, guide_profiles(user_id)")
      .eq("id", result.data.booking_id)
      .single();

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    if (!booking.guide_id) {
      return NextResponse.json(
        { error: "This booking has no guide to review" },
        { status: 400 }
      );
    }

    // Verify user is the angler or guide
    const guideProfile = booking.guide_profiles;

    const isAngler = booking.angler_id === user.id;
    const isGuide = guideProfile?.user_id === user.id;

    if (!isAngler && !isGuide) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check booking is completed (date has passed)
    const bookingDate = new Date(booking.booking_date + "T23:59:59");
    if (new Date() < bookingDate) {
      return NextResponse.json(
        { error: "You can only review after the trip has taken place" },
        { status: 400 }
      );
    }

    // Check review window (14 days)
    const windowClose = new Date(booking.booking_date + "T00:00:00");
    windowClose.setDate(windowClose.getDate() + 14);
    if (new Date() > windowClose) {
      return NextResponse.json(
        { error: "The review window has closed (14 days after the trip)" },
        { status: 400 }
      );
    }

    // Determine reviewer/subject roles
    const reviewerRole = isAngler ? "angler" : "guide";
    const subjectRole = isAngler ? "guide" : "angler";
    const subjectId = isAngler
      ? guideProfile!.user_id
      : booking.angler_id;

    // Check for existing review
    const { data: existing } = await admin
      .from("reviews")
      .select("id")
      .eq("booking_id", result.data.booking_id)
      .eq("reviewer_role", reviewerRole)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "You have already reviewed this booking" },
        { status: 409 }
      );
    }

    // Create the review
    const { data: review, error: insertError } = await admin
      .from("reviews")
      .insert({
        booking_id: result.data.booking_id,
        reviewer_id: user.id,
        reviewer_role: reviewerRole,
        subject_id: subjectId,
        subject_role: subjectRole,
        rating: result.data.rating,
        title: result.data.title || null,
        body: result.data.body || null,
        is_revealed: false,
        review_window_closes_at: windowClose.toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("[reviews] Insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to submit review" },
        { status: 500 }
      );
    }

    // Check if both sides have submitted → reveal both
    const { data: counterReview } = await admin
      .from("reviews")
      .select("id")
      .eq("booking_id", result.data.booking_id)
      .neq("reviewer_role", reviewerRole)
      .maybeSingle();

    if (counterReview) {
      // Both reviews exist → reveal both
      await admin
        .from("reviews")
        .update({ is_revealed: true })
        .eq("booking_id", result.data.booking_id);

      // Recalculate guide stats
      await recalculateGuideStats(admin, isAngler ? subjectId : user.id);
    }

    return NextResponse.json({ review }, { status: 201 });
  } catch (err) {
    console.error("[reviews] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function recalculateGuideStats(
  admin: ReturnType<typeof createAdminClient>,
  guideUserId: string
) {
  try {
    const { data: reviews } = await admin
      .from("reviews")
      .select("rating")
      .eq("subject_id", guideUserId)
      .eq("subject_role", "guide")
      .eq("is_revealed", true);

    if (!reviews?.length) return;

    const sum = reviews.reduce(
      (acc: number, r: { rating: number }) => acc + r.rating,
      0
    );
    const avg = Math.round((sum / reviews.length) * 100) / 100;

    await admin
      .from("guide_profiles")
      .update({
        rating_avg: avg,
        rating_count: reviews.length,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", guideUserId);
  } catch (err) {
    console.error("[reviews] Stats recalculation error:", err);
  }
}
