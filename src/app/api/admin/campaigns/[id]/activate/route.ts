import { NextRequest } from "next/server";
import { requireAdmin, jsonOk, jsonError } from "@/lib/api/helpers";
import { getSegmentRecipients } from "@/lib/crm/segment-evaluator";
import type { SegmentRuleGroup } from "@/lib/crm/types";

/**
 * POST /api/admin/campaigns/[id]/activate
 *
 * Activate a draft or paused campaign.
 *
 * For broadcasts: immediately enrolls all segment recipients and queues
 * the first step. The cron runner picks up the actual sending.
 *
 * For drip/triggered: sets status to active so new enrollments are
 * processed by the drip runner or trigger system.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth) return jsonError("Unauthorized", 401);

  const { id } = await params;

  const campaigns = auth.admin.from("campaigns");
  const steps = auth.admin.from("campaign_steps");

  // Load campaign
  const { data: campaign } = await campaigns
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!campaign) return jsonError("Campaign not found", 404);

  if (campaign.status !== "draft" && campaign.status !== "paused") {
    return jsonError(
      `Campaign is ${campaign.status} — only draft or paused campaigns can be activated`,
      409
    );
  }

  // Must have at least one step
  const { count: stepCount } = await steps
    .select("*", { count: "exact", head: true })
    .eq("campaign_id", id);

  if (!stepCount || stepCount === 0) {
    return jsonError("Campaign must have at least one step before activation", 400);
  }

  // Activate the campaign
  const now = new Date().toISOString();
  await campaigns
    .update({
      status: "active",
      started_at: campaign.started_at ?? now,
      updated_at: now,
    })
    .eq("id", id);

  // For broadcast campaigns: enroll all segment recipients immediately
  if (campaign.type === "broadcast" && campaign.segment_id) {
    const enrolled = await enrollBroadcastRecipients(
      auth.admin,
      id,
      campaign.segment_id
    );
    return jsonOk({
      activated: true,
      type: "broadcast",
      enrolled,
      message: `Campaign activated. ${enrolled} recipients enrolled for sending.`,
    });
  }

  return jsonOk({
    activated: true,
    type: campaign.type,
    message:
      campaign.type === "triggered"
        ? "Triggered campaign activated. New trigger events will enroll recipients."
        : "Drip campaign activated. The cron runner will process scheduled steps.",
  });
}

// ─── Broadcast Enrollment ───────────────────────────────────────────

import type { SupabaseClient } from "@supabase/supabase-js";

async function enrollBroadcastRecipients(
  admin: SupabaseClient,
  campaignId: string,
  segmentId: string
): Promise<number> {
  // Load segment rules + include_leads flag
  const { data: segment } = await admin.from("segments")
    .select("rules, include_leads")
    .eq("id", segmentId)
    .maybeSingle();

  if (!segment) return 0;

  const segmentRow = segment as { rules: unknown; include_leads: boolean };
  const rules = segmentRow.rules as SegmentRuleGroup[];
  const recipients = await getSegmentRecipients(admin, rules, {
    includeLeads: segmentRow.include_leads,
  });

  if (recipients.length === 0) return 0;

  // Get the first step
  const { data: firstStep } = await admin.from("campaign_steps")
    .select("id, delay_minutes")
    .eq("campaign_id", campaignId)
    .order("step_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!firstStep) return 0;

  const now = new Date();

  // Create enrollments + queue sends in batches
  const enrollments = admin.from("campaign_enrollments");
  const sends = admin.from("campaign_sends");

  let enrolled = 0;

  for (const recipient of recipients) {
    // Check for existing enrollment
    const { data: existing } = await enrollments
      .select("id")
      .eq("campaign_id", campaignId)
      .eq("recipient_email", recipient.email)
      .maybeSingle();

    if (existing) continue;

    // Create enrollment
    await enrollments.insert({
      campaign_id: campaignId,
      recipient_id: recipient.user_id,
      recipient_email: recipient.email,
      recipient_type: recipient.recipient_type,
      lead_id: recipient.lead_id,
      current_step: 1,
      status: "active",
    });

    // Queue the first send
    const scheduledFor = new Date(
      now.getTime() + firstStep.delay_minutes * 60_000
    );

    await sends.insert({
      campaign_id: campaignId,
      step_id: firstStep.id,
      recipient_id: recipient.user_id,
      recipient_email: recipient.email,
      recipient_type: recipient.recipient_type,
      lead_id: recipient.lead_id,
      status: "queued",
      drip_scheduled_for: scheduledFor.toISOString(),
    });

    enrolled++;
  }

  return enrolled;
}
