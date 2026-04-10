/**
 * Lead-to-user conversion tracking.
 *
 * When a waitlist lead signs up as a real user, this module:
 *   1. Marks the lead as converted (converted_to_user_id + converted_at)
 *   2. Migrates any active CRM enrollments from lead → user
 *
 * This prevents duplicate emails and preserves engagement history.
 */

import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Convert a lead to a user. Called during auth callback when a new user
 * signs up with an email that matches an existing lead.
 *
 * Safe to call even if no matching lead exists — it's a no-op.
 */
export async function convertLeadToUser(
  email: string,
  userId: string
): Promise<void> {
  const admin = createAdminClient();

  // Find unconverted leads matching this email
  const { data: leads } = await admin
    .from("leads")
    .select("id")
    .eq("email", email.toLowerCase())
    .is("converted_to_user_id", null);

  if (!leads || leads.length === 0) return;

  const leadIds = leads.map((l) => l.id);
  const now = new Date().toISOString();

  // 1. Mark leads as converted
  await admin
    .from("leads")
    .update({
      converted_to_user_id: userId,
      converted_at: now,
    })
    .in("id", leadIds);

  // 2. Migrate active campaign enrollments from lead → user
  for (const leadId of leadIds) {
    const { data: enrollments } = await admin
      .from("campaign_enrollments")
      .select("id")
      .eq("lead_id", leadId)
      .eq("recipient_type", "lead")
      .eq("status", "active");

    if (!enrollments || enrollments.length === 0) continue;

    const enrollmentIds = enrollments.map((e) => e.id);

    await admin
      .from("campaign_enrollments")
      .update({
        recipient_id: userId,
        recipient_type: "user",
      })
      .in("id", enrollmentIds);

    // Also update pending/queued sends
    await admin
      .from("campaign_sends")
      .update({
        recipient_id: userId,
        recipient_type: "user",
      })
      .eq("lead_id", leadId)
      .in("status", ["queued", "sending"]);
  }
}
