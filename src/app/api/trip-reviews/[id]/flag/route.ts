import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError, requireAuth, requireAdmin } from "@/lib/api/helpers";
import {
  reviewFlagSchema,
  reviewFlagResolveSchema,
} from "@/lib/validations/reviews";
import { validateFlaggingRights, createReviewFlag } from "@/lib/reviews";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST: Flag a review (landowner or club_admin only)
export async function POST(request: Request, { params }: RouteParams) {
  const auth = await requireAuth();
  if (!auth) return jsonError("Unauthorized", 401);

  const { id } = await params;
  const body = await request.json();
  const parsed = reviewFlagSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(
      parsed.error.issues[0]?.message ?? "Invalid input",
      400
    );
  }

  const admin = createAdminClient();

  // Rule 9: Validate flagging rights
  const rights = await validateFlaggingRights(admin, id, auth.user.id);
  if (!rights.authorized) {
    return jsonError(rights.error ?? "Not authorized to flag", 403);
  }

  const result = await createReviewFlag(
    admin,
    id,
    auth.user.id,
    rights.role!,
    parsed.data.flag_reason,
    parsed.data.flag_notes
  );

  if (!result.success) {
    return jsonError(result.error ?? "Failed to create flag", 500);
  }

  return jsonOk({ success: true, flag_id: result.flagId });
}

// PATCH: Resolve a flag (admin only)
export async function PATCH(request: Request, { params }: RouteParams) {
  const adminAuth = await requireAdmin();
  if (!adminAuth) return jsonError("Admin access required", 403);

  const { id: reviewId } = await params;
  const body = await request.json();
  const parsed = reviewFlagResolveSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(
      parsed.error.issues[0]?.message ?? "Invalid input",
      400
    );
  }

  const admin = createAdminClient();

  // Find unresolved flags for this review
  const { data: flags, error: flagError } = await admin
    .from("review_flags")
    .select("id")
    .eq("review_id", reviewId)
    .is("resolved_at", null);

  if (flagError || !flags?.length) {
    return jsonError("No unresolved flags found for this review", 404);
  }

  const now = new Date().toISOString();

  // Resolve all unresolved flags
  const { error: resolveError } = await admin
    .from("review_flags")
    .update({
      resolution: parsed.data.resolution,
      resolved_at: now,
      resolved_by_user_id: adminAuth.user.id,
    })
    .eq("review_id", reviewId)
    .is("resolved_at", null);

  if (resolveError) {
    return jsonError("Failed to resolve flags", 500);
  }

  // Update review status based on resolution
  let newStatus: string;
  switch (parsed.data.resolution) {
    case "removed":
      newStatus = "removed";
      break;
    case "suppressed":
      newStatus = "suppressed";
      break;
    case "upheld":
    case "dismissed":
      // Restore to published if the flag is dismissed/upheld (review stands)
      newStatus = "published";
      break;
    default:
      newStatus = "published";
  }

  const reviewUpdate: Record<string, unknown> = {
    status: newStatus,
    updated_at: now,
  };

  if (parsed.data.moderation_reason) {
    reviewUpdate.moderation_reason = parsed.data.moderation_reason;
    reviewUpdate.moderation_resolved_at = now;
  }

  const { error: updateError } = await admin
    .from("trip_reviews")
    .update(reviewUpdate)
    .eq("id", reviewId);

  if (updateError) {
    return jsonError("Failed to update review status", 500);
  }

  return jsonOk({ success: true, new_status: newStatus });
}
