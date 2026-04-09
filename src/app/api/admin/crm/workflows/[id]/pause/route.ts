import "server-only";

import { requireAdmin, jsonOk, jsonError } from "@/lib/api/helpers";
import { crmTable } from "@/lib/crm/admin-queries";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth) return jsonError("Unauthorized", 401);

  const { id } = await params;

  const { data: workflow } = await crmTable(auth.admin, "crm_workflows")
    .select("id, status")
    .eq("id", id)
    .single();

  if (!workflow) return jsonError("Workflow not found", 404);

  if ((workflow as Record<string, unknown>).status !== "active") {
    return jsonError("Only active workflows can be paused", 409);
  }

  // Pause workflow and all active enrollments
  await Promise.all([
    crmTable(auth.admin, "crm_workflows")
      .update({
        status: "paused",
        paused_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id),
    crmTable(auth.admin, "crm_workflow_enrollments")
      .update({ status: "paused" })
      .eq("workflow_id", id)
      .eq("status", "active"),
  ]);

  return jsonOk({ paused: true });
}
