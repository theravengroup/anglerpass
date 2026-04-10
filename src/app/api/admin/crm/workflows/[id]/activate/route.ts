import "server-only";

import { requireAdmin, jsonOk, jsonError } from "@/lib/api/helpers";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth) return jsonError("Unauthorized", 401);

  const { id } = await params;

  const { data: workflow } = await auth.admin.from("crm_workflows")
    .select("id, status")
    .eq("id", id)
    .maybeSingle();

  if (!workflow) return jsonError("Workflow not found", 404);

  const status = (workflow as Record<string, unknown>).status;
  if (status !== "draft" && status !== "paused") {
    return jsonError("Only draft or paused workflows can be activated", 409);
  }

  // Verify the workflow has at least a trigger and one action node
  const { data: nodes } = await auth.admin.from("crm_workflow_nodes")
    .select("type")
    .eq("workflow_id", id);

  const nodeTypes = (nodes ?? []).map((n: Record<string, unknown>) => n.type);
  if (!nodeTypes.includes("trigger")) {
    return jsonError("Workflow must have a trigger node", 400);
  }
  if (nodeTypes.length < 2) {
    return jsonError("Workflow must have at least one action node besides the trigger", 400);
  }

  await auth.admin.from("crm_workflows")
    .update({
      status: "active",
      activated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  return jsonOk({ activated: true });
}
