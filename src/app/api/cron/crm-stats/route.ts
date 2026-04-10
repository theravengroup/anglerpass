import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/supabase";
import { toDateString } from "@/lib/utils";

// ─── POST /api/cron/crm-stats ─────────────────────────────────────
// Runs daily via Vercel Cron. Computes CRM dashboard metrics and
// upserts a snapshot row for today's date.
// Schedule: every day at 06:00 UTC (configured in vercel.json)

export async function POST(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const today = toDateString();
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  try {
    // ── Parallel metric queries ──
    const [
      contactsResult,
      leadsResult,
      activeCampaignsResult,
      sends7dResult,
      sends30dResult,
      delivered7dResult,
      delivered30dResult,
      opens7dResult,
      opens30dResult,
      clicks7dResult,
      clicks30dResult,
      bounces7dResult,
      bounces30dResult,
      unsubs7dResult,
      unsubs30dResult,
    ] = await Promise.all([
      admin.from("profiles").select("id", { count: "exact", head: true }),
      admin.from("leads").select("id", { count: "exact", head: true }),
      admin.from("campaigns").select("id", { count: "exact", head: true }).eq("status", "active"),
      admin.from("campaign_sends").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
      admin.from("campaign_sends").select("id", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
      admin.from("campaign_sends").select("id", { count: "exact", head: true }).eq("status", "delivered").gte("created_at", sevenDaysAgo),
      admin.from("campaign_sends").select("id", { count: "exact", head: true }).eq("status", "delivered").gte("created_at", thirtyDaysAgo),
      admin.from("campaign_sends").select("id", { count: "exact", head: true }).not("opened_at", "is", null).gte("created_at", sevenDaysAgo),
      admin.from("campaign_sends").select("id", { count: "exact", head: true }).not("opened_at", "is", null).gte("created_at", thirtyDaysAgo),
      admin.from("campaign_sends").select("id", { count: "exact", head: true }).not("clicked_at", "is", null).gte("created_at", sevenDaysAgo),
      admin.from("campaign_sends").select("id", { count: "exact", head: true }).not("clicked_at", "is", null).gte("created_at", thirtyDaysAgo),
      admin.from("campaign_sends").select("id", { count: "exact", head: true }).eq("status", "bounced").gte("created_at", sevenDaysAgo),
      admin.from("campaign_sends").select("id", { count: "exact", head: true }).eq("status", "bounced").gte("created_at", thirtyDaysAgo),
      admin.from("campaign_sends").select("id", { count: "exact", head: true }).eq("status", "unsubscribed").gte("created_at", sevenDaysAgo),
      admin.from("campaign_sends").select("id", { count: "exact", head: true }).eq("status", "unsubscribed").gte("created_at", thirtyDaysAgo),
    ]);

    const delivered7d = delivered7dResult.count ?? 0;
    const opens7d = opens7dResult.count ?? 0;
    const clicks7d = clicks7dResult.count ?? 0;

    const openRate7d = delivered7d > 0 ? Math.round((opens7d / delivered7d) * 1000) / 10 : 0;
    const clickRate7d = delivered7d > 0 ? Math.round((clicks7d / delivered7d) * 1000) / 10 : 0;

    // ── Daily breakdowns ──
    const [sendsByDay, opensByDay, clicksByDay] = await Promise.all([
      buildDailyBreakdown(admin, "created_at", sevenDaysAgo),
      buildDailyBreakdown(admin, "opened_at", sevenDaysAgo),
      buildDailyBreakdown(admin, "clicked_at", sevenDaysAgo),
    ]);

    // ── Top campaigns ──
    const topCampaigns = await getTopCampaigns(admin);

    // ── Upsert snapshot ──
    const snapshotData = {
      snapshot_date: today,
      total_contacts: contactsResult.count ?? 0,
      total_leads: leadsResult.count ?? 0,
      active_campaigns: activeCampaignsResult.count ?? 0,
      active_workflows: 0,
      sends_7d: sends7dResult.count ?? 0,
      sends_30d: sends30dResult.count ?? 0,
      delivered_7d: delivered7d,
      delivered_30d: delivered30dResult.count ?? 0,
      opens_7d: opens7d,
      opens_30d: opens30dResult.count ?? 0,
      clicks_7d: clicks7d,
      clicks_30d: clicks30dResult.count ?? 0,
      bounces_7d: bounces7dResult.count ?? 0,
      bounces_30d: bounces30dResult.count ?? 0,
      unsubscribes_7d: unsubs7dResult.count ?? 0,
      unsubscribes_30d: unsubs30dResult.count ?? 0,
      open_rate_7d: openRate7d,
      click_rate_7d: clickRate7d,
      sends_by_day: sendsByDay,
      opens_by_day: opensByDay,
      clicks_by_day: clicksByDay,
      top_campaigns: topCampaigns,
    };

    await admin.from("crm_dashboard_snapshots")
      .upsert({
        ...snapshotData,
        sends_by_day: sendsByDay as unknown as Json,
        opens_by_day: opensByDay as unknown as Json,
        clicks_by_day: clicksByDay as unknown as Json,
        top_campaigns: topCampaigns as unknown as Json,
      }, { onConflict: "snapshot_date" });

    return NextResponse.json({
      ok: true,
      snapshot_date: today,
      total_contacts: snapshotData.total_contacts,
      sends_7d: snapshotData.sends_7d,
    });
  } catch (err) {
    console.error("[crm-stats] Error computing snapshot:", err);
    return NextResponse.json({ error: "Failed to compute stats" }, { status: 500 });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────

interface DayCount {
  date: string;
  count: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdminClient = any;

async function buildDailyBreakdown(
  admin: AdminClient,
  dateField: string,
  since: string
): Promise<DayCount[]> {
  const { data } = await admin.from("campaign_sends")
    .select(dateField)
    .not(dateField, "is", null)
    .gte(dateField, since)
    .limit(10000);

  const counts = new Map<string, number>();
  if (data) {
    for (const row of data) {
      const entry = row as unknown as Record<string, unknown>;
      const val = entry[dateField];
      if (!val) continue;
      const date = toDateString(new Date(val as string));
      counts.set(date, (counts.get(date) ?? 0) + 1);
    }
  }

  const days: DayCount[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = toDateString(d);
    days.push({ date: dateStr, count: counts.get(dateStr) ?? 0 });
  }

  return days;
}

async function getTopCampaigns(admin: AdminClient) {
  const { data: campaigns } = await admin.from("campaigns")
    .select("id, name, type, status")
    .in("status", ["active", "completed", "paused"])
    .order("created_at", { ascending: false })
    .limit(20);

  if (!campaigns || campaigns.length === 0) return [];

  const results: { id: string; name: string; type: string; status: string; total_sends: number; open_rate: number; click_rate: number }[] = [];

  for (const c of campaigns) {
    const campaign = c as Record<string, unknown>;
    const campaignId = campaign.id as string;

    const [totalRes, deliveredRes, openedRes, clickedRes] = await Promise.all([
      admin.from("campaign_sends").select("id", { count: "exact", head: true }).eq("campaign_id", campaignId),
      admin.from("campaign_sends").select("id", { count: "exact", head: true }).eq("campaign_id", campaignId).eq("status", "delivered"),
      admin.from("campaign_sends").select("id", { count: "exact", head: true }).eq("campaign_id", campaignId).not("opened_at", "is", null),
      admin.from("campaign_sends").select("id", { count: "exact", head: true }).eq("campaign_id", campaignId).not("clicked_at", "is", null),
    ]);

    const total = totalRes.count ?? 0;
    if (total === 0) continue;

    const delivered = deliveredRes.count ?? 0;
    results.push({
      id: campaignId,
      name: campaign.name as string,
      type: campaign.type as string,
      status: campaign.status as string,
      total_sends: total,
      open_rate: delivered > 0 ? Math.round((openedRes.count ?? 0) / delivered * 1000) / 10 : 0,
      click_rate: delivered > 0 ? Math.round((clickedRes.count ?? 0) / delivered * 1000) / 10 : 0,
    });
  }

  results.sort((a, b) => b.total_sends - a.total_sends);
  return results.slice(0, 5);
}
