import { NextRequest } from "next/server";
import { requireAdmin, jsonOk, jsonError } from "@/lib/api/helpers";
import { crmTable } from "@/lib/crm/admin-queries";

/**
 * POST /api/admin/campaigns/[id]/pause
 *
 * Pause an active campaign. Stops new sends from being queued.
 * Existing queued sends remain in the queue but won't be picked up
 * by the cron runner until the campaign is reactivated.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth) return jsonError("Unauthorized", 401);

  const { id } = await params;

  const campaigns = crmTable(auth.admin, "campaigns");

  const { data: campaign } = await campaigns
    .select("id, status")
    .eq("id", id)
    .single();

  if (!campaign) return jsonError("Campaign not found", 404);

  const status = (campaign as Record<string, unknown>).status;
  if (status !== "active") {
    return jsonError(
      `Campaign is ${status} — only active campaigns can be paused`,
      409
    );
  }

  await campaigns
    .update({
      status: "paused",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  // Pause active enrollments
  await crmTable(auth.admin, "campaign_enrollments")
    .update({ status: "paused" })
    .eq("campaign_id", id)
    .eq("status", "active");

  return jsonOk({
    paused: true,
    message: "Campaign paused. Reactivate to resume sending.",
  });
}
