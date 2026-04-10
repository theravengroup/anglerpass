import { createAdminClient } from "@/lib/supabase/admin";
import { jsonError, jsonOk, requireAuth } from "@/lib/api/helpers";

/**
 * GET /api/corporate/dashboard
 *
 * Returns the full corporate dashboard data including membership info,
 * club details, employee list, pending invitations, and summary stats.
 */
export async function GET() {
  try {
    const auth = await requireAuth();
    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;
    const admin = createAdminClient();

    // Get corporate membership
    const { data: membership } = await admin
      .from("club_memberships")
      .select("id, club_id, company_name, status, dues_status, joined_at")
      .eq("user_id", user.id)
      .eq("membership_type", "corporate")
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    if (!membership) {
      return jsonError("No active corporate membership", 404);
    }

    // Get club info
    const { data: club } = await admin
      .from("clubs")
      .select("name, location, corporate_initiation_fee, annual_dues")
      .eq("id", membership.club_id)
      .maybeSingle();

    // Get employees (corporate_employee memberships sponsored by this corporate member)
    const { data: employees } = await admin
      .from("club_memberships")
      .select(
        "id, user_id, status, dues_status, joined_at, invited_email"
      )
      .eq("corporate_sponsor_id", membership.id)
      .eq("membership_type", "corporate_employee")
      .order("joined_at", { ascending: false });

    // Get display names for employees with user_ids
    const employeeUserIds = (employees ?? [])
      .map((e) => e.user_id)
      .filter((id): id is string => id !== null);

    const profiles: Record<string, string | null> = {};
    if (employeeUserIds.length > 0) {
      const { data: profileRows } = await admin
        .from("profiles")
        .select("id, display_name")
        .in("id", employeeUserIds);

      for (const p of profileRows ?? []) {
        profiles[p.id] = p.display_name;
      }
    }

    const employeeList = (employees ?? []).map((e) => ({
      id: e.id,
      user_id: e.user_id,
      display_name: e.user_id ? (profiles[e.user_id] ?? null) : null,
      email: e.invited_email,
      status: e.status,
      joined_at: e.joined_at,
    }));

    // Get invitations
    const { data: invitations } = await admin
      .from("corporate_invitations")
      .select("id, email, status, invited_at, accepted_at")
      .eq("corporate_member_id", membership.id)
      .order("invited_at", { ascending: false });

    const activeEmployees = employeeList.filter(
      (e) => e.status === "active"
    ).length;
    const pendingInvitations = (invitations ?? []).filter(
      (i) => i.status === "pending"
    ).length;

    return jsonOk({
      membership,
      club: club ?? { name: "Unknown", location: null },
      employees: employeeList,
      invitations: invitations ?? [],
      summary: {
        activeEmployees,
        pendingInvitations,
        totalTeamSize: activeEmployees + pendingInvitations,
      },
    });
  } catch (err) {
    console.error("[corporate/dashboard] Error:", err);
    return jsonError("Internal server error", 500);
  }
}
