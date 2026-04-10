import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

// ─── Rule 9: Flagging Rights ─────────────────────────────────────────

/**
 * Validates that a user has the right to flag a review.
 *
 * Rules:
 * - Only landowner of the property OR club_admin whose club has access
 *   to the property may flag a review.
 * - Flagging sets the review status to 'flagged' but does NOT suppress it.
 * - Suppression requires AnglerPass staff action (admin role).
 */
export async function validateFlaggingRights(
  admin: SupabaseClient,
  reviewId: string,
  userId: string
): Promise<{
  authorized: boolean;
  role?: "landowner" | "club_admin";
  error?: string;
}> {
  // Fetch the review and its property
  const { data: review, error: reviewError } = await admin
    .from("trip_reviews")
    .select("id, property_id, status")
    .eq("id", reviewId)
    .maybeSingle();

  if (reviewError || !review) {
    return { authorized: false, error: "Review not found" };
  }

  // Check if user is the property owner (landowner)
  const { data: property } = await admin
    .from("properties")
    .select("id, owner_id")
    .eq("id", review.property_id)
    .maybeSingle();

  if (property?.owner_id === userId) {
    return { authorized: true, role: "landowner" };
  }

  // Check if user is a club_admin whose club has approved access to this property
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
      "Only the property landowner or an associated club admin can flag this review",
  };
}

/**
 * Creates a flag on a review and updates the review status to 'flagged'.
 * Does NOT suppress the review — that requires admin action.
 */
export async function createReviewFlag(
  admin: SupabaseClient,
  reviewId: string,
  userId: string,
  role: "landowner" | "club_admin",
  flagReason: string,
  flagNotes?: string
): Promise<{ success: boolean; flagId?: string; error?: string }> {
  // Insert the flag
  const { data: flag, error: flagError } = await admin
    .from("review_flags")
    .insert({
      review_id: reviewId,
      flagged_by_user_id: userId,
      flagged_by_role: role,
      flag_reason: flagReason,
      flag_notes: flagNotes || null,
    })
    .select("id")
    .single();

  if (flagError) {
    return { success: false, error: `Failed to create flag: ${flagError.message}` };
  }

  // Update review status to flagged (if not already suppressed/removed)
  const { error: updateError } = await admin
    .from("trip_reviews")
    .update({
      status: "flagged",
      updated_at: new Date().toISOString(),
    })
    .eq("id", reviewId)
    .in("status", ["submitted", "published"]);

  if (updateError) {
    // Flag was still created, just status update failed
    console.error("[reviews] Flag status update error:", updateError);
  }

  return { success: true, flagId: flag.id };
}
