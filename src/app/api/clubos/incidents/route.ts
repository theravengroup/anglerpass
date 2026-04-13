import { NextRequest } from "next/server";
import type { Json } from "@/types/supabase";
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
  createIncidentSchema,
  getIncidentsQuerySchema,
} from "@/lib/validations/clubos-operations";
import { logMemberActivity } from "@/lib/clubos/activity-logger";

/**
 * POST /api/clubos/incidents — Report a new incident
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth) return jsonError("Unauthorized", 401);

    const body = await req.json();
    const { club_id, ...incidentData } = body;

    if (!club_id) return jsonError("club_id is required", 400);

    // Any club member can report an incident
    const admin = createAdminClient();
    const { data: membership } = await admin
      .from("club_memberships")
      .select("id")
      .eq("club_id", club_id)
      .eq("user_id", auth.user.id)
      .eq("status", "active")
      .maybeSingle();

    if (!membership) return jsonError("Active club membership required", 403);

    const parsed = createIncidentSchema.safeParse(incidentData);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0].message, 400);
    }

    const data = parsed.data;

    const { data: incident, error } = await admin
      .from("club_incidents")
      .insert({
        club_id,
        type: data.type,
        severity: data.severity,
        title: data.title,
        description: data.description,
        occurred_at: data.occurred_at ?? null,
        vertical_context: (data.vertical_context ?? null) as Json,
        reported_by: auth.user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("[clubos/incidents] Create failed:", error);
      return jsonError("Failed to report incident", 500);
    }

    // Log activity
    await logMemberActivity({
      admin,
      membershipId: membership.id,
      clubId: club_id,
      eventType: "incident_reported",
      metadata: { incident_id: incident.id, type: data.type, severity: data.severity },
    });

    return jsonCreated({ incident });
  } catch (err) {
    console.error("[clubos/incidents] POST error:", err);
    return jsonError("Internal server error", 500);
  }
}

/**
 * GET /api/clubos/incidents?club_id=...&status=...&severity=...&type=...
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth) return jsonError("Unauthorized", 401);

    const { searchParams } = req.nextUrl;
    const clubId = searchParams.get("club_id");
    if (!clubId) return jsonError("club_id is required", 400);

    // Only staff can view incident list
    const role = await requireClubRole(auth.user.id, clubId, P.OPS_MANAGE_INCIDENTS);
    if (!role?.isStaff) return jsonError("Forbidden", 403);

    const queryParsed = getIncidentsQuerySchema.safeParse({
      status: searchParams.get("status") ?? undefined,
      severity: searchParams.get("severity") ?? undefined,
      type: searchParams.get("type") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    if (!queryParsed.success) {
      return jsonError(queryParsed.error.issues[0].message, 400);
    }

    const { status, severity, type, page, limit } = queryParsed.data;
    const offset = (page - 1) * limit;
    const admin = createAdminClient();

    let query = admin
      .from("club_incidents")
      .select(`
        *,
        reporter:profiles!club_incidents_reported_by_fkey(full_name, email),
        assignee:profiles!club_incidents_assigned_to_fkey(full_name, email)
      `, { count: "exact" })
      .eq("club_id", clubId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq("status", status);
    if (severity) query = query.eq("severity", severity);
    if (type) query = query.eq("type", type);

    const { data: incidents, count, error } = await query;

    if (error) {
      console.error("[clubos/incidents] List failed:", error);
      return jsonError("Failed to list incidents", 500);
    }

    return jsonOk({
      incidents,
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    });
  } catch (err) {
    console.error("[clubos/incidents] GET error:", err);
    return jsonError("Internal server error", 500);
  }
}
