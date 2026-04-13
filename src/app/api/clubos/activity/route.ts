import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  jsonOk,
  jsonError,
  requireAuth,
  requireClubRole,
} from "@/lib/api/helpers";
import { P } from "@/lib/permissions/constants";

/**
 * GET /api/clubos/activity?club_id=...&membership_id=...&event_type=...&limit=...&offset=...
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth) return jsonError("Unauthorized", 401);

    const { searchParams } = req.nextUrl;
    const clubId = searchParams.get("club_id");
    if (!clubId) return jsonError("club_id is required", 400);

    const role = await requireClubRole(auth.user.id, clubId, P.OPS_VIEW_ACTIVITY);
    if (!role?.isStaff) return jsonError("Forbidden", 403);

    const admin = createAdminClient();
    const membershipId = searchParams.get("membership_id");
    const eventType = searchParams.get("event_type");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10) || 50, 200);
    const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10) || 1, 1);
    const offset = (page - 1) * limit;

    let query = admin
      .from("club_member_activity_events")
      .select(
        "*, membership:club_memberships(id, user_id, profile:profiles(full_name, email))",
        { count: "exact" },
      )
      .eq("club_id", clubId)
      .order("occurred_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (membershipId) query = query.eq("membership_id", membershipId);
    if (eventType) query = query.eq("event_type", eventType);

    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");
    if (dateFrom) query = query.gte("occurred_at", dateFrom);
    if (dateTo) query = query.lte("occurred_at", dateTo);

    const { data: events, count, error } = await query;

    if (error) {
      console.error("[clubos/activity] List failed:", error);
      return jsonError("Failed to list activity", 500);
    }

    return jsonOk({
      events,
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    });
  } catch (err) {
    console.error("[clubos/activity] GET error:", err);
    return jsonError("Internal server error", 500);
  }
}
