import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  jsonOk,
  jsonError,
  requireAuth,
  requireClubRole,
} from "@/lib/api/helpers";
import { P } from "@/lib/permissions/constants";
import { updateIncidentSchema } from "@/lib/validations/clubos-operations";

interface RouteContext {
  params: Promise<{ incidentId: string }>;
}

/**
 * GET /api/clubos/incidents/[incidentId] — Get incident details
 */
export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    const auth = await requireAuth();
    if (!auth) return jsonError("Unauthorized", 401);

    const { incidentId } = await ctx.params;
    const admin = createAdminClient();

    const { data: incident, error } = await admin
      .from("club_incidents")
      .select(`
        *,
        reporter:profiles!club_incidents_reported_by_fkey(full_name, email),
        assignee:profiles!club_incidents_assigned_to_fkey(full_name, email)
      `)
      .eq("id", incidentId)
      .single();

    if (error || !incident) return jsonError("Incident not found", 404);

    // Verify staff access
    const role = await requireClubRole(auth.user.id, incident.club_id, P.OPS_MANAGE_INCIDENTS);
    if (!role?.isStaff) return jsonError("Forbidden", 403);

    return jsonOk({ incident });
  } catch (err) {
    console.error("[clubos/incidents] GET detail error:", err);
    return jsonError("Internal server error", 500);
  }
}

/**
 * PATCH /api/clubos/incidents/[incidentId] — Update an incident
 */
export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    const auth = await requireAuth();
    if (!auth) return jsonError("Unauthorized", 401);

    const { incidentId } = await ctx.params;
    const admin = createAdminClient();

    const { data: existing } = await admin
      .from("club_incidents")
      .select("club_id, status")
      .eq("id", incidentId)
      .single();

    if (!existing) return jsonError("Incident not found", 404);

    const role = await requireClubRole(auth.user.id, existing.club_id, P.OPS_MANAGE_INCIDENTS);
    if (!role?.isStaff) return jsonError("Forbidden", 403);

    const body = await req.json();
    const parsed = updateIncidentSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0].message, 400);
    }

    const updates: Record<string, unknown> = {};
    const data = parsed.data;

    if (data.type !== undefined) updates.type = data.type;
    if (data.severity !== undefined) updates.severity = data.severity;
    if (data.title !== undefined) updates.title = data.title;
    if (data.description !== undefined) updates.description = data.description;
    if (data.resolution !== undefined) updates.resolution = data.resolution;
    if (data.assigned_to !== undefined) updates.assigned_to = data.assigned_to;
    if (data.vertical_context !== undefined) updates.vertical_context = data.vertical_context;

    // Handle status transitions
    if (data.status !== undefined) {
      updates.status = data.status;
      const now = new Date().toISOString();
      if (data.status === "resolved") updates.resolved_at = now;
      if (data.status === "closed") updates.closed_at = now;
    }

    const { data: incident, error } = await admin
      .from("club_incidents")
      .update(updates)
      .eq("id", incidentId)
      .select()
      .single();

    if (error) {
      console.error("[clubos/incidents] Update failed:", error);
      return jsonError("Failed to update incident", 500);
    }

    return jsonOk({ incident });
  } catch (err) {
    console.error("[clubos/incidents] PATCH error:", err);
    return jsonError("Internal server error", 500);
  }
}
