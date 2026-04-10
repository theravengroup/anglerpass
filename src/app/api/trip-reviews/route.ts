import { createAdminClient } from "@/lib/supabase/admin";
import {
  jsonOk,
  jsonCreated,
  jsonError,
  requireAuth,
  isDuplicateError,
} from "@/lib/api/helpers";
import { tripReviewCreateSchema } from "@/lib/validations/reviews";
import {
  checkReviewEligibility,
  checkActiveWindow,
  validateCategoryRatings,
  autoFlagReviewIfNeeded,
} from "@/lib/reviews";

// GET: Fetch trip reviews (by property, by angler, or pending)
export async function GET(request: Request) {
  const auth = await requireAuth();
  if (!auth) return jsonError("Unauthorized", 401);

  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get("property_id");
  const anglerOnly = searchParams.get("mine") === "true";
  const pendingOnly = searchParams.get("pending") === "true";

  const admin = createAdminClient();

  // Fetch published reviews for a property
  if (propertyId && !anglerOnly) {
    const { data: reviews, error } = await admin
      .from("trip_reviews")
      .select(
        "id, overall_rating, review_text, would_fish_again, submitted_at, published_at, trip_completed, host_response_text, host_response_published_at, booking_id, profiles!trip_reviews_angler_user_id_fkey(display_name), review_category_ratings(category_key, rating_value), bookings!trip_reviews_booking_id_fkey(booking_date, booking_end_date, club_memberships(clubs(name)))"
      )
      .eq("property_id", propertyId)
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (error) {
      return jsonError("Failed to fetch reviews", 500);
    }

    // Fetch aggregate stats
    const { data: stats } = await admin
      .from("property_review_stats")
      .select("*")
      .eq("property_id", propertyId)
      .maybeSingle();

    // Compute category averages across all published reviews
    const categoryTotals: Record<string, { sum: number; count: number }> = {};
    for (const review of reviews ?? []) {
      const ratings = review.review_category_ratings as
        | { category_key: string; rating_value: number }[]
        | null;
      if (!ratings) continue;
      for (const cr of ratings) {
        if (!categoryTotals[cr.category_key]) {
          categoryTotals[cr.category_key] = { sum: 0, count: 0 };
        }
        categoryTotals[cr.category_key].sum += cr.rating_value;
        categoryTotals[cr.category_key].count += 1;
      }
    }

    const categoryAverages: Record<string, number> = {};
    for (const [key, val] of Object.entries(categoryTotals)) {
      categoryAverages[key] =
        Math.round((val.sum / val.count) * 10) / 10;
    }

    return jsonOk({
      reviews: reviews ?? [],
      stats: stats ?? null,
      category_averages: categoryAverages,
    });
  }

  // Fetch the angler's own reviews
  if (anglerOnly) {
    const { data: reviews, error } = await admin
      .from("trip_reviews")
      .select(
        "id, booking_id, property_id, overall_rating, review_text, status, submitted_at, published_at, review_window_expires_at, extension_requested, extension_expires_at, trip_completed, created_at, properties(name)"
      )
      .eq("angler_user_id", auth.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return jsonError("Failed to fetch your reviews", 500);
    }

    return jsonOk({ reviews: reviews ?? [] });
  }

  // Fetch pending review opportunities (completed bookings without reviews)
  if (pendingOnly) {
    const { data: bookings, error } = await admin
      .from("bookings")
      .select(
        "id, property_id, booking_date, booking_end_date, status, cancellation_fault, properties(name)"
      )
      .eq("angler_id", auth.user.id)
      .or("status.eq.completed,status.eq.cancelled");

    if (error) {
      return jsonError("Failed to fetch bookings", 500);
    }

    // Filter to eligible bookings without existing reviews
    const bookingIds = (bookings ?? []).map((b) => b.id);
    const { data: existingReviews } = await admin
      .from("trip_reviews")
      .select("booking_id")
      .in("booking_id", bookingIds.length ? bookingIds : ["none"]);

    const reviewedBookingIds = new Set(
      (existingReviews ?? []).map((r) => r.booking_id)
    );

    const landownerFaults = new Set([
      "landowner_gate_failure",
      "landowner_no_response",
      "landowner_access_denied",
      "landowner_initiated",
    ]);

    const pending = (bookings ?? []).filter((b) => {
      // Skip already reviewed
      if (reviewedBookingIds.has(b.id)) return false;

      // Must be completed or landowner-fault cancelled
      if (b.status === "completed") return true;
      if (
        b.status === "cancelled" &&
        b.cancellation_fault &&
        landownerFaults.has(b.cancellation_fault)
      ) {
        return true;
      }
      return false;
    });

    return jsonOk({ pending_reviews: pending });
  }

  return jsonError("Provide property_id, mine=true, or pending=true", 400);
}

