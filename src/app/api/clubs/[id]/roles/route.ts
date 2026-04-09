import { jsonError, jsonOk, requireAuth} from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { clubRoleAssignSchema } from "@/lib/validations/permissions";
import { authorize, P, auditLog, AuditAction } from "@/lib/permissions";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * PATCH /api/clubs/[id]/roles
 *
 * Assign or change a club member's staff role.
 * Only the club owner can assign staff roles.
 */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id: clubId } = await context.params;
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

    const body = await request.json();
    const result = clubRoleAssignSchema.safeParse(body);

    if (!result.success) {
      return jsonError(result.error.issues[0]?.message ?? "Invalid input", 400);
    }

    const { member_id, role } = result.data;
    const admin = createAdminClient();

    // Authorize: user must have club.manage_staff permission
    const authResult = await authorize({
      permission: P.CLUB_MANAGE_STAFF,
      userId: user.id,
      clubId,
    });

    if (!authResult.allowed) {
      return jsonError("Only the club owner can assign staff roles", 403);
    }

    // Verify the target membership exists in this club
    const { data: membership, error: memError } = await admin
      .from("club_memberships")
      .select("id, user_id, role, status")
      .eq("id", member_id)
      .eq("club_id", clubId)
      .single();

    if (memError || !membership) {
      return jsonError("Member not found in this club", 404);
    }

    // Prevent changing the owner's role
    const { data: club } = await admin
      .from("clubs")
      .select("owner_id")
      .eq("id", clubId)
      .single();

    if (club && membership.user_id === club.owner_id) {
      return jsonError("Cannot change the club owner's role", 400);
    }

    const oldRole = membership.role;

    // Update the role
    const { data: updated, error: updateError } = await admin
      .from("club_memberships")
      .update({
        role,
        updated_at: new Date().toISOString(),
      })
      .eq("id", member_id)
      .select()
      .single();

    if (updateError) {
      console.error("[club-roles] Update error:", updateError);
      return jsonError("Failed to update role", 500);
    }

    auditLog({
      actor_id: user.id,
      action: oldRole === "member"
        ? AuditAction.CLUB_ROLE_ASSIGNED
        : AuditAction.CLUB_ROLE_CHANGED,
      entity_type: "club_membership",
      entity_id: member_id,
      organization_id: clubId,
      old_data: { role: oldRole },
      new_data: { role },
      scope: "organization",
    }).catch((err) => console.error("[club-roles] Audit error:", err));

    return jsonOk({ membership: updated });
  } catch (err) {
    console.error("[club-roles] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}
