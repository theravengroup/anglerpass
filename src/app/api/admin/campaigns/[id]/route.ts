import { NextRequest } from "next/server";
import { requireAdmin, jsonOk, jsonError } from "@/lib/api/helpers";
import { updateCampaignSchema } from "@/lib/validations/campaigns";
import type { Json } from "@/types/supabase";

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

  const { data: campaign, error } = await auth.admin.from("campaigns")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !campaign) {
    return jsonError("Campaign not found", 404);
  }

  // Load steps
  const { data: steps } = await auth.admin.from("campaign_steps")
    .select("*")
    .eq("campaign_id", id)
    .order("step_order", { ascending: true });

  // Load segment if referenced
  let segment = null;
  if (campaign.segment_id) {
    const { data: seg } = await auth.admin.from("segments")
      .select("*")
      .eq("id", campaign.segment_id)
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
  const { data: existing } = await auth.admin.from("campaigns")
    .select("id, status")
    .eq("id", id)
    .single();

  if (!existing) {
    return jsonError("Campaign not found", 404);
  }

  if (existing.status !== "draft" && existing.status !== "paused") {
    return jsonError(
      "Only draft or paused campaigns can be edited",
      409
    );
  }

  const { trigger_config, ...rest } = result.data;
  const { data: campaign, error } = await auth.admin.from("campaigns")
    .update({
      ...rest,
      ...(trigger_config !== undefined && {
        trigger_config: trigger_config as Json,
      }),
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
  const { data: existing } = await auth.admin.from("campaigns")
    .select("id, status")
    .eq("id", id)
    .single();

  if (!existing) {
    return jsonError("Campaign not found", 404);
  }

  if (existing.status !== "draft") {
    return jsonError(
      "Only draft campaigns can be deleted. Archive active campaigns instead.",
      409
    );
  }

  // Delete steps first (FK constraint)
  await auth.admin.from("campaign_steps")
    .delete()
    .eq("campaign_id", id);

  // Delete the campaign
  const { error } = await auth.admin.from("campaigns")
    .delete()
    .eq("id", id);

  if (error) {
    return jsonError(`Failed to delete campaign: ${error.message}`, 500);
  }

  return jsonOk({ deleted: true });
}
