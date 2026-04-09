import "server-only";

import { requireAdmin, jsonOk, jsonError, jsonCreated } from "@/lib/api/helpers";
import { crmTable } from "@/lib/crm/admin-queries";
import { z } from "zod";

// ─── GET /api/admin/crm/workflows ─────────────────────────────────

export async function GET() {
  const auth = await requireAdmin();
  if (!auth) return jsonError("Unauthorized", 401);

  const { data: workflows } = await crmTable(auth.admin, "crm_workflows")
    .select("*")
    .order("updated_at", { ascending: false });

  // Get node counts per workflow
  const results = [];
  for (const wf of workflows ?? []) {
    const w = wf as Record<string, unknown>;
    const { count } = await crmTable(auth.admin, "crm_workflow_nodes")
      .select("id", { count: "exact", head: true })
      .eq("workflow_id", w.id);

    const { count: enrollmentCount } = await crmTable(auth.admin, "crm_workflow_enrollments")
      .select("id", { count: "exact", head: true })
      .eq("workflow_id", w.id)
      .eq("status", "active");

    results.push({
      ...w,
      node_count: count ?? 0,
      active_enrollments: enrollmentCount ?? 0,
    });
  }

  return jsonOk({ workflows: results });
}

// ─── POST /api/admin/crm/workflows ────────────────────────────────

const createWorkflowSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  trigger_event: z.string().optional(),
  segment_id: z.string().uuid().optional(),
});

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth) return jsonError("Unauthorized", 401);

  const body = await req.json();
  const result = createWorkflowSchema.safeParse(body);
  if (!result.success) {
    return jsonError(result.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const { data: workflow, error } = await crmTable(auth.admin, "crm_workflows")
    .insert({
      ...result.data,
      status: "draft",
      created_by: auth.user.id,
    } as Record<string, unknown>)
    .select()
    .single();

  if (error) {
    return jsonError("Failed to create workflow", 500);
  }

  // Create default trigger node
  const wfId = (workflow as Record<string, unknown>).id;
  await crmTable(auth.admin, "crm_workflow_nodes").insert({
    workflow_id: wfId,
    type: "trigger",
    label: "Trigger",
    config: { event: result.data.trigger_event ?? null },
    position_x: 250,
    position_y: 50,
  } as Record<string, unknown>);

  return jsonCreated({ workflow });
}
