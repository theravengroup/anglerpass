import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  jsonOk,
  jsonError,
  requireAuth,
  requireClubRole,
} from "@/lib/api/helpers";
import { P } from "@/lib/permissions/constants";
import { updateWaiverSchema } from "@/lib/validations/clubos-operations";

interface RouteContext {
  params: Promise<{ waiverId: string }>;
}

/**
 * GET /api/clubos/waivers/[waiverId] — Get waiver details with signature status
 */
export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    const auth = await requireAuth();
    if (!auth) return jsonError("Unauthorized", 401);

    const { waiverId } = await ctx.params;
    const admin = createAdminClient();

    const { data: waiver, error } = await admin
      .from("club_waivers")
      .select("*")
      .eq("id", waiverId)
      .single();

    if (error || !waiver) return jsonError("Waiver not found", 404);

    // Get signature counts
    const { count: signedCount } = await admin
      .from("club_waiver_signatures")
      .select("*", { count: "exact", head: true })
      .eq("waiver_id", waiverId);

    // Get total active members for this club
    const { count: totalMembers } = await admin
      .from("club_memberships")
      .select("*", { count: "exact", head: true })
      .eq("club_id", waiver.club_id)
      .eq("status", "active");

    return jsonOk({
      waiver,
      signature_stats: {
        signed: signedCount ?? 0,
        total_members: totalMembers ?? 0,
      },
    });
  } catch (err) {
    console.error("[clubos/waivers] GET detail error:", err);
    return jsonError("Internal server error", 500);
  }
}

/**
 * PATCH /api/clubos/waivers/[waiverId] — Update a waiver (bumps version if body changes)
 */
export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    const auth = await requireAuth();
    if (!auth) return jsonError("Unauthorized", 401);

    const { waiverId } = await ctx.params;
    const admin = createAdminClient();

    const { data: existing } = await admin
      .from("club_waivers")
      .select("club_id, version, body_text")
      .eq("id", waiverId)
      .single();

    if (!existing) return jsonError("Waiver not found", 404);

    const role = await requireClubRole(auth.user.id, existing.club_id, P.OPS_MANAGE_WAIVERS);
    if (!role?.allowed) return jsonError("Forbidden", 403);

    const body = await req.json();
    const parsed = updateWaiverSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0].message, 400);
    }

    const updates: Record<string, unknown> = {};
    const data = parsed.data;

    if (data.title !== undefined) updates.title = data.title;
    if (data.is_active !== undefined) updates.is_active = data.is_active;
    if (data.requires_annual_renewal !== undefined) updates.requires_annual_renewal = data.requires_annual_renewal;

    // If body text changes, bump version
    if (data.body_text !== undefined && data.body_text !== existing.body_text) {
      updates.body_text = data.body_text;
      updates.version = existing.version + 1;
    }

    const { data: waiver, error } = await admin
      .from("club_waivers")
      .update(updates)
      .eq("id", waiverId)
      .select()
      .single();

    if (error) {
      console.error("[clubos/waivers] Update failed:", error);
      return jsonError("Failed to update waiver", 500);
    }

    return jsonOk({ waiver });
  } catch (err) {
    console.error("[clubos/waivers] PATCH error:", err);
    return jsonError("Internal server error", 500);
  }
}
