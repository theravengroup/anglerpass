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
import {
  createClubCampaignSchema,
  getCampaignsQuerySchema,
} from "@/lib/validations/clubos-communications";
import { evaluateSegment } from "@/lib/clubos/email-sender";

/**
 * POST /api/clubos/campaigns — Create a new campaign (draft or scheduled)
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth) return jsonError("Unauthorized", 401);

    const body = await req.json();
    const { club_id, ...campaignData } = body;

    if (!club_id) return jsonError("club_id is required", 400);

    // Verify club staff access
    const role = await requireClubRole(auth.user.id, club_id, P.MESSAGING_SEND_BULK);
    if (!role?.allowed) return jsonError("Forbidden", 403);

    const parsed = createClubCampaignSchema.safeParse(campaignData);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0].message, 400);
    }

    const admin = createAdminClient();
    const data = parsed.data;

    // Determine initial status
    const status = data.scheduled_at ? "scheduled" : "draft";

    const { data: campaign, error } = await admin
      .from("club_campaigns")
      .insert({
        club_id,
        type: data.type,
        subject: data.subject,
        body_html: data.body_html,
        body_text: data.body_text ?? "",
        template_id: data.template_id ?? null,
        segment_filters: data.segment_filters ?? null,
        group_id: data.group_id ?? null,
        status,
        scheduled_at: data.scheduled_at ?? null,
        sender_user_id: auth.user.id,
        vertical_context: data.vertical_context ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error("[clubos/campaigns] Create failed:", error);
      return jsonError("Failed to create campaign", 500);
    }

    return jsonCreated({ campaign });
  } catch (err) {
    console.error("[clubos/campaigns] POST error:", err);
    return jsonError("Internal server error", 500);
  }
}

/**
 * GET /api/clubos/campaigns?club_id=...&status=...&page=...&limit=...
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth) return jsonError("Unauthorized", 401);

    const { searchParams } = req.nextUrl;
    const clubId = searchParams.get("club_id");
    if (!clubId) return jsonError("club_id is required", 400);

    const role = await requireClubRole(auth.user.id, clubId, P.MESSAGING_SEND_BULK);
    if (!role?.allowed) return jsonError("Forbidden", 403);

    const queryParsed = getCampaignsQuerySchema.safeParse({
      status: searchParams.get("status") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    if (!queryParsed.success) {
      return jsonError(queryParsed.error.errors[0].message, 400);
    }

    const { status, page, limit } = queryParsed.data;
    const offset = (page - 1) * limit;
    const admin = createAdminClient();

    let query = admin
      .from("club_campaigns")
      .select("*", { count: "exact" })
      .eq("club_id", clubId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }

    const { data: campaigns, count, error } = await query;

    if (error) {
      console.error("[clubos/campaigns] List failed:", error);
      return jsonError("Failed to list campaigns", 500);
    }

    return jsonOk({
      campaigns,
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    });
  } catch (err) {
    console.error("[clubos/campaigns] GET error:", err);
    return jsonError("Internal server error", 500);
  }
}
