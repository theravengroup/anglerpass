import { jsonError, jsonOk, requireAuth} from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createUntypedAdminClient } from "@/lib/supabase/untyped-admin";
import { clubMemberStatusSchema } from "@/lib/validations/clubs";
import { notifyMemberApproved } from "@/lib/notifications";
import { fireCrmTrigger } from "@/lib/crm/triggers";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Check if the user is a club owner or active staff member.
 * Returns { club, isOwner } on success, or null if unauthorized.
 */
async function verifyClubManager(
  admin: SupabaseClient,
  clubId: string,
  userId: string
): Promise<{ club: { owner_id: string; name: string }; isOwner: boolean } | null> {
  const { data: club } = await admin
    .from("clubs")
    .select("owner_id, name")
    .eq("id", clubId)
    .single();

  if (!club) return null;

  if (club.owner_id === userId) return { club, isOwner: true };

  const { data: staffMembership } = await admin
    .from("club_memberships")
    .select("id")
    .eq("club_id", clubId)
    .eq("user_id", userId)
    .eq("role", "staff")
    .eq("status", "active")
    .maybeSingle();

  if (staffMembership) return { club, isOwner: false };

  return null;
}

// PATCH: Update member status (approve, decline, deactivate)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id, memberId } = await params;
    const authResult = await requireAuth();

    if (!authResult) return jsonError("Unauthorized", 401);

    const { user } = authResult;

    const admin = createAdminClient();

    // Verify user is club owner or staff
    const clubAuth = await verifyClubManager(admin, id, user.id);
    if (!clubAuth) {
      return jsonError("Forbidden", 403);
    }

    // Verify the membership belongs to this club
    const { data: membership } = await admin
      .from("club_memberships")
      .select("id, user_id, status, role")
      .eq("id", memberId)
      .eq("club_id", id)
      .single();

    if (!membership) {
      return jsonError("Membership not found", 404);
    }

    // Don't allow modifying the club owner's membership
    if (membership.role === "admin") {
      return jsonError("Cannot modify the club owner's membership", 400);
    }

    // Staff cannot modify other staff members — only the owner can
    if (!clubAuth.isOwner && membership.role === "staff") {
      return jsonError("Only the club owner can manage staff members", 403);
    }

    const body = await request.json();
    const result = clubMemberStatusSchema.safeParse(body);

    if (!result.success) {
      return jsonError(result.error.issues[0]?.message ?? "Invalid input", 400);
    }

    const updates: Record<string, unknown> = {
      status: result.data.status,
      updated_at: new Date().toISOString(),
    };

    // Set joined_at when activating
    if (result.data.status === "active" && membership.status === "pending") {
      updates.joined_at = new Date().toISOString();
    }

    // Store decline reason in removal_reason field
    if (result.data.status === "declined" && result.data.decline_reason) {
      updates.removal_reason = result.data.decline_reason;
    }

    const { data: updated, error: updateError } = await admin
      .from("club_memberships")
      .update(updates)
      .eq("id", memberId)
      .select()
      .single();

    if (updateError) {
      console.error("[clubs/members] Update error:", updateError);
      return jsonError("Failed to update membership", 500);
    }

    // Notify member if approved
    if (
      result.data.status === "active" &&
      membership.status === "pending" &&
      membership.user_id
    ) {
      notifyMemberApproved(admin, {
        userId: membership.user_id,
        clubName: clubAuth.club.name,
        clubId: id,
      }).catch((err) =>
        console.error("[clubs/members] Notification error:", err)
      );

      // Fire CRM trigger for membership activation
      fireCrmTrigger("membership_joined", {
        userId: membership.user_id,
      }).catch((err) =>
        console.error("[clubs/members] CRM trigger error:", err)
      );

      // Transition referral credit from pending → earned
      const db = createUntypedAdminClient();
      db.from("referral_credits")
        .update({
          status: "earned",
          earned_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("referred_membership_id", memberId)
        .eq("status", "pending")
        .then(({ error: creditErr }) => {
          if (creditErr) console.error("[clubs/members] Referral credit update error:", creditErr);
        });
    }

    return jsonOk({ membership: updated });
  } catch (err) {
    console.error("[clubs/members] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}

// DELETE: Remove a member
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id, memberId } = await params;
    const authResult = await requireAuth();

    if (!authResult) return jsonError("Unauthorized", 401);

    const { user } = authResult;

    const admin = createAdminClient();

    // Verify user is club owner or staff
    const clubAuth = await verifyClubManager(admin, id, user.id);
    if (!clubAuth) {
      return jsonError("Forbidden", 403);
    }

    // Verify the membership and check permissions
    const { data: membership } = await admin
      .from("club_memberships")
      .select("role")
      .eq("id", memberId)
      .eq("club_id", id)
      .single();

    if (!membership) {
      return jsonError("Membership not found", 404);
    }

    if (membership.role === "admin") {
      return jsonError("Cannot remove the club owner", 400);
    }

    // Staff cannot remove other staff — only the owner can
    if (!clubAuth.isOwner && membership.role === "staff") {
      return jsonError("Only the club owner can remove staff members", 403);
    }

    const { error: deleteError } = await admin
      .from("club_memberships")
      .delete()
      .eq("id", memberId);

    if (deleteError) {
      console.error("[clubs/members] Delete error:", deleteError);
      return jsonError("Failed to remove member", 500);
    }

    return jsonOk({ success: true });
  } catch (err) {
    console.error("[clubs/members] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}
