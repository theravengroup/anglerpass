import { NextRequest } from "next/server";
import { requireAdmin, jsonOk, jsonError } from "@/lib/api/helpers";
import { updateStepSchema } from "@/lib/validations/campaigns";

/**
 * PATCH /api/admin/campaigns/[id]/steps/[stepId]
 *
 * Update a campaign step. Campaign must be draft or paused.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  const auth = await requireAdmin();
  if (!auth) return jsonError("Unauthorized", 401);

  const { id, stepId } = await params;

  // Verify campaign is editable
  const { data: campaign } = await auth.admin.from("campaigns")
    .select("id, status")
    .eq("id", id)
    .maybeSingle();

  if (!campaign) return jsonError("Campaign not found", 404);

  const status = (campaign as Record<string, unknown>).status;
  if (status !== "draft" && status !== "paused") {
    return jsonError("Only draft or paused campaigns can be edited", 409);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const result = updateStepSchema.safeParse(body);
  if (!result.success) {
    return jsonError(result.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const { data: step, error } = await auth.admin.from("campaign_steps")
    .update({
      ...result.data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", stepId)
    .eq("campaign_id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    return jsonError(`Failed to update step: ${error.message}`, 500);
  }

  return jsonOk({ step });
}

/**
 * DELETE /api/admin/campaigns/[id]/steps/[stepId]
 *
 * Delete a campaign step. Campaign must be draft.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  const auth = await requireAdmin();
  if (!auth) return jsonError("Unauthorized", 401);

  const { id, stepId } = await params;

  // Verify campaign is draft
  const { data: campaign } = await auth.admin.from("campaigns")
    .select("id, status")
    .eq("id", id)
    .maybeSingle();

  if (!campaign) return jsonError("Campaign not found", 404);

  if ((campaign as Record<string, unknown>).status !== "draft") {
    return jsonError("Steps can only be deleted from draft campaigns", 409);
  }

  const { error } = await auth.admin.from("campaign_steps")
    .delete()
    .eq("id", stepId)
    .eq("campaign_id", id);

  if (error) {
    return jsonError(`Failed to delete step: ${error.message}`, 500);
  }

  return jsonOk({ deleted: true });
}
