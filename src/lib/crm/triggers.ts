/**
 * CRM trigger system — fire-and-forget function that enrolls users
 * into triggered campaigns when events occur.
 *
 * Usage:
 *   import { fireCrmTrigger } from "@/lib/crm/triggers";
 *   await fireCrmTrigger("user_signup", { userId: "...", email: "..." });
 */

import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { isSuppressed, hasMarketingOptOut } from "@/lib/crm/email-sender";
import { crmTable } from "@/lib/crm/admin-queries";
import { userMatchesSegment } from "@/lib/crm/segment-evaluator";
import type { CrmTriggerEvent, Campaign, CampaignStep } from "@/lib/crm/types";

interface TriggerContext {
  userId?: string;
  email?: string;
  leadId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Fire a CRM trigger event. Finds all active triggered campaigns
 * matching this event and enrolls the user/lead.
 *
 * This is designed to be fast — it creates enrollment records and
 * queues the first step. The cron runner handles actual sending.
 */
export async function fireCrmTrigger(
  event: CrmTriggerEvent,
  context: TriggerContext
): Promise<void> {
  try {
    const admin = createAdminClient();

    // Pre-flight: resolve email from userId if not provided
    let email = context.email;
    if (!email && context.userId) {
      const { data: { user } } = await admin.auth.admin.getUserById(
        context.userId
      );
      email = user?.email ?? undefined;
    }
    if (!email) return;

    if (await isSuppressed(admin, email)) return;

    if (context.userId && (await hasMarketingOptOut(admin, context.userId))) {
      return;
    }

    // Find active triggered campaigns for this event
    const { data: campaigns } = await crmTable(admin, "campaigns")
      .select("id, type, segment_id")
      .eq("type", "triggered")
      .eq("status", "active")
      .eq("trigger_event", event)
      .returns<Pick<Campaign, "id" | "type" | "segment_id">[]>();

    if (!campaigns || campaigns.length === 0) return;

    for (const campaign of campaigns) {
      // Evaluate segment match if campaign targets a specific segment
      if (campaign.segment_id && context.userId) {
        try {
          const matches = await userMatchesSegment(
            admin,
            context.userId,
            campaign.segment_id
          );
          if (!matches) continue;
        } catch (err) {
          console.error(
            `[crm/triggers] Segment evaluation failed for campaign ${campaign.id}:`,
            err
          );
          continue; // Skip this campaign on segment errors
        }
      }

      // Check if already enrolled
      const { data: existing } = await crmTable(admin, "campaign_enrollments")
        .select("id")
        .eq("campaign_id", campaign.id)
        .eq("recipient_email", email)
        .maybeSingle();

      if (existing) continue;

      // Get the first step
      const { data: firstStep } = await crmTable(admin, "campaign_steps")
        .select("id, delay_minutes")
        .eq("campaign_id", campaign.id)
        .eq("step_order", 1)
        .single()
        .then((r: { data: Pick<CampaignStep, "id" | "delay_minutes"> | null; error: unknown }) => r);

      if (!firstStep) continue;

      const now = new Date();
      const nextDue = new Date(
        now.getTime() + firstStep.delay_minutes * 60_000
      );

      // Create enrollment
      await crmTable(admin, "campaign_enrollments").insert({
        campaign_id: campaign.id,
        recipient_id: context.userId ?? null,
        recipient_email: email,
        recipient_type: context.leadId ? "lead" : "user",
        lead_id: context.leadId ?? null,
        current_step: 0,
        status: "active",
        next_step_due_at: nextDue.toISOString(),
      });
    }
  } catch (err) {
    // Triggers should never break the calling code
    console.error(`[crm/triggers] Error firing ${event}:`, err);
  }
}
