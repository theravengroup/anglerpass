import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { isDuplicateError } from "@/lib/api/helpers";
import { RESPONSE_EDIT_LOCK_HOURS } from "@/lib/validations/reviews";

// ─── Rule 10: Landowner Response ─────────────────────────────────────

/**
 * Validates that a user can respond to a review.
 *
 * Rules:
 * - Only one response per review (unique constraint on review_id)
 * - Responder must be the property landowner or a club admin with access
 * - Review must be in published or flagged status
 */
export async function validateResponseRights(
  admin: SupabaseClient,
  reviewId: string,
  userId: string
): Promise<{
  authorized: boolean;
  role?: "landowner" | "club_admin";
  error?: string;
}> {
  // Fetch the review
  const { data: review, error: reviewError } = await admin
    .from("trip_reviews")
    .select("id, property_id, status")
    .eq("id", reviewId)
    .maybeSingle();

  if (reviewError || !review) {
    return { authorized: false, error: "Review not found" };
  }

  if (!["published", "flagged"].includes(review.status)) {
    return {
      authorized: false,
      error: "Responses can only be added to published or flagged reviews",
    };
  }

  // Check existing response
  const { data: existingResponse } = await admin
    .from("review_responses")
    .select("id")
    .eq("review_id", reviewId)
    .maybeSingle();

  if (existingResponse) {
    return {
      authorized: false,
      error: "A response already exists for this review",
    };
  }

  // Check if user is the property owner
  const { data: property } = await admin
    .from("properties")
    .select("id, owner_id")
    .eq("id", review.property_id)
    .maybeSingle();

  if (property?.owner_id === userId) {
    return { authorized: true, role: "landowner" };
  }

  // Check if user is a club admin with access
  const { data: clubAccess } = await admin
    .from("club_property_access")
    .select("club_id, clubs!inner(owner_id)")
    .eq("property_id", review.property_id)
    .eq("status", "approved");

  if (clubAccess) {
    for (const access of clubAccess) {
      const club = access.clubs as unknown as { owner_id: string };
      if (club.owner_id === userId) {
        return { authorized: true, role: "club_admin" };
      }
    }
  }

  return {
    authorized: false,
    error:
      "Only the property landowner or an associated club admin can respond to this review",
  };
}

/**
 * Checks if a response can still be edited (within 24 hours of submission).
 */
export function isResponseEditable(response: {
  submitted_at: string;
}): boolean {
  const submittedAt = new Date(response.submitted_at);
  const now = new Date();
  const hoursSinceSubmission =
    (now.getTime() - submittedAt.getTime()) / (1000 * 60 * 60);

  return hoursSinceSubmission < RESPONSE_EDIT_LOCK_HOURS;
}

/**
 * Creates a response to a review and denormalizes it onto the trip_review record.
 */
export async function createReviewResponse(
  admin: SupabaseClient,
  reviewId: string,
  userId: string,
  role: "landowner" | "club_admin",
  responseText: string
): Promise<{ success: boolean; responseId?: string; error?: string }> {
  const now = new Date().toISOString();

  // Insert the response
  const { data: response, error: insertError } = await admin
    .from("review_responses")
    .insert({
      review_id: reviewId,
      responder_user_id: userId,
      responder_role: role,
      response_text: responseText,
      submitted_at: now,
      published_at: now,
      status: "published",
    })
    .select("id")
    .single();

  if (insertError) {
    // Could be unique constraint violation
    if (isDuplicateError(insertError)) {
      return {
        success: false,
        error: "A response already exists for this review",
      };
    }
    return {
      success: false,
      error: `Failed to create response: ${insertError.message}`,
    };
  }

  // Denormalize onto trip_reviews for fast reads
  await admin
    .from("trip_reviews")
    .update({
      host_response_text: responseText,
      host_response_published_at: now,
      updated_at: now,
    })
    .eq("id", reviewId);

  return { success: true, responseId: response.id };
}

/**
 * Updates an existing response if within the 24-hour edit window.
 */
export async function updateReviewResponse(
  admin: SupabaseClient,
  responseId: string,
  userId: string,
  responseText: string
): Promise<{ success: boolean; error?: string }> {
  // Fetch the response
  const { data: response, error } = await admin
    .from("review_responses")
    .select("id, review_id, responder_user_id, submitted_at, status")
    .eq("id", responseId)
    .maybeSingle();

  if (error || !response) {
    return { success: false, error: "Response not found" };
  }

  if (response.responder_user_id !== userId) {
    return { success: false, error: "You can only edit your own responses" };
  }

  if (response.status === "removed") {
    return { success: false, error: "This response has been removed" };
  }

  // Rule 10: Check 24-hour edit lock
  if (!isResponseEditable(response)) {
    return {
      success: false,
      error:
        "Responses can only be edited within 24 hours of submission",
    };
  }

  const now = new Date().toISOString();

  const { error: updateError } = await admin
    .from("review_responses")
    .update({
      response_text: responseText,
      updated_at: now,
    })
    .eq("id", responseId);

  if (updateError) {
    return { success: false, error: `Failed to update response: ${updateError.message}` };
  }

  // Update denormalized field on trip_reviews
  await admin
    .from("trip_reviews")
    .update({
      host_response_text: responseText,
      updated_at: now,
    })
    .eq("id", response.review_id);

  return { success: true };
}
