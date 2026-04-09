import "server-only";

import { NextResponse } from "next/server";
import { requireAdmin, jsonError } from "@/lib/api/helpers";
import { crmTable } from "@/lib/crm/admin-queries";

// ─── GET /api/admin/crm/dashboard ─────────────────────────────────
// Returns aggregated CRM metrics for the dashboard.
// First checks for a cached snapshot from today. Falls back to
// live queries if no snapshot exists yet.

export async function GET() {
  const auth = await requireAdmin();
  if (!auth) return jsonError("Unauthorized", 401);

  const { admin } = auth;

  // Try cached snapshot first (from the daily cron)
  const { data: snapshot } = await crmTable(admin, "crm_dashboard_snapshots")
    .select("*")
    .order("snapshot_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (snapshot) {
    // Also fetch recent sends (not cached)
    const recentSends = await getRecentSends(admin);
    const segmentsCount = await getSegmentsCount(admin);

    return NextResponse.json({
      snapshot,
      recent_sends: recentSends,
      segments_count: segmentsCount,
    });
  }

  // No snapshot yet — compute live
  const liveSnapshot = await computeLiveSnapshot(admin);
  const recentSends = await getRecentSends(admin);
  const segmentsCount = await getSegmentsCount(admin);

  return NextResponse.json({
    snapshot: liveSnapshot,
    recent_sends: recentSends,
    segments_count: segmentsCount,
  });
}

// ─── Helpers ──────────────────────────────────────────────────────

interface DayCount {
  date: string;
  count: number;
}

