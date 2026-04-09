import "server-only";

import { requireAdmin, jsonOk, jsonError } from "@/lib/api/helpers";
import { crmTable } from "@/lib/crm/admin-queries";
import { z } from "zod";

// ─── GET /api/admin/crm/workflows/[id] ────────────────────────────

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth) return jsonError("Unauthorized", 401);

  const { id } = await params;

  const { data: workflow } = await crmTable(auth.admin, "crm_workflows")
    .select("*")
    .eq("id", id)
    .single();

  if (!workflow) return jsonError("Workflow not found", 404);

  // Load nodes and edges
  const [nodesResult, edgesResult] = await Promise.all([
    crmTable(auth.admin, "crm_workflow_nodes")
      .select("*")
      .eq("workflow_id", id)
      .order("created_at", { ascending: true }),
    crmTable(auth.admin, "crm_workflow_edges")
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

const updateWorkflowSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  trigger_event: z.string().nullable().optional(),
  segment_id: z.string().uuid().nullable().optional(),
  // Save entire graph in one call
  nodes: z.array(z.object({
    id: z.string().uuid().optional(),
    type: z.enum(["trigger", "send_email", "delay", "condition", "split", "end"]),
    label: z.string().max(200),
    config: z.record(z.string(), z.unknown()),
    position_x: z.number(),
    position_y: z.number(),
  })).optional(),
  edges: z.array(z.object({
    id: z.string().uuid().optional(),
    source_node_id: z.string(),
    target_node_id: z.string(),
    source_handle: z.string().default("default"),
  })).optional(),
});

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
  const { data: existing } = await crmTable(auth.admin, "crm_workflows")
    .select("id, status")
    .eq("id", id)
    .single();

  if (!existing) return jsonError("Workflow not found", 404);

  const status = (existing as Record<string, unknown>).status;
  if (status !== "draft" && status !== "paused") {
    return jsonError("Only draft or paused workflows can be edited", 409);
  }

  const { nodes, edges, ...workflowUpdates } = result.data;

  // Update workflow metadata
  if (Object.keys(workflowUpdates).length > 0) {
    await crmTable(auth.admin, "crm_workflows")
      .update({
        ...workflowUpdates,
        updated_at: new Date().toISOString(),
      } as Record<string, unknown>)
      .eq("id", id);
  }

  // Replace nodes if provided
  if (nodes) {
    // Delete existing edges first (FK constraint)
    await crmTable(auth.admin, "crm_workflow_edges")
      .delete()
      .eq("workflow_id", id);

    // Delete existing nodes
    await crmTable(auth.admin, "crm_workflow_nodes")
      .delete()
      .eq("workflow_id", id);

    // Insert new nodes
    const nodeIdMap = new Map<string, string>();

    for (const node of nodes) {
      const clientId = node.id ?? crypto.randomUUID();
      const { data: inserted } = await crmTable(auth.admin, "crm_workflow_nodes")
        .insert({
          workflow_id: id,
          type: node.type,
          label: node.label,
          config: node.config,
          position_x: node.position_x,
          position_y: node.position_y,
        } as Record<string, unknown>)
        .select("id")
        .single();

      if (inserted) {
        nodeIdMap.set(clientId, (inserted as Record<string, unknown>).id as string);
      }
    }

    // Insert edges with remapped node IDs
    if (edges) {
      for (const edge of edges) {
        const sourceId = nodeIdMap.get(edge.source_node_id) ?? edge.source_node_id;
        const targetId = nodeIdMap.get(edge.target_node_id) ?? edge.target_node_id;

        await crmTable(auth.admin, "crm_workflow_edges")
          .insert({
            workflow_id: id,
            source_node_id: sourceId,
            target_node_id: targetId,
            source_handle: edge.source_handle,
          } as Record<string, unknown>);
      }
    }
  }

  // Update timestamp
  await crmTable(auth.admin, "crm_workflows")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", id);

  // Return full workflow
  const [wfResult, nodesResult, edgesResult] = await Promise.all([
    crmTable(auth.admin, "crm_workflows").select("*").eq("id", id).single(),
    crmTable(auth.admin, "crm_workflow_nodes").select("*").eq("workflow_id", id),
    crmTable(auth.admin, "crm_workflow_edges").select("*").eq("workflow_id", id),
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

  const { data: existing } = await crmTable(auth.admin, "crm_workflows")
    .select("id, status")
    .eq("id", id)
    .single();

  if (!existing) return jsonError("Workflow not found", 404);

  if ((existing as Record<string, unknown>).status === "active") {
    return jsonError("Cannot delete an active workflow. Pause it first.", 409);
  }

  // Cascade handles nodes, edges, enrollments, logs
  await crmTable(auth.admin, "crm_workflows").delete().eq("id", id);

  return jsonOk({ deleted: true });
}
