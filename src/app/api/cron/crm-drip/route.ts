import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError } from "@/lib/api/helpers";
import { crmTable } from "@/lib/crm/admin-queries";

/**
 * GET /api/cron/crm-drip
 *
 * Cron job that advances drip campaign enrollments to their next step.
 * Runs every 15 minutes. For each active enrollment whose next_step_due_at
 * has passed, it queues the next send and updates the enrollment.
 *
 * Protected by CRON_SECRET in the Authorization header.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return jsonError("Unauthorized", 401);
  }

  const admin = createAdminClient();

  try {
    const result = await advanceDripEnrollments(admin);

    console.log(
      `[cron/crm-drip] Batch complete: ${result.advanced} advanced, ${result.completed} completed, ${result.errors} errors`
    );

    return jsonOk({
      processed: true,
      ...result,
    });
  } catch (err) {
    console.error("[cron/crm-drip] Error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return jsonError(`CRM drip runner failed: ${msg}`, 500);
  }
}

// ─── Drip Advancement Logic ─────────────────────────────────────────

import type { SupabaseClient } from "@supabase/supabase-js";

async function advanceDripEnrollments(
  admin: SupabaseClient
): Promise<{ advanced: number; completed: number; errors: number }> {
  const enrollments = crmTable(admin, "campaign_enrollments");
  const steps = crmTable(admin, "campaign_steps");
  const sends = crmTable(admin, "campaign_sends");
  const campaigns = crmTable(admin, "campaigns");

  // Find active enrollments that are due for their next step
  const { data: dueEnrollments } = await enrollments
    .select(
      "id, campaign_id, recipient_id, recipient_email, recipient_type, lead_id, current_step, next_step_due_at"
    )
    .eq("status", "active")
    .lte("next_step_due_at", new Date().toISOString())
    .not("next_step_due_at", "is", null)
    .limit(100);

  if (!dueEnrollments || dueEnrollments.length === 0) {
    return { advanced: 0, completed: 0, errors: 0 };
  }

  let advanced = 0;
  let completed = 0;
  let errors = 0;

  for (const enrollment of dueEnrollments) {
    const e = enrollment as Record<string, unknown>;

    try {
      // Verify campaign is still active
      const { data: campaign } = await campaigns
        .select("id, status, type")
        .eq("id", e.campaign_id)
        .single();

      if (!campaign || (campaign as Record<string, unknown>).status !== "active") {
        continue;
      }

      const nextStepOrder = (e.current_step as number) + 1;

      // Get the next step
      const { data: nextStep } = await steps
        .select("id, delay_minutes, step_order")
        .eq("campaign_id", e.campaign_id)
        .eq("step_order", nextStepOrder)
        .maybeSingle();

      if (!nextStep) {
        // No more steps — mark enrollment as completed
        await enrollments
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            next_step_due_at: null,
          })
          .eq("id", e.id);

        completed++;
        continue;
      }

      const ns = nextStep as Record<string, unknown>;

      // Queue the send
      await sends.insert({
        campaign_id: e.campaign_id,
        step_id: ns.id,
        recipient_id: e.recipient_id,
        recipient_email: e.recipient_email,
        recipient_type: e.recipient_type,
        lead_id: e.lead_id,
        status: "queued",
        drip_scheduled_for: new Date().toISOString(), // Send now — it's already due
      });

      // Look ahead to the step after this one for next_step_due_at
      const nextNextOrder = (ns.step_order as number) + 1;
      const { data: futureStep } = await steps
        .select("delay_minutes")
        .eq("campaign_id", e.campaign_id)
        .eq("step_order", nextNextOrder)
        .maybeSingle();

      const now = new Date();
      const nextDueAt = futureStep
        ? new Date(
            now.getTime() +
              ((futureStep as Record<string, unknown>).delay_minutes as number) * 60_000
          ).toISOString()
        : null;

      // Update enrollment
      await enrollments
        .update({
          current_step: ns.step_order,
          last_step_sent_at: now.toISOString(),
          next_step_due_at: nextDueAt,
        })
        .eq("id", e.id);

      advanced++;
    } catch (err) {
      console.error(
        `[cron/crm-drip] Error advancing enrollment ${e.id}:`,
        err
      );
      errors++;
    }
  }

  return { advanced, completed, errors };
}
