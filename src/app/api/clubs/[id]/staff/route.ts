import { jsonError, jsonOk, requireAuth} from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { authorize, P } from "@/lib/permissions";
import { CLUB_STAFF_ROLES } from "@/lib/permissions/constants";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/clubs/[id]/staff
 *
 * List all staff members for a club, plus regular members
 * (for the promote-to-staff form). Requires CLUB_VIEW_ROSTER permission.
 */
export async function GET(request: Request, context: RouteContext) {
  try {
    const { id: clubId } = await context.params;
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

    // Authorize: user must be able to view the roster
    const authResult = await authorize({
      permission: P.CLUB_VIEW_ROSTER,
      userId: user.id,
      clubId,
    });

    if (!authResult.allowed) {
      return jsonError("Forbidden", 403);
    }

    const admin = createAdminClient();

    // Fetch all memberships for this club
    const { data: memberships, error: memError } = await admin
      .from("club_memberships")
      .select("id, user_id, role, status, created_at, updated_at")
      .eq("club_id", clubId)
      .eq("status", "active")
      .order("created_at", { ascending: true });

    if (memError) {
      console.error("[club-staff] Fetch error:", memError);
      return jsonError("Failed to fetch staff", 500);
    }

    const allMembers = memberships ?? [];
    const userIds = allMembers
      .filter((m) => m.user_id != null)
      .map((m) => m.user_id as string);

    // Fetch profiles for all members
    const { data: profiles } = userIds.length > 0
      ? await admin.from("profiles").select("id, display_name").in("id", userIds)
      : { data: [] };

    const profileMap = new Map(
      (profiles ?? []).map((p) => [p.id, p.display_name])
    );

    // Fetch emails from auth
    const emailMap = new Map<string, string>();
    for (const uid of userIds) {
      try {
        const { data } = await admin.auth.admin.getUserById(uid);
        if (data?.user?.email) emailMap.set(uid, data.user.email);
      } catch {
        // skip
      }
    }

    // Split into staff and regular members
    const staffRoleSet = new Set(CLUB_STAFF_ROLES as readonly string[]);

    const staff = allMembers
      .filter((m) => staffRoleSet.has(m.role))
      .map((m) => ({
        id: m.id,
        user_id: m.user_id,
        display_name: profileMap.get(m.user_id as string) ?? "Unknown",
        email: emailMap.get(m.user_id as string) ?? "",
        role: m.role,
        joined_at: m.created_at,
      }));

    const regularMembers = allMembers
      .filter((m) => m.role === "member")
      .map((m) => ({
        id: m.id,
        user_id: m.user_id,
        display_name: profileMap.get(m.user_id as string) ?? "Unknown",
        email: emailMap.get(m.user_id as string) ?? "",
        role: m.role,
        joined_at: m.created_at,
      }));

    // Check if current user is owner
    const { data: club } = await admin
      .from("clubs")
      .select("owner_id")
      .eq("id", clubId)
      .maybeSingle();

    return jsonOk({
      staff,
      members: regularMembers,
      is_owner: club?.owner_id === user.id,
    });
  } catch (err) {
    console.error("[club-staff] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}
