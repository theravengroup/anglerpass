import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError, requireAuth } from "@/lib/api/helpers";
import { tripReviewUpdateSchema } from "@/lib/validations/reviews";
import { checkActiveWindow, validateCategoryRatings } from "@/lib/reviews";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Fetch a single trip review by ID
export async function GET(request: Request, { params }: RouteParams) {
  const auth = await requireAuth();
  if (!auth) return jsonError("Unauthorized", 401);

  const { id } = await params;
  const admin = createAdminClient();

  const { data: review, error } = await admin
    .from("trip_reviews")
    .select(
      "*, profiles!trip_reviews_angler_user_id_fkey(display_name), review_category_ratings(category_key, rating_value), review_responses(id, response_text, submitted_at, published_at, status, responder_role)"
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !review) {
    return jsonError("Review not found", 404);
  }

  // Access control: published reviews are public; otherwise owner, property owner, or admin only
  const isOwner = review.angler_user_id === auth.user.id;
  const isPublished = review.status === "published";

  if (!isOwner && !isPublished) {
    // Check if user is property owner
    const { data: property } = await admin
      .from("properties")
      .select("owner_id")
      .eq("id", review.property_id)
      .maybeSingle();

    const isPropertyOwner = property?.owner_id === auth.user.id;

    // Check if user is admin
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", auth.user.id)
      .maybeSingle();

    const isAdmin = profile?.role === "admin";

    if (!isPropertyOwner && !isAdmin) {
      return jsonError("Not authorized to view this review", 403);
    }
  }

  // Strip private feedback if not property owner or admin
  const { data: property } = await admin
    .from("properties")
    .select("owner_id")
    .eq("id", review.property_id)
    .maybeSingle();

  const { data: userProfile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .maybeSingle();

  const canSeePrivateFeedback =
    property?.owner_id === auth.user.id || userProfile?.role === "admin";

  if (!canSeePrivateFeedback) {
    review.private_feedback_text = null;
  }

  return jsonOk({ review });
}

// PATCH: Update a draft review
export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireAuth();
  if (!auth) return jsonError("Unauthorized", 401);

  const { id } = await params;
  const body = await request.json();
  const parsed = tripReviewUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(
      parsed.error.issues[0]?.message ?? "Invalid input",
      400
    );
  }

  const admin = createAdminClient();

  // Fetch the review
  const { data: review, error } = await admin
    .from("trip_reviews")
    .select(
      "id, angler_user_id, status, trip_completed, review_window_expires_at, extension_requested, extension_expires_at"
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !review) {
    return jsonError("Review not found", 404);
  }

  if (review.angler_user_id !== auth.user.id) {
    return jsonError("You can only edit your own reviews", 403);
  }

  if (review.status !== "draft") {
    return jsonError("Only draft reviews can be edited", 400);
  }

  // Rule 6: Check active window
  const windowCheck = checkActiveWindow(review);
  if (!windowCheck.withinWindow) {
    return jsonError(windowCheck.error ?? "Review window expired", 400);
  }

  // Build update object
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (parsed.data.overall_rating !== undefined) {
    updates.overall_rating = parsed.data.overall_rating;
  }
  if (parsed.data.review_text !== undefined) {
    updates.review_text = parsed.data.review_text;
  }
  if (parsed.data.would_fish_again !== undefined) {
    updates.would_fish_again = parsed.data.would_fish_again;
  }
  if (parsed.data.private_feedback_text !== undefined) {
    updates.private_feedback_text = parsed.data.private_feedback_text || null;
  }

  const { error: updateError } = await admin
    .from("trip_reviews")
    .update(updates)
    .eq("id", id);

  if (updateError) {
    return jsonError("Failed to update review", 500);
  }

  // Update category ratings if provided
  if (parsed.data.category_ratings) {
    const categoryValidation = validateCategoryRatings(
      parsed.data.category_ratings,
      review.trip_completed
    );

    if (!categoryValidation.valid) {
      return jsonError(
        categoryValidation.error ?? "Invalid categories",
        400
      );
    }

    // Delete existing and re-insert
    await admin
      .from("review_category_ratings")
      .delete()
      .eq("review_id", id);

    const categoryInserts = parsed.data.category_ratings.map((cr) => ({
      review_id: id,
      category_key: cr.category_key,
      rating_value: cr.rating_value,
    }));

    const { error: categoryError } = await admin
      .from("review_category_ratings")
      .insert(categoryInserts);

    if (categoryError) {
      return jsonError("Failed to update category ratings", 500);
    }
  }

  return jsonOk({ success: true });
}
