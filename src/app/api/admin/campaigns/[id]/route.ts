import { NextRequest } from "next/server";
import { requireAdmin, jsonOk, jsonError } from "@/lib/api/helpers";
import { crmTable } from "@/lib/crm/admin-queries";
import { updateCampaignSchema } from "@/lib/validations/campaigns";

/**
 * GET /api/admin/campaigns/[id]
 *
 * Get a single campaign with its steps and segment info.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth) return jsonError("Unauthorized", 401);

  const { id } = await params;

  const { data: campaign, error } = await crmTable(auth.admin, "campaigns")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !campaign) {
    return jsonError("Campaign not found", 404);
  }

  // Load steps
  const { data: steps } = await crmTable(auth.admin, "campaign_steps")
    .select("*")
    .eq("campaign_id", id)
    .order("step_order", { ascending: true });

  // Load segment if referenced
  let segment = null;
  const segmentId = (campaign as Record<string, unknown>).segment_id;
  if (segmentId) {
    const { data: seg } = await crmTable(auth.admin, "segments")
      .select("*")
      .eq("id", segmentId)
      .single();
    segment = seg;
  }

  return jsonOk({
    campaign: {
      ...campaign,
      steps: steps ?? [],
      segment,
    },
  });
}

/**
 * PATCH /api/admin/campaigns/[id]
 *
 * Update a campaign. Only draft/paused campaigns can be edited.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth) return jsonError("Unauthorized", 401);

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const result = updateCampaignSchema.safeParse(body);
  if (!result.success) {
    return jsonError(result.error.issues[0]?.message ?? "Invalid input", 400);
  }

  // Verify campaign exists and is editable
  const { data: existing } = await crmTable(auth.admin, "campaigns")
    .select("id, status")
    .eq("id", id)
    .single();

  if (!existing) {
    return jsonError("Campaign not found", 404);
  }

  const status = (existing as Record<string, unknown>).status;
  if (status !== "draft" && status !== "paused") {
    return jsonError(
      "Only draft or paused campaigns can be edited",
      409
    );
  }

  const { data: campaign, error } = await crmTable(auth.admin, "campaigns")
    .update({
      ...result.data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return jsonError(`Failed to update campaign: ${error.message}`, 500);
  }

  return jsonOk({ campaign });
}

/**
 * DELETE /api/admin/campaigns/[id]
 *
 * Delete a draft campaign and all its steps/sends.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth) return jsonError("Unauthorized", 401);

  const { id } = await params;

  // Only draft campaigns can be deleted
  const { data: existing } = await crmTable(auth.admin, "campaigns")
    .select("id, status")
    .eq("id", id)
    .single();

  if (!existing) {
    return jsonError("Campaign not found", 404);
  }

  if ((existing as Record<string, unknown>).status !== "draft") {
    return jsonError(
      "Only draft campaigns can be deleted. Archive active campaigns instead.",
      409
    );
  }

  // Delete steps first (FK constraint)
  await crmTable(auth.admin, "campaign_steps")
    .delete()
    .eq("campaign_id", id);

  // Delete the campaign
  const { error } = await crmTable(auth.admin, "campaigns")
    .delete()
    .eq("id", id);

  if (error) {
    return jsonError(`Failed to delete campaign: ${error.message}`, 500);
  }

  return jsonOk({ deleted: true });
}
