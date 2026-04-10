import { jsonError, jsonOk, requireAuth } from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPlatformStaffRole } from "@/lib/permissions/db";
import { auditLog, AuditAction } from "@/lib/permissions/audit";
import { STANDING_CONFIG, type BookingStanding } from "@/lib/constants/booking-limits";

const ALLOWED_ROLES = new Set([
  "super_admin",
  "ops_admin",
  "support_agent",
]);

/**
 * GET /api/admin/booking-standing
 * List users with non-good standing or all standings if ?all=true
 */
export async function GET(request: Request) {
  const auth = await requireAuth();
  if (!auth) return jsonError("Unauthorized", 401);

  const staffRecord = await getPlatformStaffRole(auth.user.id);
  if (!staffRecord || !ALLOWED_ROLES.has(staffRecord.role)) {
    return jsonError("Forbidden", 403);
  }

  const db = createAdminClient();
  const { searchParams } = new URL(request.url);
  const showAll = searchParams.get("all") === "true";

  let query = db
    .from("booking_standing")
    .select("user_id, standing, concurrent_cap, cancellation_score, cancellation_score_updated_at, updated_by, reason, updated_at")
    .order("cancellation_score", { ascending: false });

  if (!showAll) {
    query = query.neq("standing", "good");
  }

  const { data: standings, error } = await query.limit(100);

  if (error) {
    console.error("[admin/booking-standing] Fetch error:", error);
    return jsonError("Failed to fetch standings", 500);
  }

  // Fetch profile info for each user
  const userIds = ((standings ?? []) as { user_id: string }[]).map(
    (s) => s.user_id
  );

  const profiles: Record<string, { display_name: string | null }> = {};
  if (userIds.length > 0) {
    const { data: profileRows } = await db
      .from("profiles")
      .select("id, display_name")
      .in("id", userIds);

    for (const p of profileRows ?? []) {
      profiles[p.id] = { display_name: p.display_name };
    }
  }

  const results = ((standings ?? []) as {
    user_id: string;
    standing: string;
    concurrent_cap: number;
    cancellation_score: number;
    cancellation_score_updated_at: string | null;
    updated_by: string | null;
    reason: string | null;
    updated_at: string;
  }[]).map((s) => ({
    ...s,
    display_name: profiles[s.user_id]?.display_name ?? null,
  }));

  return jsonOk({ standings: results });
}

/**
 * PATCH /api/admin/booking-standing
 * Override a user's booking standing manually.
 * Body: { user_id, standing, concurrent_cap?, reason }
 */
export async function PATCH(request: Request) {
  const auth = await requireAuth();
  if (!auth) return jsonError("Unauthorized", 401);

  const staffRecord = await getPlatformStaffRole(auth.user.id);
  if (!staffRecord || !ALLOWED_ROLES.has(staffRecord.role)) {
    return jsonError("Forbidden", 403);
  }

  const body = await request.json();
  const { user_id, standing, concurrent_cap, reason } = body as {
    user_id?: string;
    standing?: string;
    concurrent_cap?: number;
    reason?: string;
  };

  if (!user_id || !standing || !reason) {
    return jsonError("user_id, standing, and reason are required", 400);
  }

  const validStandings: BookingStanding[] = ["good", "warned", "restricted", "suspended"];
  if (!validStandings.includes(standing as BookingStanding)) {
    return jsonError(`Invalid standing. Must be one of: ${validStandings.join(", ")}`, 400);
  }

  const db = createAdminClient();

  // Get current standing for audit
  const { data: current } = await db
    .from("booking_standing")
    .select("standing, concurrent_cap")
    .eq("user_id", user_id)
    .maybeSingle();

  const oldStanding = (current as { standing: string; concurrent_cap: number } | null)?.standing ?? "good";
  const newCap = concurrent_cap ?? STANDING_CONFIG[standing as BookingStanding].concurrentCap;

  const { error: updateError } = await db
    .from("booking_standing")
    .upsert({
      user_id,
      standing,
      concurrent_cap: newCap,
      updated_by: auth.user.id,
      reason,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user_id);

  if (updateError) {
    console.error("[admin/booking-standing] Update error:", updateError);
    return jsonError("Failed to update standing", 500);
  }

  // Audit
  await auditLog({
    actor_id: auth.user.id,
    action: AuditAction.BOOKING_STANDING_CHANGED,
    entity_type: "booking_standing",
    entity_id: user_id,
    old_data: { standing: oldStanding },
    new_data: { standing, concurrent_cap: newCap, reason },
    reason,
  });

  return jsonOk({ success: true, standing, concurrent_cap: newCap });
}
