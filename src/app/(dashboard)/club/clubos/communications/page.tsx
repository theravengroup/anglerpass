"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Megaphone,
  Send,
  Eye,
  MousePointerClick,
  Plus,
  Target,
  LayoutTemplate,
  Loader2,
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
import { EmptyState } from "@/components/shared/EmptyState";
import { CLUB_CAMPAIGN_STATUS } from "@/lib/constants/status";

interface Campaign {
  id: string;
  subject: string;
  type: string;
  status: string;
  sent_at: string | null;
  recipient_count: number | null;
  open_count: number;
  click_count: number;
  created_at: string;
}

interface DashboardData {
  campaigns: Campaign[];
  pagination: { total: number };
}

export default function CommunicationsDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [clubId, setClubId] = useState<string | null>(null);

  useEffect(() => {
    loadClubId();
  }, []);

  useEffect(() => {
    if (clubId) loadCampaigns();
  }, [clubId]);

  async function loadClubId() {
    try {
      const res = await fetch("/api/clubs");
      const json = await res.json();
      const club =
        json.owned?.[0] ?? json.staff_of?.[0] ?? json.member_of?.[0];
      if (club) setClubId(club.id);
      else setLoading(false);
    } catch {
      setLoading(false);
    }
  }

  async function loadCampaigns() {
    try {
      const res = await fetch(
        `/api/clubos/campaigns?club_id=${clubId}&limit=10`
      );
      const json = await res.json();
      setData(json);
    } catch {
      // Silently handle — show empty state
    } finally {
      setLoading(false);
    }
  }

  const campaigns = data?.campaigns ?? [];
  const totalCampaigns = data?.pagination?.total ?? 0;

  // Compute summary stats from loaded campaigns
  const sentCampaigns = campaigns.filter(
    (c) => c.status === "sent" || c.status === "partially_sent"
  );
  const totalSends = sentCampaigns.reduce(
    (acc, c) => acc + (c.recipient_count ?? 0),
    0
  );
  const totalOpens = sentCampaigns.reduce((acc, c) => acc + c.open_count, 0);
  const totalClicks = sentCampaigns.reduce((acc, c) => acc + c.click_count, 0);
  const avgOpenRate =
    totalSends > 0 ? Math.round((totalOpens / totalSends) * 100) : 0;
  const avgClickRate =
    totalSends > 0 ? Math.round((totalClicks / totalSends) * 100) : 0;

  const stats: StatCardItem[] = [
    {
      label: "Total Campaigns",
      value: String(totalCampaigns),
      description: "All time",
      icon: Megaphone,
      color: "text-river",
      bg: "bg-river/10",
    },
    {
      label: "Total Sends",
      value: totalSends.toLocaleString(),
      description: "Emails delivered",
      icon: Send,
      color: "text-forest",
      bg: "bg-forest/10",
    },
    {
      label: "Avg Open Rate",
      value: `${avgOpenRate}%`,
      description: "Across sent campaigns",
      icon: Eye,
      color: "text-bronze",
      bg: "bg-bronze/10",
    },
    {
      label: "Avg Click Rate",
      value: `${avgClickRate}%`,
      description: "Across sent campaigns",
      icon: MousePointerClick,
      color: "text-charcoal",
      bg: "bg-charcoal/10",
    },
  ];

  if (loading) {
    return (
      <div className="mx-auto flex max-w-5xl items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-river" />
      </div>
    );
  }

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
        <span className="text-text-primary font-medium">Communications</span>
      </nav>

      {/* Header + Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-text-primary">
            Communications
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Send broadcasts, targeted messages, and digests to
            your&nbsp;members.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/club/clubos/communications/templates">
              <LayoutTemplate className="size-4" />
              Templates
            </Link>
          </Button>
          <Button asChild size="sm" className="bg-river text-white hover:bg-river/90">
            <Link href="/club/clubos/communications/new">
              <Plus className="size-4" />
              New Campaign
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <StatCardGrid stats={stats} />

      {/* Quick Actions */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Link href="/club/clubos/communications/new?type=broadcast">
          <Card className="border-stone-light/20 transition-colors hover:border-river/30">
            <CardContent className="flex items-center gap-3 py-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-river/10">
                <Megaphone className="size-5 text-river" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">
                  New Broadcast
                </p>
                <p className="text-xs text-text-light">
                  Send to all members
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/club/clubos/communications/new?type=targeted">
          <Card className="border-stone-light/20 transition-colors hover:border-river/30">
            <CardContent className="flex items-center gap-3 py-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-bronze/10">
                <Target className="size-5 text-bronze" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">
                  Targeted Message
                </p>
                <p className="text-xs text-text-light">
                  Filter by segment
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/club/clubos/communications/groups">
          <Card className="border-stone-light/20 transition-colors hover:border-river/30">
            <CardContent className="flex items-center gap-3 py-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-forest/10">
                <Target className="size-5 text-forest" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">
                  Member Groups
                </p>
                <p className="text-xs text-text-light">
                  Manage segments
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Campaigns Table */}
      {campaigns.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No campaigns yet"
          description="Create your first broadcast or targeted message to start communicating with your&nbsp;members."
          iconColor="text-river"
          iconBackground
        >
          <Button asChild className="bg-river text-white hover:bg-river/90">
            <Link href="/club/clubos/communications/new">
              <Plus className="size-4" />
              Create Campaign
            </Link>
          </Button>
        </EmptyState>
      ) : (
        <Card className="border-stone-light/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Megaphone className="size-4 text-river" />
              Recent Campaigns
            </CardTitle>
            <CardDescription>
              Your latest campaigns and their performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-light/20 text-left text-xs text-text-light">
                    <th className="pb-2 pr-4">Subject</th>
                    <th className="pb-2 pr-4">Type</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2 pr-4">Sent</th>
                    <th className="pb-2 pr-4 text-right">Opens</th>
                    <th className="pb-2 text-right">Clicks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-light/10">
                  {campaigns.map((campaign) => {
                    const openRate =
                      campaign.recipient_count && campaign.recipient_count > 0
                        ? Math.round(
                            (campaign.open_count /
                              campaign.recipient_count) *
                              100
                          )
                        : 0;
                    const clickRate =
                      campaign.recipient_count && campaign.recipient_count > 0
                        ? Math.round(
                            (campaign.click_count /
                              campaign.recipient_count) *
                              100
                          )
                        : 0;

                    return (
                      <tr key={campaign.id} className="group">
                        <td className="py-2.5 pr-4">
                          <Link
                            href={`/club/clubos/communications/${campaign.id}`}
                            className="font-medium text-text-primary transition-colors group-hover:text-river"
                          >
                            {campaign.subject || "(No subject)"}
                          </Link>
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className="rounded-full bg-river/10 px-2 py-0.5 text-xs font-medium capitalize text-river">
                            {campaign.type}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4">
                          <StatusBadge
                            status={campaign.status}
                            config={CLUB_CAMPAIGN_STATUS}
                          />
                        </td>
                        <td className="py-2.5 pr-4 text-text-secondary">
                          {campaign.sent_at
                            ? new Date(
                                campaign.sent_at
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })
                            : "—"}
                        </td>
                        <td className="py-2.5 pr-4 text-right text-text-secondary">
                          {openRate}%
                        </td>
                        <td className="py-2.5 text-right text-text-secondary">
                          {clickRate}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
