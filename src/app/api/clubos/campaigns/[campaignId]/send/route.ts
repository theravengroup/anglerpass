import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  jsonOk,
  jsonError,
  requireAuth,
  requireClubRole,
} from "@/lib/api/helpers";
import { P } from "@/lib/permissions/constants";
import {
  evaluateSegment,
  processClubCampaignBatch,
} from "@/lib/clubos/email-sender";
import { isSuppressed } from "@/lib/crm/email-sender";

/**
 * POST /api/clubos/campaigns/[campaignId]/send — Send a campaign immediately
 *
 * 1. Evaluates segment filters / group membership to build recipient list
 * 2. Creates recipient rows with status 'queued'
 * 3. Processes first batch immediately
 * 4. Remaining batches are picked up by the cron job
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const auth = await requireAuth();
    if (!auth) return jsonError("Unauthorized", 401);

    const { campaignId } = await params;
    const admin = createAdminClient();

    // Load campaign
    const { data: campaign, error: campError } = await admin
      .from("club_campaigns")
      .select("*")
      .eq("id", campaignId)
      .single();

    if (campError || !campaign) {
      return jsonError("Campaign not found", 404);
    }

    // Only draft or scheduled campaigns can be sent
    if (!["draft", "scheduled"].includes(campaign.status)) {
      return jsonError(`Campaign cannot be sent (status: ${campaign.status})`, 400);
    }

    // Verify staff access
    const role = await requireClubRole(auth.user.id, campaign.club_id, P.MESSAGING_SEND_BULK);
    if (!role?.allowed) return jsonError("Forbidden", 403);

    // Validate campaign has content
    if (!campaign.subject || !campaign.body_html) {
      return jsonError("Campaign must have a subject and body", 400);
    }

    // Mark as sending
    await admin
      .from("club_campaigns")
      .update({
        status: "sending",
        sending_started_at: new Date().toISOString(),
      })
      .eq("id", campaignId);

    // Build recipient list
    let members: Array<{
      id: string;
      user_id: string;
      profiles: { id: string; email: string; display_name: string | null };
    }>;

    if (campaign.group_id) {
      // Target a specific group
      const { data: assignments } = await admin
        .from("club_member_group_assignments")
        .select("membership_id")
        .eq("group_id", campaign.group_id);

      const membershipIds = (assignments ?? []).map((a) => a.membership_id);

      if (membershipIds.length === 0) {
        await admin
          .from("club_campaigns")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
            recipient_count: 0,
          })
          .eq("id", campaignId);

        return jsonOk({ message: "No members in group", recipientCount: 0 });
      }

      const { data } = await admin
        .from("club_memberships")
        .select("id, user_id, profiles!inner(id, email, display_name)")
        .in("id", membershipIds)
        .eq("status", "active");

      members = (data ?? []) as typeof members;
    } else if (campaign.segment_filters) {
      // Use segment filters
      const { data } = await evaluateSegment(
        admin,
        campaign.club_id,
        campaign.segment_filters as Record<string, unknown>
      );
      members = (data ?? []) as typeof members;
    } else {
      // Broadcast to all active members
      const { data } = await admin
        .from("club_memberships")
        .select("id, user_id, profiles!inner(id, email, display_name)")
        .eq("club_id", campaign.club_id)
        .eq("status", "active");

      members = (data ?? []) as typeof members;
    }

    // Filter out suppressed emails
    const validMembers: typeof members = [];
    for (const m of members) {
      const profile = m.profiles as unknown as {
        id: string;
        email: string;
        display_name: string | null;
      };
      const suppressed = await isSuppressed(admin, profile.email);
      if (!suppressed) {
        validMembers.push(m);
      }
    }

    if (validMembers.length === 0) {
      await admin
        .from("club_campaigns")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          recipient_count: 0,
        })
        .eq("id", campaignId);

      return jsonOk({ message: "No eligible recipients", recipientCount: 0 });
    }

    // Create recipient rows
    const recipientRows = validMembers.map((m) => {
      const profile = m.profiles as unknown as {
        id: string;
        email: string;
        display_name: string | null;
      };
      return {
        campaign_id: campaignId,
        membership_id: m.id,
        email: profile.email,
        status: "queued" as const,
      };
    });

    const { error: insertError } = await admin
      .from("club_campaign_recipients")
      .insert(recipientRows);

    if (insertError) {
      console.error("[clubos/campaigns/send] Recipient insert failed:", insertError);
      await admin
        .from("club_campaigns")
        .update({ status: "failed", failed_reason: "Failed to create recipient list" })
        .eq("id", campaignId);
      return jsonError("Failed to create recipient list", 500);
    }

    // Update recipient count
    await admin
      .from("club_campaigns")
      .update({ recipient_count: validMembers.length })
      .eq("id", campaignId);

    // Process first batch immediately
    const batchResult = await processClubCampaignBatch(admin, campaignId, 50);

    // Check if all recipients are processed
    const { count: remainingCount } = await admin
      .from("club_campaign_recipients")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", campaignId)
      .eq("status", "queued");

    if ((remainingCount ?? 0) === 0) {
      // All sent — mark campaign as complete
      await admin
        .from("club_campaigns")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
        })
        .eq("id", campaignId);
    }
    // Otherwise, the cron job will pick up remaining batches

    return jsonOk({
      message: "Campaign sending started",
      recipientCount: validMembers.length,
      firstBatch: batchResult,
      remainingRecipients: remainingCount ?? 0,
    });
  } catch (err) {
    console.error("[clubos/campaigns/send] Error:", err);
    return jsonError("Internal server error", 500);
  }
}
