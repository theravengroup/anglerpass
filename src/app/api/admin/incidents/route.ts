import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonCreated, jsonError, requireAdmin } from "@/lib/api/helpers";
import { captureApiError } from "@/lib/observability";
import { z } from "zod";

/**
 * GET /api/admin/incidents — list recent incidents for the admin UI.
 * POST — create a new incident and publish it to /status.
 * PATCH with id — update (e.g. move status from investigating → resolved).
 *
 * Admin-only. The /status page itself reads from `incidents_public`
 * directly with no auth.
 */

const createSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
  status: z.enum(["investigating", "identified", "monitoring", "resolved"]),
  severity: z.enum(["minor", "major", "critical"]),
  affected_systems: z.array(z.string()).default([]),
});

const patchSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200).optional(),
  body: z.string().min(1).max(5000).optional(),
  status: z
    .enum(["investigating", "identified", "monitoring", "resolved"])
    .optional(),
  severity: z.enum(["minor", "major", "critical"]).optional(),
  affected_systems: z.array(z.string()).optional(),
});

export async function GET() {
  const auth = await requireAdmin();
  if (!auth) return jsonError("Forbidden", 403);

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("incidents_public")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(50);

  if (error) {
    captureApiError(error, { route: "admin/incidents" });
    return jsonError("Failed to load incidents", 500);
  }

  return jsonOk({ incidents: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth) return jsonError("Forbidden", 403);

  try {
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(
        parsed.error.issues[0]?.message ?? "Invalid input",
        400
      );
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("incidents_public")
      .insert({
        title: parsed.data.title,
        body: parsed.data.body,
        status: parsed.data.status,
        severity: parsed.data.severity,
        affected_systems: parsed.data.affected_systems,
        created_by: auth.user.id,
        resolved_at:
          parsed.data.status === "resolved" ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) throw error;
    return jsonCreated({ incident: data });
  } catch (err) {
    captureApiError(err, { route: "admin/incidents", userId: auth.user.id });
    return jsonError("Failed to create incident", 500);
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (!auth) return jsonError("Forbidden", 403);

  try {
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(
        parsed.error.issues[0]?.message ?? "Invalid input",
        400
      );
    }

    const { id, ...updates } = parsed.data;
    const resolvedTransition: { resolved_at?: string | null } = {};
    if (updates.status) {
      resolvedTransition.resolved_at =
        updates.status === "resolved" ? new Date().toISOString() : null;
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("incidents_public")
      .update({ ...updates, ...resolvedTransition })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return jsonOk({ incident: data });
  } catch (err) {
    captureApiError(err, { route: "admin/incidents", userId: auth.user.id });
    return jsonError("Failed to update incident", 500);
  }
}
