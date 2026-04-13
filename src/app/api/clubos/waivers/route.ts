import { NextRequest } from "next/server";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import {
  jsonOk,
  jsonCreated,
  jsonError,
  requireAuth,
  requireClubRole,
} from "@/lib/api/helpers";
import { P } from "@/lib/permissions/constants";
import { createWaiverSchema } from "@/lib/validations/clubos-operations";

/**
 * POST /api/clubos/waivers — Create a new waiver
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth) return jsonError("Unauthorized", 401);

    const body = await req.json();
    const { club_id, ...waiverData } = body;

    if (!club_id) return jsonError("club_id is required", 400);

    const role = await requireClubRole(auth.user.id, club_id, P.OPS_MANAGE_WAIVERS);
    if (!role?.allowed) return jsonError("Forbidden", 403);

    const parsed = createWaiverSchema.safeParse(waiverData);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0].message, 400);
    }

    const admin = createUntypedAdminClient();
    const data = parsed.data;

    const { data: waiver, error } = await admin
      .from("club_waivers")
      .insert({
        club_id,
        title: data.title,
        body_text: data.body_text,
        requires_annual_renewal: data.requires_annual_renewal,
        created_by: auth.user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("[clubos/waivers] Create failed:", error);
      return jsonError("Failed to create waiver", 500);
    }

    return jsonCreated({ waiver });
  } catch (err) {
    console.error("[clubos/waivers] POST error:", err);
    return jsonError("Internal server error", 500);
  }
}

/**
 * GET /api/clubos/waivers?club_id=...
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth) return jsonError("Unauthorized", 401);

    const { searchParams } = req.nextUrl;
    const clubId = searchParams.get("club_id");
    if (!clubId) return jsonError("club_id is required", 400);

    const admin = createUntypedAdminClient();
    const activeOnly = searchParams.get("active_only") === "true";

    let query = admin
      .from("club_waivers")
      .select("*")
      .eq("club_id", clubId)
      .order("created_at", { ascending: false });

    if (activeOnly) {
      query = query.eq("is_active", true);
    }

    const { data: waivers, error } = await query;

    if (error) {
      console.error("[clubos/waivers] List failed:", error);
      return jsonError("Failed to list waivers", 500);
    }

    return jsonOk({ waivers });
  } catch (err) {
    console.error("[clubos/waivers] GET error:", err);
    return jsonError("Internal server error", 500);
  }
}
