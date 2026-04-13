import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  jsonOk,
  jsonCreated,
  jsonError,
  requireAuth,
  requireClubRole,
  isDuplicateError,
} from "@/lib/api/helpers";
import { P } from "@/lib/permissions/constants";
import { logMemberActivity } from "@/lib/clubos/activity-logger";

interface RouteContext {
  params: Promise<{ waiverId: string }>;
}

/**
 * POST /api/clubos/waivers/[waiverId]/signatures — Sign a waiver
 */
export async function POST(req: NextRequest, ctx: RouteContext) {
  try {
    const auth = await requireAuth();
    if (!auth) return jsonError("Unauthorized", 401);

    const { waiverId } = await ctx.params;
    const admin = createAdminClient();

    // Get waiver
    const { data: waiver } = await admin
      .from("club_waivers")
      .select("club_id, is_active, requires_annual_renewal")
      .eq("id", waiverId)
      .single();

    if (!waiver) return jsonError("Waiver not found", 404);
    if (!waiver.is_active) return jsonError("Waiver is no longer active", 400);

    // Get user's membership
    const { data: membership } = await admin
      .from("club_memberships")
      .select("id")
      .eq("club_id", waiver.club_id)
      .eq("user_id", auth.user.id)
      .eq("status", "active")
      .maybeSingle();

    if (!membership) return jsonError("Active club membership required", 403);

    // Calculate expiration if annual renewal required
    const expiresAt = waiver.requires_annual_renewal
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      : null;

    // Get IP and user agent from request
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const userAgent = req.headers.get("user-agent") ?? null;

    const { data: signature, error } = await admin
      .from("club_waiver_signatures")
      .insert({
        waiver_id: waiverId,
        membership_id: membership.id,
        ip_address: ip,
        user_agent: userAgent,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (isDuplicateError(error)) {
      return jsonError("Waiver already signed", 409);
    }

    if (error) {
      console.error("[clubos/waivers/signatures] Sign failed:", error);
      return jsonError("Failed to sign waiver", 500);
    }

    // Log activity
    await logMemberActivity({
      admin,
      membershipId: membership.id,
      clubId: waiver.club_id,
      eventType: "waiver_signed",
      metadata: { waiver_id: waiverId },
    });

    return jsonCreated({ signature });
  } catch (err) {
    console.error("[clubos/waivers/signatures] POST error:", err);
    return jsonError("Internal server error", 500);
  }
}

/**
 * GET /api/clubos/waivers/[waiverId]/signatures — List signatures (staff only)
 */
export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    const auth = await requireAuth();
    if (!auth) return jsonError("Unauthorized", 401);

    const { waiverId } = await ctx.params;
    const admin = createAdminClient();

    // Get waiver to check club
    const { data: waiver } = await admin
      .from("club_waivers")
      .select("club_id")
      .eq("id", waiverId)
      .single();

    if (!waiver) return jsonError("Waiver not found", 404);

    const role = await requireClubRole(auth.user.id, waiver.club_id, P.OPS_MANAGE_WAIVERS);
    if (!role?.isStaff) return jsonError("Forbidden", 403);

    const { data: signatures, error } = await admin
      .from("club_waiver_signatures")
      .select(`
        *,
        membership:club_memberships(
          id,
          user_id,
          profile:profiles(full_name, email)
        )
      `)
      .eq("waiver_id", waiverId)
      .order("signed_at", { ascending: false });

    if (error) {
      console.error("[clubos/waivers/signatures] List failed:", error);
      return jsonError("Failed to list signatures", 500);
    }

    return jsonOk({ signatures });
  } catch (err) {
    console.error("[clubos/waivers/signatures] GET error:", err);
    return jsonError("Internal server error", 500);
  }
}
