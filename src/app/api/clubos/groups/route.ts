import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  jsonOk,
  jsonCreated,
  jsonError,
  requireAuth,
  requireClubRole,
} from "@/lib/api/helpers";
import { P } from "@/lib/permissions/constants";
import { createMemberGroupSchema } from "@/lib/validations/clubos-communications";

/**
 * POST /api/clubos/groups — Create a member group (static or smart)
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth) return jsonError("Unauthorized", 401);

    const body = await req.json();
    const { club_id, ...groupData } = body;

    if (!club_id) return jsonError("club_id is required", 400);

    const role = await requireClubRole(auth.user.id, club_id, P.CLUB_MANAGE_MEMBERS);
    if (!role?.allowed) return jsonError("Forbidden", 403);

    const parsed = createMemberGroupSchema.safeParse(groupData);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0].message, 400);
    }

    const admin = createAdminClient();
    const data = parsed.data;

    // Create the group
    const { data: group, error } = await admin
      .from("club_member_groups")
      .insert({
        club_id,
        name: data.name,
        description: data.description ?? null,
        is_smart: data.is_smart,
        smart_filters: data.smart_filters ?? null,
        member_count: data.member_ids?.length ?? 0,
        created_by: auth.user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("[clubos/groups] Create failed:", error);
      return jsonError("Failed to create group", 500);
    }

    // For static groups, add member assignments
    if (!data.is_smart && data.member_ids && data.member_ids.length > 0) {
      const assignments = data.member_ids.map((membershipId) => ({
        group_id: group.id,
        membership_id: membershipId,
        added_by: auth.user.id,
      }));

      const { error: assignError } = await admin
        .from("club_member_group_assignments")
        .insert(assignments);

      if (assignError) {
        console.error("[clubos/groups] Assignment insert failed:", assignError);
        // Group was created, so don't fail the whole request
      }
    }

    return jsonCreated({ group });
  } catch (err) {
    console.error("[clubos/groups] POST error:", err);
    return jsonError("Internal server error", 500);
  }
}

/**
 * GET /api/clubos/groups?club_id=...
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth) return jsonError("Unauthorized", 401);

    const clubId = req.nextUrl.searchParams.get("club_id");
    if (!clubId) return jsonError("club_id is required", 400);

    const role = await requireClubRole(auth.user.id, clubId, P.CLUB_MANAGE_MEMBERS);
    if (!role?.allowed) return jsonError("Forbidden", 403);

    const admin = createAdminClient();

    const { data: groups, error } = await admin
      .from("club_member_groups")
      .select("*")
      .eq("club_id", clubId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[clubos/groups] List failed:", error);
      return jsonError("Failed to list groups", 500);
    }

    return jsonOk({ groups });
  } catch (err) {
    console.error("[clubos/groups] GET error:", err);
    return jsonError("Internal server error", 500);
  }
}