interface TopCampaignRow {
  id: string;
  name: string;
  type: string;
  status: string;
  total_sends: number;
  open_rate: number;
  click_rate: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdminClient = any;

async function getRecentSends(admin: AdminClient) {
  const { data } = await crmTable(admin, "campaign_sends")
    .select("id, recipient_email, status, sent_at, campaign_id")
    .order("created_at", { ascending: false })
    .limit(5);

  if (!data || data.length === 0) return [];

  // Get campaign names
  const campaignIds = [...new Set(data.map((s: Record<string, unknown>) => s.campaign_id))];
  const { data: campaigns } = await crmTable(admin, "campaigns")
    .select("id, name")
    .in("id", campaignIds);

  const nameMap = new Map(
    (campaigns ?? []).map((c: Record<string, unknown>) => [c.id, c.name])
  );

  return data.map((s: Record<string, unknown>) => ({
    id: s.id,
    recipient_email: s.recipient_email,
    status: s.status,
    sent_at: s.sent_at,
    campaign_name: nameMap.get(s.campaign_id) ?? "Unknown",
  }));
}

async function getSegmentsCount(admin: AdminClient) {
  const { count } = await crmTable(admin, "segments")
    .select("id", { count: "exact", head: true });
  return count ?? 0;
}

async function computeLiveSnapshot(admin: AdminClient) {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Run parallel queries
  const [
    contactsResult,
    leadsResult,
    activeCampaignsResult,
    sends7dResult,
    sends30dResult,
    delivered7dResult,
    opens7dResult,
    clicks7dResult,
    bounces7dResult,
    unsubscribes7dResult,
  ] = await Promise.all([
    // Total contacts (profiles with email_marketing = true)
    admin.from("profiles").select("id", { count: "exact", head: true }),
    // Total leads
    admin.from("leads").select("id", { count: "exact", head: true }),
    // Active campaigns
    crmTable(admin, "campaigns")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    // Sends 7d
    crmTable(admin, "campaign_sends")
      .select("id", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo),
    // Sends 30d
    crmTable(admin, "campaign_sends")
      .select("id", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo),
    // Delivered 7d
    crmTable(admin, "campaign_sends")
      .select("id", { count: "exact", head: true })
      .eq("status", "delivered")
      .gte("created_at", sevenDaysAgo),
    // Opens 7d
    crmTable(admin, "campaign_sends")
      .select("id", { count: "exact", head: true })
      .not("opened_at", "is", null)
      .gte("created_at", sevenDaysAgo),
    // Clicks 7d
    crmTable(admin, "campaign_sends")
      .select("id", { count: "exact", head: true })
      .not("clicked_at", "is", null)
      .gte("created_at", sevenDaysAgo),
    // Bounces 7d
    crmTable(admin, "campaign_sends")
      .select("id", { count: "exact", head: true })
      .eq("status", "bounced")
      .gte("created_at", sevenDaysAgo),
    // Unsubscribes 7d
    crmTable(admin, "campaign_sends")
      .select("id", { count: "exact", head: true })
      .eq("status", "unsubscribed")
      .gte("created_at", sevenDaysAgo),
  ]);

  const totalContacts = contactsResult.count ?? 0;
  const totalLeads = leadsResult.count ?? 0;
  const activeCampaigns = activeCampaignsResult.count ?? 0;
  const sends7d = sends7dResult.count ?? 0;
  const sends30d = sends30dResult.count ?? 0;
  const delivered7d = delivered7dResult.count ?? 0;
  const opens7d = opens7dResult.count ?? 0;
  const clicks7d = clicks7dResult.count ?? 0;
  const bounces7d = bounces7dResult.count ?? 0;
  const unsubscribes7d = unsubscribes7dResult.count ?? 0;

  // Calculate rates
  const openRate7d = delivered7d > 0 ? Math.round((opens7d / delivered7d) * 1000) / 10 : 0;
  const clickRate7d = delivered7d > 0 ? Math.round((clicks7d / delivered7d) * 1000) / 10 : 0;

  // Build daily breakdowns for sparklines (last 7 days)
  const sendsByDay = await buildDailyBreakdown(admin, "created_at", sevenDaysAgo);
  const opensByDay = await buildDailyBreakdown(admin, "opened_at", sevenDaysAgo);
  const clicksByDay = await buildDailyBreakdown(admin, "clicked_at", sevenDaysAgo);

  // Top campaigns by send count
  const topCampaigns = await getTopCampaigns(admin);

  return {
    total_contacts: totalContacts,
    total_leads: totalLeads,
    active_campaigns: activeCampaigns,
    sends_7d: sends7d,
    sends_30d: sends30d,
    delivered_7d: delivered7d,
    opens_7d: opens7d,
    clicks_7d: clicks7d,
    bounces_7d: bounces7d,
    unsubscribes_7d: unsubscribes7d,
    open_rate_7d: openRate7d,
    click_rate_7d: clickRate7d,
    sends_by_day: sendsByDay,
    opens_by_day: opensByDay,
    clicks_by_day: clicksByDay,
    top_campaigns: topCampaigns,
  };
}

async function buildDailyBreakdown(
  admin: AdminClient,
  dateField: string,
  since: string
): Promise<DayCount[]> {
  // Get all sends in range and group client-side (Supabase REST doesn't support GROUP BY)
  const { data } = await crmTable(admin, "campaign_sends")
    .select(dateField)
    .not(dateField, "is", null)
    .gte(dateField, since)
    .limit(5000);

  if (!data) return buildEmptyDays(7);

  // Count by date
  const counts = new Map<string, number>();
  for (const row of data) {
    const entry = row as unknown as Record<string, unknown>;
    const val = entry[dateField];
    if (!val) continue;
    const date = new Date(val as string).toISOString().split("T")[0];
    counts.set(date, (counts.get(date) ?? 0) + 1);
  }

  // Fill in all 7 days
  const days: DayCount[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    days.push({ date: dateStr, count: counts.get(dateStr) ?? 0 });
  }

  return days;
}

function buildEmptyDays(count: number): DayCount[] {
  const days: DayCount[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({ date: d.toISOString().split("T")[0], count: 0 });
  }
  return days;
}

async function getTopCampaigns(admin: AdminClient): Promise<TopCampaignRow[]> {
  // Get campaigns with most sends
  const { data: campaigns } = await crmTable(admin, "campaigns")
    .select("id, name, type, status")
    .in("status", ["active", "completed", "paused"])
    .order("created_at", { ascending: false })
    .limit(20);

  if (!campaigns || campaigns.length === 0) return [];

  // Get send stats per campaign
  const results: TopCampaignRow[] = [];

  for (const c of campaigns) {
    const campaign = c as Record<string, unknown>;
    const campaignId = campaign.id as string;

    const [totalResult, deliveredResult, openedResult, clickedResult] = await Promise.all([
      crmTable(admin, "campaign_sends")
        .select("id", { count: "exact", head: true })
        .eq("campaign_id", campaignId),
      crmTable(admin, "campaign_sends")
        .select("id", { count: "exact", head: true })
        .eq("campaign_id", campaignId)
        .eq("status", "delivered"),
      crmTable(admin, "campaign_sends")
        .select("id", { count: "exact", head: true })
        .eq("campaign_id", campaignId)
        .not("opened_at", "is", null),
      crmTable(admin, "campaign_sends")
        .select("id", { count: "exact", head: true })
        .eq("campaign_id", campaignId)
        .not("clicked_at", "is", null),
    ]);

    const total = totalResult.count ?? 0;
    const delivered = deliveredResult.count ?? 0;
    const opened = openedResult.count ?? 0;
    const clicked = clickedResult.count ?? 0;

    if (total === 0) continue;

    results.push({
      id: campaignId,
      name: campaign.name as string,
      type: campaign.type as string,
      status: campaign.status as string,
      total_sends: total,
      open_rate: delivered > 0 ? Math.round((opened / delivered) * 1000) / 10 : 0,
      click_rate: delivered > 0 ? Math.round((clicked / delivered) * 1000) / 10 : 0,
    });
  }

  // Sort by total sends descending, take top 5
  results.sort((a, b) => b.total_sends - a.total_sends);
  return results.slice(0, 5);
}
