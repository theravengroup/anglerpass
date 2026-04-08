import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth, jsonOk, jsonError } from "@/lib/api/helpers";

/**
 * POST /api/corporate-invitations/[id]/revoke
 *
 * Revokes a corporate invitation.
 * - If pending: sets status to 'expired'
 * - If accepted: also sets the resulting employee membership to 'inactive'
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (!auth) return jsonError("Unauthorized", 401);

  const { id } = await params;
  const admin = createAdminClient();

  // ── 1. Fetch the invitation ───────────────────────────────────────
  const { data: invitation, error: invErr } = await admin
    .from("corporate_invitations")
    .select("id, email, status, club_id, corporate_member_id")
    .eq("id", id)
    .maybeSingle() as {
    data: {
      id: string;
      email: string;
      status: string;
      club_id: string;
      corporate_member_id: string;
    } | null;
    error: { message: string } | null;
  };

  if (invErr) {
    console.error("[revoke-invitation] Fetch error:", invErr);
    return jsonError("Internal server error", 500);
  }

  if (!invitation) {
    return jsonError("Invitation not found", 404);
  }

  // ── 2. Verify ownership — user must own the corporate membership ──
  const { data: corporateMembership } = await admin
    .from("club_memberships")
    .select("id, user_id")
    .eq("id", invitation.corporate_member_id)
    .maybeSingle() as {
    data: { id: string; user_id: string | null } | null;
    error: unknown;
  };

  if (
    !corporateMembership ||
    corporateMembership.user_id !== auth.user.id
  ) {
    return jsonError("Forbidden", 403);
  }

  if (invitation.status === "expired" || invitation.status === "inactive") {
    return jsonError("Invitation is already revoked", 400);
  }

  // ── 3. Handle pending invitation ──────────────────────────────────
  if (invitation.status === "pending") {
    const { error: updateErr } = await admin
      .from("corporate_invitations")
      .update({ status: "expired" })
      .eq("id", invitation.id);

    if (updateErr) {
      console.error("[revoke-invitation] Update error:", updateErr);
      return jsonError("Failed to revoke invitation", 500);
    }

    return jsonOk({ revoked: true, action: "expired" });
  }

  // ── 4. Handle accepted invitation — also deactivate the employee membership
  if (invitation.status === "accepted") {
    // Set invitation to expired
    const { error: invUpdateErr } = await admin
      .from("corporate_invitations")
      .update({ status: "expired" })
      .eq("id", invitation.id);

    if (invUpdateErr) {
      console.error("[revoke-invitation] Invitation update error:", invUpdateErr);
      return jsonError("Failed to revoke invitation", 500);
    }

    // Find and deactivate the employee membership
    const { error: memberErr } = await admin
      .from("club_memberships")
      .update({ status: "inactive" })
      .eq("corporate_sponsor_id", invitation.corporate_member_id)
      .eq("invited_email", invitation.email);

    if (memberErr) {
      console.error("[revoke-invitation] Employee deactivation error:", memberErr);
      // Don't fail the request — invitation was already set to expired
    }

    return jsonOk({ revoked: true, action: "deactivated" });
  }

  return jsonError("Cannot revoke invitation in current status", 400);
}
