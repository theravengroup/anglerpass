import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth, jsonOk, jsonError } from "@/lib/api/helpers";

/**
 * GET /api/anglers/corporate-dashboard
 *
 * Returns all data needed to render the corporate management dashboard
 * for the authenticated corporate member.
 */
export async function GET(_request: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return jsonError("Unauthorized", 401);

  const admin = createAdminClient();

  // ── 1. Find the user's corporate membership ───────────────────────
  const { data: membership, error: membershipErr } = await admin
    .from("club_memberships")
    .select(
      "id, club_id, company_name, status, dues_status, joined_at, created_at"
    )
    .eq("user_id", auth.user.id)
    .eq("membership_type", "corporate")
    .in("status", ["active", "pending"])
    .maybeSingle() as {
    data: {
      id: string;
      club_id: string;
      company_name: string | null;
      status: string;
      dues_status: string | null;
      joined_at: string | null;
      created_at: string;
    } | null;
    error: { message: string } | null;
  };

  if (membershipErr) {
    console.error("[corporate-dashboard] Membership query error:", membershipErr);
    return jsonError("Internal server error", 500);
  }

  if (!membership) {
    return jsonError("No corporate membership found", 404);
  }

  // ── 2. Fetch club info ────────────────────────────────────────────
  const { data: club } = await admin
    .from("clubs")
    .select("name, location")
    .eq("id", membership.club_id)
    .single() as {
    data: { name: string; location: string | null } | null;
    error: { message: string } | null;
  };

  // ── 3. Fetch employees (members sponsored by this corporate membership) ──
  const { data: employeeRows, error: employeeErr } = await admin
    .from("club_memberships")
    .select("id, user_id, invited_email, status, dues_status, joined_at")
    .eq("corporate_sponsor_id", membership.id) as {
    data: Array<{
      id: string;
      user_id: string | null;
      invited_email: string | null;
      status: string;
      dues_status: string | null;
      joined_at: string | null;
    }> | null;
    error: { message: string } | null;
  };

  if (employeeErr) {
    console.error("[corporate-dashboard] Employee query error:", employeeErr);
    return jsonError("Internal server error", 500);
  }

  // Fetch profiles + emails for all employees
  const employeeUserIds = (employeeRows ?? [])
    .map((e) => e.user_id)
    .filter((id): id is string => id !== null);

  const profileMap = new Map<string, { display_name: string | null }>();
  if (employeeUserIds.length > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, display_name")
      .in("id", employeeUserIds) as {
      data: Array<{ id: string; display_name: string | null }> | null;
      error: unknown;
    };
    for (const p of profiles ?? []) {
      profileMap.set(p.id, { display_name: p.display_name });
    }
  }

  // Fetch auth emails for employees
  const emailMap = new Map<string, string>();
  for (const userId of employeeUserIds) {
    const { data: authUser } = await admin.auth.admin.getUserById(userId);
    if (authUser?.user?.email) {
      emailMap.set(userId, authUser.user.email);
    }
  }

  const employees = (employeeRows ?? []).map((e) => ({
    id: e.id,
    user_id: e.user_id,
    display_name: e.user_id ? (profileMap.get(e.user_id)?.display_name ?? null) : null,
    email: e.user_id ? (emailMap.get(e.user_id) ?? e.invited_email) : e.invited_email,
    status: e.status,
    dues_status: e.dues_status,
    joined_at: e.joined_at,
  }));

  // ── 4. Fetch invitations ──────────────────────────────────────────
  const { data: invitations, error: invErr } = await admin
    .from("corporate_invitations")
    .select("id, email, status, invited_at, accepted_at")
    .eq("corporate_member_id", membership.id)
    .order("invited_at", { ascending: false }) as {
    data: Array<{
      id: string;
      email: string;
      status: string;
      invited_at: string;
      accepted_at: string | null;
    }> | null;
    error: { message: string } | null;
  };

  if (invErr) {
    console.error("[corporate-dashboard] Invitations query error:", invErr);
    return jsonError("Internal server error", 500);
  }

  // ── 5. Compute summary ─────────────────────────────────────────────
  const activeEmployees = employees.filter((e) => e.status === "active").length;
  const pendingInvitations = (invitations ?? []).filter(
    (i) => i.status === "pending"
  ).length;
  const totalTeamSize = employees.length;

  return jsonOk({
    membership: {
      id: membership.id,
      club_id: membership.club_id,
      company_name: membership.company_name,
      status: membership.status,
      dues_status: membership.dues_status,
      joined_at: membership.joined_at ?? membership.created_at,
    },
    club: {
      name: club?.name ?? "Unknown Club",
      location: club?.location ?? null,
    },
    employees,
    invitations: invitations ?? [],
    summary: {
      activeEmployees,
      pendingInvitations,
      totalTeamSize,
    },
  });
}
