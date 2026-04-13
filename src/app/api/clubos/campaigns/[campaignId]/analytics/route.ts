import { NextRequest } from "next/server";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError, requireAuth, requireClubRole } from "@/lib/api/helpers";
import { P } from "@/lib/permissions/constants";

/**
 * GET /api/clubos/campaigns/[campaignId]/analytics
 *
 * Returns aggregate open/click/bounce stats and per-recipient breakdown.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const auth = await requireAuth();
    if (!auth) return jsonError("Unauthorized", 401);

    const { campaignId } = await params;
    const admin = createUntypedAdminClient();

    // Load campaign
    const { data: campaign } = await admin
      .from("club_campaigns")
      .select("id, club_id, subject, type, status, recipient_count, open_count, click_count, bounce_count, sent_at, created_at")
      .eq("id", campaignId)
      .single();

    if (!campaign) return jsonError("Campaign not found", 404);

    // Verify access
    const role = await requireClubRole(auth.user.id, campaign.club_id, P.MESSAGING_SEND_BULK);
    if (!role?.allowed) return jsonError("Forbidden", 403);

    // Get recipient status breakdown
    const { data: recipients } = await admin
      .from("club_campaign_recipients")
      .select("status, email, sent_at, opened_at, open_count, clicked_at, click_count, bounced_at, bounce_reason, error_message")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: true });

    // Calculate aggregates from actual recipient data (more accurate than denormalized)
    const statusCounts: Record<string, number> = {};
    let totalOpens = 0;
    let totalClicks = 0;
    let uniqueOpens = 0;
    let uniqueClicks = 0;

    for (const r of recipients ?? []) {
      statusCounts[r.status] = (statusCounts[r.status] ?? 0) + 1;
      totalOpens += r.open_count ?? 0;
      totalClicks += r.click_count ?? 0;
      if (r.opened_at) uniqueOpens++;
      if (r.clicked_at) uniqueClicks++;
    }

    const recipientCount = recipients?.length ?? 0;
    const delivered = (statusCounts["delivered"] ?? 0) +
      (statusCounts["opened"] ?? 0) +
      (statusCounts["clicked"] ?? 0);

    return jsonOk({
      campaign: {
        id: campaign.id,
        subject: campaign.subject,
        type: campaign.type,
        status: campaign.status,
        sent_at: campaign.sent_at,
      },
      summary: {
        total_recipients: recipientCount,
        delivered,
        bounced: statusCounts["bounced"] ?? 0,
        failed: statusCounts["failed"] ?? 0,
        skipped: statusCounts["skipped"] ?? 0,
        unique_opens: uniqueOpens,
        total_opens: totalOpens,
        unique_clicks: uniqueClicks,
        total_clicks: totalClicks,
        open_rate: recipientCount > 0
          ? Math.round((uniqueOpens / recipientCount) * 10000) / 100
          : 0,
        click_rate: recipientCount > 0
          ? Math.round((uniqueClicks / recipientCount) * 10000) / 100
          : 0,
        bounce_rate: recipientCount > 0
          ? Math.round(((statusCounts["bounced"] ?? 0) / recipientCount) * 10000) / 100
          : 0,
      },
      status_breakdown: statusCounts,
      recipients: recipients ?? [],
    });
  } catch (err) {
    console.error("[clubos/campaigns/analytics] Error:", err);
    return jsonError("Internal server error", 500);
  }
}
