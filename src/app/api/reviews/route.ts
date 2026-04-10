import { jsonCreated, jsonError, jsonOk, requireAuth} from "@/lib/api/helpers";
import { roundCurrency } from "@/lib/constants/fees";
import { createAdminClient } from "@/lib/supabase/admin";
import { toDateString } from "@/lib/utils";
import { reviewSchema } from "@/lib/validations/guides";

// GET: Fetch reviews
export async function GET(request: Request) {
  try {
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

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
        return jsonError("Failed to fetch reviews", 500);
      }

      return jsonOk({ reviews: reviews ?? [] });
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
        return jsonError("Failed to fetch reviews", 500);
      }

      // Filter: only show revealed reviews or ones written by the current user
      const filtered = (reviews ?? []).filter(
        (r) => r.is_revealed || r.reviewer_id === user.id
      );

      return jsonOk({ reviews: filtered });
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
        return jsonError("Failed to fetch reviews", 500);
      }

      return jsonOk({ reviews: reviews ?? [] });
    }

    // Default: user's pending reviews to write
    const { data: bookings } = await admin
      .from("bookings")
      .select("id, booking_date, guide_id, property_id, angler_id, guide_profiles(user_id, display_name), properties(name)")
      .or(`angler_id.eq.${user.id},guide_profiles.user_id.eq.${user.id}`)
      .eq("status", "confirmed")
      .lt("booking_date", toDateString())
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

    return jsonOk({ pending_reviews: pendingReviews });
  } catch (err) {
    console.error("[reviews] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}

// POST: Submit a review
export async function POST(request: Request) {
  try {
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

    const body = await request.json();
    const result = reviewSchema.safeParse(body);

    if (!result.success) {
      return jsonError(result.error.issues[0]?.message ?? "Invalid input", 400);
    }

    const admin = createAdminClient();

    // Fetch booking
    const { data: booking } = await admin
      .from("bookings")
      .select("id, angler_id, guide_id, booking_date, guide_profiles(user_id)")
      .eq("id", result.data.booking_id)
      .maybeSingle();

    if (!booking) {
      return jsonError("Booking not found", 404);
    }

    if (!booking.guide_id) {
      return jsonError("This booking has no guide to review", 400);
    }

    // Verify user is the angler or guide
    const guideProfile = booking.guide_profiles;

    const isAngler = booking.angler_id === user.id;
    const isGuide = guideProfile?.user_id === user.id;

    if (!isAngler && !isGuide) {
      return jsonError("Forbidden", 403);
    }

    // Check booking is completed (date has passed)
    const bookingDate = new Date(booking.booking_date + "T23:59:59");
    if (new Date() < bookingDate) {
      return jsonError("You can only review after the trip has taken place", 400);
    }

    // Check review window (14 days)
    const windowClose = new Date(booking.booking_date + "T00:00:00");
    windowClose.setDate(windowClose.getDate() + 14);
    if (new Date() > windowClose) {
      return jsonError("The review window has closed (14 days after the trip)", 400);
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
      return jsonError("You have already reviewed this booking", 409);
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
      return jsonError("Failed to submit review", 500);
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

    return jsonCreated({ review });
  } catch (err) {
    console.error("[reviews] Unexpected error:", err);
    return jsonError("Internal server error", 500);
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
    const avg = roundCurrency(sum / reviews.length);

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
