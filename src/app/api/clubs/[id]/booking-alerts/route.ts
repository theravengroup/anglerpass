import { jsonError, jsonOk, requireAuth } from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createUntypedAdminClient } from "@/lib/supabase/untyped-admin";

/**
 * GET /api/clubs/[id]/booking-alerts
 * Returns club members who have non-good booking standing.
 * Accessible by club admins/managers.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clubId } = await params;
  const auth = await requireAuth();
  if (!auth) return jsonError("Unauthorized", 401);

  const admin = createAdminClient();

  // Verify caller is a club manager/admin
  const { data: membership } = await admin
    .from("club_memberships")
    .select("id, role")
    .eq("club_id", clubId)
    .eq("user_id", auth.user.id)
    .in("status", ["active"])
    .single();

  if (!membership) {
    return jsonError("Forbidden", 403);
  }

  const isManager = ["owner", "admin", "manager"].includes(
    membership.role ?? ""
  );
  if (!isManager) {
    return jsonError("Forbidden", 403);
  }

  // Get all active member user IDs in this club
  const { data: members } = await admin
    .from("club_memberships")
    .select("user_id")
    .eq("club_id", clubId)
    .eq("status", "active");

  if (!members || members.length === 0) {
    return jsonOk({ alerts: [] });
  }

  const memberIds = members.map((m) => m.user_id);

  // Query booking_standing for flagged members
  const db = createUntypedAdminClient();
  const { data: standings } = await db
    .from("booking_standing")
    .select("user_id, standing, concurrent_cap, cancellation_score")
    .in("user_id", memberIds)
    .neq("standing", "good");

  if (!standings || standings.length === 0) {
    return jsonOk({ alerts: [] });
  }

  // Fetch display names
  const flaggedIds = (standings as { user_id: string }[]).map(
    (s) => s.user_id
  );
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, display_name")
    .in("id", flaggedIds);

  const nameMap: Record<string, string> = {};
  for (const p of profiles ?? []) {
    nameMap[p.id] = p.display_name ?? "Unknown";
  }

  const alerts = (
    standings as {
      user_id: string;
      standing: string;
      concurrent_cap: number;
      cancellation_score: number;
    }[]
  ).map((s) => ({
    user_id: s.user_id,
    display_name: nameMap[s.user_id] ?? "Unknown",
    standing: s.standing,
    concurrent_cap: s.concurrent_cap,
    cancellation_score: s.cancellation_score,
  }));

  return jsonOk({ alerts });
}
