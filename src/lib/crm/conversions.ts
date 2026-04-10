/**
 * Conversion tracking — records business events and attributes them
 * to the most recent CRM touchpoint (campaign send, workflow, etc.).
 *
 * Attribution uses a configurable window (default 7 days) with
 * last-touch attribution: the most recent email open/click before
 * the conversion gets credit.
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export type ConversionCategory =
  | "signup"
  | "booking"
  | "purchase"
  | "upgrade"
  | "referral"
  | "engagement"
  | "retention"
  | "reactivation"
  | "other";

export interface TrackConversionOptions {
  userId?: string;
  email: string;
  eventName: string;
  category?: ConversionCategory;
  valueCents?: number;
  currency?: string;
  properties?: Record<string, unknown>;
  attributionWindowHours?: number;
}

interface AttributionResult {
  campaignId: string | null;
  workflowId: string | null;
  sendId: string | null;
  type: "last_touch" | "first_touch" | "direct";
}

/**
 * Track a conversion event and auto-attribute it to the most recent
 * CRM touchpoint within the attribution window.
 */
export async function trackConversion(
  admin: SupabaseClient,
  opts: TrackConversionOptions
): Promise<string> {
  const windowHours = opts.attributionWindowHours ?? 168; // 7 days

  // Find attribution
  const attribution = await findAttribution(
    admin,
    opts.email,
    windowHours
  );

  const id = crypto.randomUUID();

  await admin.from("crm_conversions").insert({
    id,
    user_id: opts.userId ?? null,
    email: opts.email,
    event_name: opts.eventName,
    event_category: opts.category ?? "other",
    value_cents: opts.valueCents ?? 0,
    currency: opts.currency ?? "USD",
    attributed_campaign_id: attribution.campaignId,
    attributed_workflow_id: attribution.workflowId,
    attributed_send_id: attribution.sendId,
    attribution_window_hours: windowHours,
    attribution_type: attribution.type,
    properties: opts.properties ?? {},
  });

  // Also log in activity timeline
  await logActivity(admin, {
    userId: opts.userId,
    email: opts.email,
    activityType: "conversion",
    title: `Conversion: ${opts.eventName}`,
    description: opts.valueCents
      ? `Value: $${(opts.valueCents / 100).toFixed(2)} ${opts.currency ?? "USD"}`
      : undefined,
    sourceType: "conversion",
    sourceId: id,
    metadata: {
      event_name: opts.eventName,
      category: opts.category,
      value_cents: opts.valueCents,
      attributed_campaign_id: attribution.campaignId,
      attributed_workflow_id: attribution.workflowId,
    },
  });

  return id;
}

/**
 * Find the most recent campaign/workflow touchpoint for attribution.
 * Uses last-touch: the most recent email engagement (click > open > send).
 */
async function findAttribution(
  admin: SupabaseClient,
  email: string,
  windowHours: number
): Promise<AttributionResult> {
  const cutoff = new Date(Date.now() - windowHours * 3_600_000).toISOString();

  // Look for clicks first (strongest signal)
  const { data: clicked } = await admin.from("campaign_sends")
    .select("id, campaign_id")
    .eq("recipient_email", email)
    .not("clicked_at", "is", null)
    .gte("clicked_at", cutoff)
    .order("clicked_at", { ascending: false })
    .limit(1)
    .returns<{ id: string; campaign_id: string | null }[]>();

  if (clicked && clicked.length > 0) {
    return {
      campaignId: clicked[0].campaign_id,
      workflowId: null,
      sendId: clicked[0].id,
      type: "last_touch",
    };
  }

  // Then opens
  const { data: opened } = await admin.from("campaign_sends")
    .select("id, campaign_id")
    .eq("recipient_email", email)
    .not("opened_at", "is", null)
    .gte("opened_at", cutoff)
    .order("opened_at", { ascending: false })
    .limit(1)
    .returns<{ id: string; campaign_id: string | null }[]>();

  if (opened && opened.length > 0) {
    return {
      campaignId: opened[0].campaign_id,
      workflowId: null,
      sendId: opened[0].id,
      type: "last_touch",
    };
  }

  // Then any send
  const { data: sent } = await admin.from("campaign_sends")
    .select("id, campaign_id")
    .eq("recipient_email", email)
    .eq("status", "sent")
    .gte("sent_at", cutoff)
    .order("sent_at", { ascending: false })
    .limit(1)
    .returns<{ id: string; campaign_id: string | null }[]>();

  if (sent && sent.length > 0) {
    return {
      campaignId: sent[0].campaign_id,
      workflowId: null,
      sendId: sent[0].id,
      type: "last_touch",
    };
  }

  // Check workflow enrollments
  const { data: enrollment } = await admin.from("crm_workflow_enrollments")
    .select("id, workflow_id")
    .eq("email", email)
    .gte("enrolled_at", cutoff)
    .order("enrolled_at", { ascending: false })
    .limit(1)
    .returns<{ id: string; workflow_id: string }[]>();

  if (enrollment && enrollment.length > 0) {
    return {
      campaignId: null,
      workflowId: enrollment[0].workflow_id,
      sendId: null,
      type: "last_touch",
    };
  }

  return { campaignId: null, workflowId: null, sendId: null, type: "direct" };
}

