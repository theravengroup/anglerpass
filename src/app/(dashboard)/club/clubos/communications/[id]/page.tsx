"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ChevronRight,
  Send,
  Eye,
  MousePointerClick,
  AlertTriangle,
  Users,
  CheckCircle2,
  Loader2,
  Download,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatCardGrid from "@/components/shared/StatCardGrid";
import type { StatCardItem } from "@/components/shared/StatCardGrid";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { CLUB_CAMPAIGN_STATUS } from "@/lib/constants/status";

interface CampaignAnalytics {
  campaign: {
    id: string;
    subject: string;
    type: string;
    status: string;
    sent_at: string | null;
  };
  summary: {
    total_recipients: number;
    delivered: number;
    bounced: number;
    failed: number;
    skipped: number;
    unique_opens: number;
    total_opens: number;
    unique_clicks: number;
    total_clicks: number;
    open_rate: number;
    click_rate: number;
    bounce_rate: number;
  };
  status_breakdown: Record<string, number>;
  recipients: Array<{
    status: string;
    email: string;
    sent_at: string | null;
    opened_at: string | null;
    open_count: number | null;
    clicked_at: string | null;
    click_count: number | null;
    bounced_at: string | null;
    bounce_reason: string | null;
    error_message: string | null;
  }>;
}

const RECIPIENT_STATUS_COLORS: Record<string, string> = {
  pending: "text-text-light bg-stone-light/10",
  queued: "text-bronze bg-bronze/10",
  sent: "text-river bg-river/10",
  delivered: "text-forest bg-forest/10",
  opened: "text-forest bg-forest/10",
  clicked: "text-forest bg-forest/10",
  bounced: "text-red-500 bg-red-50",
  failed: "text-red-500 bg-red-50",
  skipped: "text-text-light bg-stone-light/10",
};

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<CampaignAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [id]);

  async function loadAnalytics() {
    try {
      const res = await fetch(`/api/clubos/campaigns/${id}/analytics`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // Handle silently
    } finally {
      setLoading(false);
    }
  }

  function exportRecipients() {
    if (!data) return;
    const headers = ["Email", "Status", "Sent At", "Opened At", "Clicked At"];
    const rows = data.recipients.map((r) => [
      r.email,
      r.status,
      r.sent_at ?? "",
      r.opened_at ?? "",
      r.clicked_at ?? "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `campaign-${id}-recipients.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-5xl items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-river" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <p className="text-sm text-text-secondary">Campaign not found.</p>
      </div>
    );
  }

  const { campaign, summary, recipients } = data;

  const stats: StatCardItem[] = [
    {
      label: "Recipients",
      value: String(summary.total_recipients),
      description: `${summary.delivered} delivered`,
      icon: Users,
      color: "text-river",
      bg: "bg-river/10",
    },
    {
      label: "Open Rate",
      value: `${summary.open_rate}%`,
      description: `${summary.unique_opens} unique opens`,
      icon: Eye,
      color: "text-forest",
      bg: "bg-forest/10",
    },
    {
      label: "Click Rate",
      value: `${summary.click_rate}%`,
      description: `${summary.unique_clicks} unique clicks`,
      icon: MousePointerClick,
      color: "text-bronze",
      bg: "bg-bronze/10",
    },
    {
      label: "Bounce Rate",
      value: `${summary.bounce_rate}%`,
      description: `${summary.bounced} bounced, ${summary.failed} failed`,
      icon: AlertTriangle,
      color: "text-charcoal",
      bg: "bg-charcoal/10",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-text-light">
        <Link
          href="/club/clubos"
          className="transition-colors hover:text-text-secondary"
        >
          ClubOS
        </Link>
        <ChevronRight className="size-3.5" />
        <Link
          href="/club/clubos/communications"
          className="transition-colors hover:text-text-secondary"
        >
          Communications
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-text-primary font-medium">Campaign Detail</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h2 className="font-heading text-2xl font-semibold text-text-primary">
              {campaign.subject || "(No subject)"}
            </h2>
            <StatusBadge
              status={campaign.status}
              config={CLUB_CAMPAIGN_STATUS}
            />
          </div>
          <div className="flex items-center gap-3 text-sm text-text-secondary">
            <span className="rounded-full bg-river/10 px-2 py-0.5 text-xs font-medium capitalize text-river">
              {campaign.type}
            </span>
            {campaign.sent_at && (
              <span>
                Sent{" "}
                {new Date(campaign.sent_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={exportRecipients}>
          <Download className="size-4" />
          Export CSV
        </Button>
      </div>

      {/* Stats */}
      <StatCardGrid stats={stats} />

      {/* Recipients Table */}
      <Card className="border-stone-light/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="size-4 text-river" />
            Recipients ({recipients.length})
          </CardTitle>
          <CardDescription>
            Individual delivery status for each recipient
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-light/20 text-left text-xs text-text-light">
                  <th className="pb-2 pr-4">Email</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 pr-4">Sent</th>
                  <th className="pb-2 pr-4">Opened</th>
                  <th className="pb-2 pr-4">Clicked</th>
                  <th className="pb-2">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-light/10">
                {recipients.map((r, i) => (
                  <tr key={i}>
                    <td className="py-2.5 pr-4 text-text-primary">
                      {r.email}
                    </td>
                    <td className="py-2.5 pr-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${RECIPIENT_STATUS_COLORS[r.status] ?? "text-text-light bg-stone-light/10"}`}
                      >
                        {r.status === "delivered" ||
                        r.status === "opened" ||
                        r.status === "clicked" ? (
                          <CheckCircle2 className="size-3" />
                        ) : null}
                        {r.status}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-text-secondary">
                      {r.sent_at
                        ? new Date(r.sent_at).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })
                        : "—"}
                    </td>
                    <td className="py-2.5 pr-4 text-text-secondary">
                      {r.opened_at
                        ? `${r.open_count ?? 1}×`
                        : "—"}
                    </td>
                    <td className="py-2.5 pr-4 text-text-secondary">
                      {r.clicked_at
                        ? `${r.click_count ?? 1}×`
                        : "—"}
                    </td>
                    <td className="py-2.5 text-xs text-text-light">
                      {r.bounce_reason ?? r.error_message ?? ""}
                    </td>
                  </tr>
                ))}
                {recipients.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-8 text-center text-text-light"
                    >
                      No recipients yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