// POST: Create a new trip review
export async function POST(request: Request) {
  const auth = await requireAuth();
  if (!auth) return jsonError("Unauthorized", 401);

  const body = await request.json();
  const parsed = tripReviewCreateSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(
      parsed.error.issues[0]?.message ?? "Invalid input",
      400
    );
  }

  const data = parsed.data;

  // Rule 12: No anonymous reviews — enforced by Zod schema refine
  // (is_anonymous must be false or omitted; Zod rejects true)

  const admin = createAdminClient();

  // Rule 1 + 2 + 3: Check eligibility
  const eligibility = await checkReviewEligibility(
    admin,
    data.booking_id,
    auth.user.id
  );

  if (!eligibility.eligible) {
    return jsonError(eligibility.error ?? "Not eligible to review", 400);
  }

  // Rule 4: Review window
  const now = new Date();
  if (now > eligibility.reviewWindowExpiresAt) {
    return jsonError("The review window has expired", 400);
  }

  // Rule 7: Validate category ratings
  const categoryValidation = validateCategoryRatings(
    data.category_ratings,
    eligibility.tripCompleted
  );

  if (!categoryValidation.valid) {
    return jsonError(categoryValidation.error ?? "Invalid categories", 400);
  }

  // Create the review record
  const { data: review, error: insertError } = await admin
    .from("trip_reviews")
    .insert({
      booking_id: data.booking_id,
      property_id: eligibility.booking!.property_id,
      angler_user_id: auth.user.id,
      overall_rating: data.overall_rating,
      review_text: data.review_text,
      would_fish_again: data.would_fish_again,
      private_feedback_text: data.private_feedback_text || null,
      submitted_at: now.toISOString(),
      review_window_expires_at:
        eligibility.reviewWindowExpiresAt.toISOString(),
      status: "submitted",
      trip_completed: eligibility.tripCompleted,
      is_anonymous: false,
    })
    .select("id")
    .single();

  if (insertError) {
    // Unique constraint violation on booking_id
    if (isDuplicateError(insertError)) {
      return jsonError("A review already exists for this booking", 409);
    }
    console.error("[trip-reviews] Insert error:", insertError);
    return jsonError("Failed to create review", 500);
  }

  // Insert category ratings
  const categoryInserts = data.category_ratings.map((cr) => ({
    review_id: review.id,
    category_key: cr.category_key,
    rating_value: cr.rating_value,
  }));

  const { error: categoryError } = await admin
    .from("review_category_ratings")
    .insert(categoryInserts);

  if (categoryError) {
    console.error("[trip-reviews] Category insert error:", categoryError);
    // Review was created but categories failed — clean up
    await admin.from("trip_reviews").delete().eq("id", review.id);
    return jsonError("Failed to save category ratings", 500);
  }

  // Auto-flag for human review if content triggers patterns
  // (flags only — does NOT auto-suppress)
  autoFlagReviewIfNeeded(admin, review.id, data.review_text).catch((err) =>
    console.error("[trip-reviews] Auto-flag error:", err)
  );

  return jsonCreated({ review: { id: review.id, status: "submitted" } });
}
