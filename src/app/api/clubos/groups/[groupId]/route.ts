import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError, requireAuth, requireClubRole } from "@/lib/api/helpers";
import { P } from "@/lib/permissions/constants";
import { updateMemberGroupSchema } from "@/lib/validations/clubos-communications";

/**
 * PATCH /api/clubos/groups/[groupId] — Update a member group
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const auth = await requireAuth();
    if (!auth) return jsonError("Unauthorized", 401);

    const { groupId } = await params;
    const admin = createAdminClient();

    const { data: existing } = await admin
      .from("club_member_groups")
      .select("id, club_id, is_smart")
      .eq("id", groupId)
      .single();

    if (!existing) return jsonError("Group not found", 404);

    const role = await requireClubRole(auth.user.id, existing.club_id, P.CLUB_MANAGE_MEMBERS);
    if (!role?.allowed) return jsonError("Forbidden", 403);

    const body = await req.json();
    const parsed = updateMemberGroupSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0].message, 400);
    }

    const data = parsed.data;

    // Update group metadata
    const updatePayload: Record<string, unknown> = {};
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.smart_filters !== undefined && existing.is_smart) {
      updatePayload.smart_filters = data.smart_filters;
    }

    if (Object.keys(updatePayload).length > 0) {
      const { error } = await admin
        .from("club_member_groups")
        .update(updatePayload)
        .eq("id", groupId);

      if (error) {
        console.error("[clubos/groups] Update failed:", error);
        return jsonError("Failed to update group", 500);
      }
    }

    // For static groups, update member assignments
    if (!existing.is_smart && data.member_ids !== undefined) {
      // Replace all assignments
      await admin
        .from("club_member_group_assignments")
        .delete()
        .eq("group_id", groupId);

      if (data.member_ids.length > 0) {
        const assignments = data.member_ids.map((membershipId) => ({
          group_id: groupId,
          membership_id: membershipId,
          added_by: auth.user.id,
        }));

        await admin
          .from("club_member_group_assignments")
          .insert(assignments);
      }

      // Update denormalized count
      await admin
        .from("club_member_groups")
        .update({ member_count: data.member_ids.length })
        .eq("id", groupId);
    }

    // Return updated group
    const { data: group } = await admin
      .from("club_member_groups")
      .select("*")
      .eq("id", groupId)
      .single();

    return jsonOk({ group });
  } catch (err) {
    console.error("[clubos/groups] PATCH error:", err);
    return jsonError("Internal server error", 500);
  }
}

/**
 * DELETE /api/clubos/groups/[groupId]
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const auth = await requireAuth();
    if (!auth) return jsonError("Unauthorized", 401);

    const { groupId } = await params;
    const admin = createAdminClient();

    const { data: existing } = await admin
      .from("club_member_groups")
      .select("id, club_id")
      .eq("id", groupId)
      .single();

    if (!existing) return jsonError("Group not found", 404);

    const role = await requireClubRole(auth.user.id, existing.club_id, P.CLUB_MANAGE_MEMBERS);
    if (!role?.allowed) return jsonError("Forbidden", 403);

    const { error } = await admin
      .from("club_member_groups")
      .delete()
      .eq("id", groupId);

    if (error) {
      console.error("[clubos/groups] Delete failed:", error);
      return jsonError("Failed to delete group", 500);
    }

    return jsonOk({ deleted: true });
  } catch (err) {
    console.error("[clubos/groups] DELETE error:", err);
    return jsonError("Internal server error", 500);
  }
}
