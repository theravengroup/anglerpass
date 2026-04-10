import "server-only";

import { requireAdmin, jsonOk, jsonError, jsonCreated } from "@/lib/api/helpers";
import type { Json } from "@/types/supabase";
import { createWorkflowSchema } from "@/lib/validations/crm";

// ─── GET /api/admin/crm/workflows ─────────────────────────────────

export async function GET() {
  const auth = await requireAdmin();
  if (!auth) return jsonError("Unauthorized", 401);

  const { data: workflows } = await auth.admin.from("crm_workflows")
    .select("*")
    .order("updated_at", { ascending: false });

  // Get node counts per workflow
  const results = [];
  for (const wf of workflows ?? []) {
    const { count } = await auth.admin.from("crm_workflow_nodes")
      .select("id", { count: "exact", head: true })
      .eq("workflow_id", wf.id);

    const { count: enrollmentCount } = await auth.admin.from("crm_workflow_enrollments")
      .select("id", { count: "exact", head: true })
      .eq("workflow_id", wf.id)
      .eq("status", "active");

    results.push({
      ...wf,
      node_count: count ?? 0,
      active_enrollments: enrollmentCount ?? 0,
    });
  }

  return jsonOk({ workflows: results });
}

// ─── POST /api/admin/crm/workflows ────────────────────────────────

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth) return jsonError("Unauthorized", 401);

  const body = await req.json();
  const result = createWorkflowSchema.safeParse(body);
  if (!result.success) {
    return jsonError(result.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const { data: workflow, error } = await auth.admin.from("crm_workflows")
    .insert({
      ...result.data,
      status: "draft",
      created_by: auth.user.id,
    })
    .select()
    .single();

  if (error) {
    return jsonError("Failed to create workflow", 500);
  }

  // Create default trigger node
  await auth.admin.from("crm_workflow_nodes").insert({
    workflow_id: workflow.id,
    type: "trigger",
    label: "Trigger",
    config: { event: result.data.trigger_event ?? null } as Json,
    position_x: 250,
    position_y: 50,
  });

  return jsonCreated({ workflow });
}
