/**
 * CRM subscription topic + frequency cap checks.
 *
 * These functions are called before sending to determine if a recipient
 * should receive a specific email based on their topic preferences and
 * how many emails they've already received recently.
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

// ─── Topic Subscription Check ──────────────────────────────────────

/**
 * Check if a user is subscribed to a campaign's topic.
 * Returns true if the user should receive the email.
 *
 * Rules:
 * - If the campaign has no topic_id, allow (backwards compat)
 * - If the topic is_required, always allow (e.g. transactional)
 * - If the user has no explicit preference, use the topic's is_default
 * - Otherwise, use the user's explicit subscription preference
 */
export async function isSubscribedToTopic(
  admin: SupabaseClient,
  userId: string,
  campaignId: string
): Promise<boolean> {
  // Get campaign's topic
  const { data: campaign } = await admin.from("campaigns")
    .select("topic_id")
    .eq("id", campaignId)
    .maybeSingle();

  if (!campaign) return true; // Campaign not found — allow
  const topicId = (campaign as Record<string, unknown>).topic_id as string | null;
  if (!topicId) return true; // No topic assigned — allow

  // Get the topic
  const { data: topic } = await admin.from("crm_subscription_topics")
    .select("is_required, is_default")
    .eq("id", topicId)
    .maybeSingle();

  if (!topic) return true; // Topic not found — allow
  const topicRow = topic as Record<string, unknown>;

  // Required topics always send (e.g. transactional)
  if (topicRow.is_required === true) return true;

  // Check user's explicit preference
  const { data: sub } = await admin.from("crm_user_topic_subscriptions")
    .select("subscribed")
    .eq("user_id", userId)
    .eq("topic_id", topicId)
    .maybeSingle();

  if (sub) {
    return (sub as Record<string, unknown>).subscribed === true;
  }

  // No explicit preference — use topic default
  return topicRow.is_default === true;
}

// ─── Frequency Cap Check ───────────────────────────────────────────

/**
 * Check if sending to this email would exceed any active frequency cap.
 * Returns true if the send is allowed (under all caps).
 */
export async function isWithinFrequencyCaps(
  admin: SupabaseClient,
  recipientEmail: string
): Promise<boolean> {
  // Load active frequency caps
  const { data: caps } = await admin.from("crm_frequency_caps")
    .select("max_sends, window_hours")
    .eq("is_active", true)
    .eq("applies_to", "marketing");

  if (!caps || caps.length === 0) return true; // No caps defined

  for (const cap of caps) {
    const row = cap as Record<string, unknown>;
    const maxSends = row.max_sends as number;
    const windowHours = row.window_hours as number;

    const windowStart = new Date(
      Date.now() - windowHours * 60 * 60 * 1000
    ).toISOString();

    // Count recent sends to this recipient
    const { count } = await admin.from("campaign_sends")
      .select("id", { count: "exact", head: true })
      .eq("recipient_email", recipientEmail.toLowerCase())
      .in("status", ["sent", "delivered"])
      .gte("sent_at", windowStart);

    if ((count ?? 0) >= maxSends) {
      return false; // Over the cap
    }
  }

  return true;
}

// ─── Combined Pre-send Check ───────────────────────────────────────

export interface PreSendCheckResult {
  allowed: boolean;
  reason?: "suppressed" | "opted_out" | "topic_unsubscribed" | "frequency_capped";
}

/**
 * Run all pre-send checks for a queued email.
 * Returns whether the send is allowed and the reason if not.
 */
export async function runPreSendChecks(
  admin: SupabaseClient,
  opts: {
    recipientEmail: string;
    recipientId?: string;
    recipientType: "user" | "lead";
    campaignId: string;
  }
): Promise<PreSendCheckResult> {
  // 1. Check suppression list
  const { isSuppressed, hasMarketingOptOut } = await import("@/lib/crm/email-sender");

  const suppressed = await isSuppressed(admin, opts.recipientEmail);
  if (suppressed) {
    return { allowed: false, reason: "suppressed" };
  }

  // 2. Check global marketing opt-out (users only)
  if (opts.recipientType === "user" && opts.recipientId) {
    const optedOut = await hasMarketingOptOut(admin, opts.recipientId);
    if (optedOut) {
      return { allowed: false, reason: "opted_out" };
    }

    // 3. Check topic subscription (users only)
    const subscribed = await isSubscribedToTopic(
      admin,
      opts.recipientId,
      opts.campaignId
    );
    if (!subscribed) {
      return { allowed: false, reason: "topic_unsubscribed" };
    }
  }

  // 4. Check frequency caps
  const withinCaps = await isWithinFrequencyCaps(admin, opts.recipientEmail);
  if (!withinCaps) {
    return { allowed: false, reason: "frequency_capped" };
  }

  return { allowed: true };
}
