import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError, requireAdmin } from "@/lib/api/helpers";

/**
 * GET: Fetch all flagged reviews for the admin moderation queue.
 *
 * Returns flags with full review context, property name, reviewer info,
 * and flagger info. Ordered by oldest flag first (FIFO queue).
 */
export async function GET() {
  const adminAuth = await requireAdmin();
  if (!adminAuth) return jsonError("Admin access required", 403);

  const admin = createAdminClient();

  const { data: flags, error } = await admin
    .from("review_flags")
    .select(
      `id, review_id, flagged_by_user_id, flagged_by_role, flag_reason, flag_notes, flagged_at, acknowledged_at, resolved_at, resolution, resolved_by_user_id,
       trip_reviews!review_flags_review_id_fkey(
         id, overall_rating, review_text, status, submitted_at, published_at,
         angler_user_id, property_id, trip_completed, would_fish_again,
         properties!trip_reviews_property_id_fkey(name),
         profiles!trip_reviews_angler_user_id_fkey(display_name)
       )`
    )
    .is("resolved_at", null)
    .order("flagged_at", { ascending: true });

  if (error) {
    console.error("[admin/review-flags] Fetch error:", error);
    return jsonError("Failed to fetch flagged reviews", 500);
  }

  return jsonOk({ flags: flags ?? [] });
}

/**
 * PATCH: Acknowledge a flag (stamp acknowledged_at).
 *
 * Body: { flag_id: string }
 */
export async function PATCH(request: Request) {
  const adminAuth = await requireAdmin();
  if (!adminAuth) return jsonError("Admin access required", 403);

  const body = await request.json();
  const flagId = body?.flag_id;

  if (!flagId || typeof flagId !== "string") {
    return jsonError("flag_id is required", 400);
  }

  const admin = createAdminClient();

  const { error } = await admin
    .from("review_flags")
    .update({ acknowledged_at: new Date().toISOString() })
    .eq("id", flagId)
    .is("acknowledged_at", null);

  if (error) {
    return jsonError("Failed to acknowledge flag", 500);
  }

  return jsonOk({ success: true });
}
