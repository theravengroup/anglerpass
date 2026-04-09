"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Loader2,
  Mail,
  Eye,
  MousePointerClick,
  AlertTriangle,
  Users,
  Layers,
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from "lucide-react";
import MetricSparkline from "./MetricSparkline";
import QuickStartCard from "./QuickStartCard";
import CampaignStatusBadge from "./CampaignStatusBadge";
import CampaignTypeBadge from "./CampaignTypeBadge";
import type { CampaignStatus, CampaignType } from "@/lib/crm/types";

// ─── Types ──────────────────────────────────────────────────────────

interface DashboardData {
  snapshot: {
    total_contacts: number;
    total_leads: number;
    active_campaigns: number;
    sends_7d: number;
    sends_30d: number;
    delivered_7d: number;
    opens_7d: number;
    clicks_7d: number;
    bounces_7d: number;
    unsubscribes_7d: number;
    open_rate_7d: number;
    click_rate_7d: number;
    sends_by_day: { date: string; count: number }[];
    opens_by_day: { date: string; count: number }[];
    clicks_by_day: { date: string; count: number }[];
    top_campaigns: TopCampaign[];
  };
  recent_sends: RecentSend[];
  segments_count: number;
}

interface TopCampaign {
  id: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  total_sends: number;
  open_rate: number;
  click_rate: number;
}

interface RecentSend {
  id: string;
  recipient_email: string;
  status: string;
  sent_at: string | null;
  campaign_name: string;
}

// ─── Dashboard Component ────────────────────────────────────────────

export default function CrmDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/crm/dashboard");
      if (res.ok) {
        setData(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-charcoal" />
      </div>
    );
  }

  if (!data) {
    return <QuickStartCard isEmpty />;
  }

  const s = data.snapshot;
  const isEmpty = s.active_campaigns === 0 && s.sends_7d === 0;

  return (
    <div className="space-y-6">
      {/* Quick Start — always visible for easy access */}
      <QuickStartCard isEmpty={isEmpty} />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard
          label="Contacts"
          value={s.total_contacts}
          icon={<Users className="size-4 text-forest" />}
          sparkData={[]}
        />
        <KpiCard
          label="Active Campaigns"
          value={s.active_campaigns}
          icon={<Mail className="size-4 text-river" />}
          sparkData={[]}
        />
        <KpiCard
          label="Sends (7d)"
          value={s.sends_7d}
          icon={<Mail className="size-4 text-charcoal" />}
          sparkData={s.sends_by_day.map((d) => d.count)}
          sparkColor="#1a3a2a"
        />
        <KpiCard
          label="Opens (7d)"
          value={s.opens_7d}
          icon={<Eye className="size-4 text-river" />}
          sparkData={s.opens_by_day.map((d) => d.count)}
          sparkColor="#4a7c6f"
          subtitle={`${s.open_rate_7d}% rate`}
        />
        <KpiCard
          label="Clicks (7d)"
          value={s.clicks_7d}
          icon={<MousePointerClick className="size-4 text-bronze" />}
          sparkData={s.clicks_by_day.map((d) => d.count)}
          sparkColor="#a67c52"
          subtitle={`${s.click_rate_7d}% rate`}
        />
        <KpiCard
          label="Bounces (7d)"
          value={s.bounces_7d}
          icon={<AlertTriangle className="size-4 text-red-500" />}
          sparkData={[]}
          alert={s.bounces_7d > 0}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Top Campaigns — takes 3 cols */}
        <div className="lg:col-span-3">
          <div className="rounded-lg border border-stone-light/20 bg-white">
            <div className="flex items-center justify-between border-b border-stone-light/10 px-4 py-3">
              <h3 className="text-sm font-semibold text-text-primary">
                Top Campaigns
              </h3>
              <Link
                href="/admin/crm/campaigns"
                className="flex items-center gap-1 text-xs text-river hover:text-river/80"
              >
                View all <ArrowRight className="size-3" />
              </Link>
            </div>

            {s.top_campaigns.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-text-light">
                No campaigns with sends yet
              </p>
            ) : (
              <div className="divide-y divide-stone-light/10">
                {s.top_campaigns.map((c) => (
                  <Link
                    key={c.id}
                    href={`/admin/crm/campaigns/${c.id}`}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-offwhite/50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-xs font-medium text-text-primary">
                          {c.name}
                        </p>
                        <CampaignStatusBadge status={c.status} />
                        <CampaignTypeBadge type={c.type} />
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-4 text-[11px] text-text-secondary">
                      <span>{c.total_sends} sent</span>
                      <span className="text-river">{c.open_rate}% opens</span>
                      <span className="text-bronze">{c.click_rate}% clicks</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar stats — takes 2 cols */}
        <div className="space-y-4 lg:col-span-2">
          {/* Segments */}
          <div className="rounded-lg border border-stone-light/20 bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="size-4 text-river" />
                <span className="text-xs font-semibold text-text-primary">
                  Segments
                </span>
              </div>
              <Link
                href="/admin/crm/segments"
                className="text-xs text-river hover:text-river/80"
              >
                Manage
              </Link>
            </div>
            <p className="mt-2 text-2xl font-semibold text-text-primary">
              {data.segments_count}
            </p>
            <p className="text-[11px] text-text-light">Audience segments defined</p>
          </div>

          {/* Leads */}
          <div className="rounded-lg border border-stone-light/20 bg-white p-4">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-bronze" />
              <span className="text-xs font-semibold text-text-primary">
                Leads
              </span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-text-primary">
              {s.total_leads}
            </p>
            <p className="text-[11px] text-text-light">Waitlist + contact form submissions</p>
          </div>

          {/* Recent Activity */}
          <div className="rounded-lg border border-stone-light/20 bg-white">
            <div className="border-b border-stone-light/10 px-4 py-3">
              <h3 className="text-xs font-semibold text-text-primary">
                Recent Sends
              </h3>
            </div>
            {data.recent_sends.length === 0 ? (
              <p className="px-4 py-4 text-center text-[11px] text-text-light">
                No sends yet
              </p>
            ) : (
              <div className="divide-y divide-stone-light/10">
                {data.recent_sends.slice(0, 5).map((send) => (
                  <div key={send.id} className="px-4 py-2">
                    <p className="truncate text-[11px] font-medium text-text-primary">
                      {send.recipient_email}
                    </p>
                    <p className="text-[10px] text-text-light">
                      {send.campaign_name}
                      {send.sent_at && (
                        <> · {new Date(send.sent_at).toLocaleDateString()}</>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── KPI Card ───────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  icon,
  sparkData,
  sparkColor,
  subtitle,
  alert,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  sparkData: number[];
  sparkColor?: string;
  subtitle?: string;
  alert?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border bg-white p-3 ${
        alert ? "border-red-200" : "border-stone-light/20"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="text-[11px] text-text-secondary">{label}</span>
        </div>
        {sparkData.length > 1 && (
          <MetricSparkline
            data={sparkData}
            color={sparkColor}
            width={48}
            height={20}
          />
        )}
      </div>
      <p className="mt-1 text-xl font-semibold text-text-primary">
        {value.toLocaleString()}
      </p>
      {subtitle && (
        <p className="text-[10px] text-text-light">{subtitle}</p>
      )}
    </div>
  );
}
