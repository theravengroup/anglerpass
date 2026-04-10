import { NextRequest } from "next/server";
import { requireAdmin, jsonOk, jsonCreated, jsonError } from "@/lib/api/helpers";
import { createCampaignSchema } from "@/lib/validations/campaigns";
import type { Json } from "@/types/supabase";

/**
 * GET /api/admin/campaigns
 *
 * List campaigns with aggregated send stats.
 * Supports filtering by status and type.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth) return jsonError("Unauthorized", 401);

  const url = request.nextUrl;
  const page = Number(url.searchParams.get("page") ?? "1");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "50"), 100);
  const offset = (page - 1) * limit;
  const status = url.searchParams.get("status");
  const type = url.searchParams.get("type");

  let query = auth.admin.from("campaigns")
    .select("*")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (type) query = query.eq("type", type);

  query = query.range(offset, offset + limit - 1);

  const { data: campaigns, error } = await query;

  if (error) {
    return jsonError(`Failed to fetch campaigns: ${error.message}`, 500);
  }

  // Enrich with send stats for each campaign
  const enriched = await Promise.all(
    (campaigns ?? []).map(async (campaign) => {
      const stats = await getCampaignStats(auth.admin, campaign.id);
      return { ...campaign, ...stats };
    })
  );

  const { count: total } = await auth.admin.from("campaigns")
    .select("*", { count: "exact", head: true });

  return jsonOk({
    campaigns: enriched,
    pagination: { page, limit, total: total ?? 0 },
  });
}

/**
 * POST /api/admin/campaigns
 *
 * Create a new campaign (starts in "draft" status).
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth) return jsonError("Unauthorized", 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const result = createCampaignSchema.safeParse(body);
  if (!result.success) {
    return jsonError(result.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const { trigger_config, ...rest } = result.data;
  const { data: campaign, error } = await auth.admin.from("campaigns")
    .insert({
      ...rest,
      trigger_config: trigger_config as Json,
      status: "draft",
      created_by: auth.user.id,
    })
    .select("*")
    .single();

  if (error) {
    return jsonError(`Failed to create campaign: ${error.message}`, 500);
  }

  return jsonCreated({ campaign });
}

// ─── Helpers ────────────────────────────────────────────────────────

import type { SupabaseClient } from "@supabase/supabase-js";

async function getCampaignStats(admin: SupabaseClient, campaignId: string) {
  const sends = admin.from("campaign_sends");

  // Get total sends
  const { count: totalSends } = await sends
    .select("*", { count: "exact", head: true })
    .eq("campaign_id", campaignId);

  // Get delivered count
  const { count: deliveredCount } = await sends
    .select("*", { count: "exact", head: true })
    .eq("campaign_id", campaignId)
    .eq("status", "delivered");

  // Get opened count (at least 1 open)
  const { count: openedCount } = await sends
    .select("*", { count: "exact", head: true })
    .eq("campaign_id", campaignId)
    .gt("open_count", 0);

  // Get clicked count
  const { count: clickedCount } = await sends
    .select("*", { count: "exact", head: true })
    .eq("campaign_id", campaignId)
    .gt("click_count", 0);

  // Get bounced count
  const { count: bouncedCount } = await sends
    .select("*", { count: "exact", head: true })
    .eq("campaign_id", campaignId)
    .eq("status", "bounced");

  const total = totalSends ?? 0;
  const delivered = deliveredCount ?? 0;
  const opened = openedCount ?? 0;
  const clicked = clickedCount ?? 0;

  // Get step count
  const { count: stepCount } = await admin.from("campaign_steps")
    .select("*", { count: "exact", head: true })
    .eq("campaign_id", campaignId);

  return {
    total_sends: total,
    delivered_count: delivered,
    opened_count: opened,
    clicked_count: clicked,
    bounced_count: bouncedCount ?? 0,
    open_rate: delivered > 0 ? Math.round((opened / delivered) * 100) : 0,
    click_rate: delivered > 0 ? Math.round((clicked / delivered) * 100) : 0,
    step_count: stepCount ?? 0,
  };
}
