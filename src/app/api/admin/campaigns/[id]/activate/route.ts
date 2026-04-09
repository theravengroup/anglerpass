import { NextRequest } from "next/server";
import { requireAdmin, jsonOk, jsonError } from "@/lib/api/helpers";
import { crmTable } from "@/lib/crm/admin-queries";
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

  const campaigns = crmTable(auth.admin, "campaigns");
  const steps = crmTable(auth.admin, "campaign_steps");

  // Load campaign
  const { data: campaign } = await campaigns
    .select("*")
    .eq("id", id)
    .single();

  if (!campaign) return jsonError("Campaign not found", 404);

  const c = campaign as Record<string, unknown>;

  if (c.status !== "draft" && c.status !== "paused") {
    return jsonError(
      `Campaign is ${c.status} — only draft or paused campaigns can be activated`,
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
      started_at: c.started_at ?? now,
      updated_at: now,
    })
    .eq("id", id);

  // For broadcast campaigns: enroll all segment recipients immediately
  if (c.type === "broadcast" && c.segment_id) {
    const enrolled = await enrollBroadcastRecipients(
      auth.admin,
      id,
      c.segment_id as string
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
    type: c.type,
    message:
      c.type === "triggered"
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
  // Load segment rules
  const { data: segment } = await crmTable(admin, "segments")
    .select("rules")
    .eq("id", segmentId)
    .single();

  if (!segment) return 0;

  const rules = (segment as Record<string, unknown>).rules as SegmentRuleGroup[];
  const recipients = await getSegmentRecipients(admin, rules);

  if (recipients.length === 0) return 0;

  // Get the first step
  const { data: firstStep } = await crmTable(admin, "campaign_steps")
    .select("id, delay_minutes")
    .eq("campaign_id", campaignId)
    .order("step_order", { ascending: true })
    .limit(1)
    .single();

  if (!firstStep) return 0;

  const step = firstStep as Record<string, unknown>;
  const now = new Date();

  // Create enrollments + queue sends in batches
  const enrollments = crmTable(admin, "campaign_enrollments");
  const sends = crmTable(admin, "campaign_sends");

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
      now.getTime() + (step.delay_minutes as number) * 60_000
    );

    await sends.insert({
      campaign_id: campaignId,
      step_id: step.id,
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