// ─── Activity Timeline ─────────────────────────────────────────────

export interface LogActivityOptions {
  userId?: string;
  email: string;
  activityType: string;
  title: string;
  description?: string;
  sourceType?: string;
  sourceId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log an activity event in the contact timeline.
 */
export async function logActivity(
  admin: SupabaseClient,
  opts: LogActivityOptions
): Promise<void> {
  try {
    await admin.from("crm_contact_activity").insert({
      user_id: opts.userId ?? null,
      email: opts.email,
      activity_type: opts.activityType,
      title: opts.title,
      description: opts.description ?? null,
      source_type: opts.sourceType ?? null,
      source_id: opts.sourceId ?? null,
      metadata: opts.metadata ?? {},
    });
  } catch (err) {
    console.error("[crm/conversions] Failed to log activity:", err);
  }
}

/**
 * Get the activity timeline for a contact.
 */
export async function getContactTimeline(
  admin: SupabaseClient,
  opts: { userId?: string; email?: string; limit?: number; offset?: number }
): Promise<Array<{
  id: string;
  activity_type: string;
  title: string;
  description: string | null;
  source_type: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}>> {
  let query = admin.from("crm_contact_activity")
    .select("id, activity_type, title, description, source_type, metadata, created_at")
    .order("created_at", { ascending: false })
    .range(opts.offset ?? 0, (opts.offset ?? 0) + (opts.limit ?? 50) - 1);

  if (opts.userId) {
    query = query.eq("user_id", opts.userId);
  } else if (opts.email) {
    query = query.eq("email", opts.email);
  } else {
    return [];
  }

  const { data } = await query.returns<Array<{
    id: string;
    activity_type: string;
    title: string;
    description: string | null;
    source_type: string | null;
    metadata: Record<string, unknown>;
    created_at: string;
  }>>();

  return data ?? [];
}

/**
 * Get conversion stats for a campaign.
 */
export async function getCampaignConversions(
  admin: SupabaseClient,
  campaignId: string
): Promise<{
  total_conversions: number;
  total_value_cents: number;
  conversions_by_event: Record<string, number>;
}> {
  const { data } = await admin.from("crm_conversions")
    .select("event_name, value_cents")
    .eq("attributed_campaign_id", campaignId)
    .returns<{ event_name: string; value_cents: number }[]>();

  if (!data || data.length === 0) {
    return { total_conversions: 0, total_value_cents: 0, conversions_by_event: {} };
  }

  const byEvent: Record<string, number> = {};
  let totalValue = 0;

  for (const row of data) {
    byEvent[row.event_name] = (byEvent[row.event_name] ?? 0) + 1;
    totalValue += row.value_cents ?? 0;
  }

  return {
    total_conversions: data.length,
    total_value_cents: totalValue,
    conversions_by_event: byEvent,
  };
}
