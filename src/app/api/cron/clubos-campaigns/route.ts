import { NextRequest } from "next/server";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { processClubCampaignBatch } from "@/lib/clubos/email-sender";

/**
 * GET /api/cron/clubos-campaigns — Cron job for scheduled campaign sends
 *
 * Runs every 5 minutes via Vercel Cron. Handles:
 * 1. Campaigns whose scheduled_at is past due → starts sending
 * 2. In-progress campaigns with remaining queued recipients → sends next batch
 */
export async function GET(req: NextRequest) {
  // Verify cron secret (Vercel sets this header)
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const admin = createUntypedAdminClient();
  const results: Array<{
    campaignId: string;
    action: string;
    result: { sent: number; skipped: number; failed: number };
  }> = [];

  try {
    // 1. Find scheduled campaigns that are due
    const now = new Date().toISOString();
    const { data: dueCampaigns } = await admin
      .from("club_campaigns")
      .select("id, club_id, type, subject, body_html, segment_filters, group_id")
      .eq("status", "scheduled")
      .lte("scheduled_at", now)
      .order("scheduled_at", { ascending: true })
      .limit(10); // Process up to 10 scheduled campaigns per run

    for (const campaign of dueCampaigns ?? []) {
      // Transition to sending and create recipient list
      await admin
        .from("club_campaigns")
        .update({
          status: "sending",
          sending_started_at: now,
        })
        .eq("id", campaign.id);

      // Build recipient list (same logic as the send endpoint)
      let memberQuery = admin
        .from("club_memberships")
        .select("id, user_id, profiles!inner(id, email, display_name)")
        .eq("club_id", campaign.club_id)
        .eq("status", "active");

      if (campaign.group_id) {
        const { data: assignments } = await admin
          .from("club_member_group_assignments")
          .select("membership_id")
          .eq("group_id", campaign.group_id);

        const membershipIds = (assignments ?? []).map((a) => a.membership_id);
        if (membershipIds.length > 0) {
          memberQuery = memberQuery.in("id", membershipIds);
        } else {
          // Empty group — mark as sent
          await admin
            .from("club_campaigns")
            .update({ status: "sent", sent_at: now, recipient_count: 0 })
            .eq("id", campaign.id);
          results.push({
            campaignId: campaign.id,
            action: "scheduled_empty",
            result: { sent: 0, skipped: 0, failed: 0 },
          });
          continue;
        }
      }

      const { data: members } = await memberQuery;

      if (!members || members.length === 0) {
        await admin
          .from("club_campaigns")
          .update({ status: "sent", sent_at: now, recipient_count: 0 })
          .eq("id", campaign.id);
        results.push({
          campaignId: campaign.id,
          action: "scheduled_no_members",
          result: { sent: 0, skipped: 0, failed: 0 },
        });
        continue;
      }

      // Create recipient rows
      const recipientRows = members.map((m) => {
        const profile = (m as unknown as { profiles: { email: string } }).profiles;
        return {
          campaign_id: campaign.id,
          membership_id: m.id,
          email: profile.email,
          status: "queued" as const,
        };
      });

      await admin.from("club_campaign_recipients").insert(recipientRows);
      await admin
        .from("club_campaigns")
        .update({ recipient_count: members.length })
        .eq("id", campaign.id);

      // Process first batch
      const batchResult = await processClubCampaignBatch(admin, campaign.id, 50);
      results.push({
        campaignId: campaign.id,
        action: "scheduled_started",
        result: batchResult,
      });
    }

    // 2. Continue sending for in-progress campaigns
    const { data: sendingCampaigns } = await admin
      .from("club_campaigns")
      .select("id")
      .eq("status", "sending")
      .order("sending_started_at", { ascending: true })
      .limit(10);

    for (const campaign of sendingCampaigns ?? []) {
      // Check if there are queued recipients remaining
      const { count: queuedCount } = await admin
        .from("club_campaign_recipients")
        .select("id", { count: "exact", head: true })
        .eq("campaign_id", campaign.id)
        .eq("status", "queued");

      if ((queuedCount ?? 0) === 0) {
        // All done — mark campaign as sent
        await admin
          .from("club_campaigns")
          .update({ status: "sent", sent_at: now })
          .eq("id", campaign.id);

        results.push({
          campaignId: campaign.id,
          action: "completed",
          result: { sent: 0, skipped: 0, failed: 0 },
        });
        continue;
      }

      // Send next batch
      const batchResult = await processClubCampaignBatch(admin, campaign.id, 50);
      results.push({
        campaignId: campaign.id,
        action: "batch_sent",
        result: batchResult,
      });

      // Check if that was the last batch
      const { count: remaining } = await admin
        .from("club_campaign_recipients")
        .select("id", { count: "exact", head: true })
        .eq("campaign_id", campaign.id)
        .eq("status", "queued");

      if ((remaining ?? 0) === 0) {
        await admin
          .from("club_campaigns")
          .update({ status: "sent", sent_at: now })
          .eq("id", campaign.id);
      }
    }

    return Response.json({
      ok: true,
      processed: results.length,
      results,
    });
  } catch (err) {
    console.error("[cron/clubos-campaigns] Error:", err);
    return Response.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
