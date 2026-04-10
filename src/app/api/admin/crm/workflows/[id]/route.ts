import "server-only";

import { requireAdmin, jsonOk, jsonError } from "@/lib/api/helpers";
import type { Json } from "@/types/supabase";
import { updateWorkflowSchema } from "@/lib/validations/crm";

// ─── GET /api/admin/crm/workflows/[id] ────────────────────────────

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth) return jsonError("Unauthorized", 401);

  const { id } = await params;

  const { data: workflow } = await auth.admin.from("crm_workflows")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!workflow) return jsonError("Workflow not found", 404);

  // Load nodes and edges
  const [nodesResult, edgesResult] = await Promise.all([
    auth.admin.from("crm_workflow_nodes")
      .select("*")
      .eq("workflow_id", id)
      .order("created_at", { ascending: true }),
    auth.admin.from("crm_workflow_edges")
      .select("*")
      .eq("workflow_id", id),
  ]);

  return jsonOk({
    workflow: {
      ...workflow,
      nodes: nodesResult.data ?? [],
      edges: edgesResult.data ?? [],
    },
  });
}

// ─── PATCH /api/admin/crm/workflows/[id] ──────────────────────────

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth) return jsonError("Unauthorized", 401);

  const { id } = await params;
  const body = await req.json();
  const result = updateWorkflowSchema.safeParse(body);
  if (!result.success) {
    return jsonError(result.error.issues[0]?.message ?? "Invalid input", 400);
  }

  // Verify workflow exists and is editable
  const { data: existing } = await auth.admin.from("crm_workflows")
    .select("id, status")
    .eq("id", id)
    .maybeSingle();

  if (!existing) return jsonError("Workflow not found", 404);

  if (existing.status !== "draft" && existing.status !== "paused") {
    return jsonError("Only draft or paused workflows can be edited", 409);
  }

  const { nodes, edges, ...workflowUpdates } = result.data;

  // Update workflow metadata
  if (Object.keys(workflowUpdates).length > 0) {
    await auth.admin.from("crm_workflows")
      .update({
        ...workflowUpdates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
  }

  // Replace nodes if provided
  if (nodes) {
    // Delete existing edges first (FK constraint)
    await auth.admin.from("crm_workflow_edges")
      .delete()
      .eq("workflow_id", id);

    // Delete existing nodes
    await auth.admin.from("crm_workflow_nodes")
      .delete()
      .eq("workflow_id", id);

    // Insert new nodes
    const nodeIdMap = new Map<string, string>();

    for (const node of nodes) {
      const clientId = node.id ?? crypto.randomUUID();
      const { data: inserted } = await auth.admin.from("crm_workflow_nodes")
        .insert({
          workflow_id: id,
          type: node.type,
          label: node.label,
          config: node.config as Json,
          position_x: node.position_x,
          position_y: node.position_y,
        })
        .select("id")
        .single();

      if (inserted) {
        nodeIdMap.set(clientId, inserted.id);
      }
    }

    // Insert edges with remapped node IDs
    if (edges) {
      for (const edge of edges) {
        const sourceId = nodeIdMap.get(edge.source_node_id) ?? edge.source_node_id;
        const targetId = nodeIdMap.get(edge.target_node_id) ?? edge.target_node_id;

        await auth.admin.from("crm_workflow_edges")
          .insert({
            workflow_id: id,
            source_node_id: sourceId,
            target_node_id: targetId,
            source_handle: edge.source_handle,
          });
      }
    }
  }

  // Update timestamp
  await auth.admin.from("crm_workflows")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", id);

  // Return full workflow
  const [wfResult, nodesResult, edgesResult] = await Promise.all([
    auth.admin.from("crm_workflows").select("*").eq("id", id).maybeSingle(),
    auth.admin.from("crm_workflow_nodes").select("*").eq("workflow_id", id),
    auth.admin.from("crm_workflow_edges").select("*").eq("workflow_id", id),
  ]);

  return jsonOk({
    workflow: {
      ...wfResult.data,
      nodes: nodesResult.data ?? [],
      edges: edgesResult.data ?? [],
    },
  });
}

// ─── DELETE /api/admin/crm/workflows/[id] ─────────────────────────

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth) return jsonError("Unauthorized", 401);

  const { id } = await params;

  const { data: existing } = await auth.admin.from("crm_workflows")
    .select("id, status")
    .eq("id", id)
    .maybeSingle();

  if (!existing) return jsonError("Workflow not found", 404);

  if (existing.status === "active") {
    return jsonError("Cannot delete an active workflow. Pause it first.", 409);
  }

  // Cascade handles nodes, edges, enrollments, logs
  await auth.admin.from("crm_workflows").delete().eq("id", id);

  return jsonOk({ deleted: true });
}
