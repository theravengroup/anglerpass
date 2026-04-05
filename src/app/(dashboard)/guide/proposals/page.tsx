"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  Loader2,
  MapPin,
  Users,
  DollarSign,
  Send,
  Clock,
  Plus,
} from "lucide-react";
import { PROPOSAL_STATUS } from "@/lib/constants/status";

interface Proposal {
  id: string;
  property_id: string;
  proposed_date: string;
  start_time: string | null;
  duration_hours: number;
  max_anglers: number;
  guide_fee_per_angler: number;
  status: string;
  expires_at: string | null;
  notes: string | null;
  created_at: string;
  properties: { name: string; location_description: string | null } | null;
  invitee_count: number;
}

function getExpiryCountdown(expiresAt: string): string | null {
  const now = Date.now();
  const expiry = new Date(expiresAt).getTime();
  const diff = expiry - now;
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `Expires in ${days}d ${hours}h`;
  if (hours > 0) return `Expires in ${hours}h`;
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `Expires in ${mins}m`;
}

export default function GuideProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/proposals?role=guide");
        if (res.ok) {
          const data = await res.json();
          setProposals(data.proposals ?? []);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const active = proposals.filter((p) => p.status === "sent");
  const drafts = proposals.filter((p) => p.status === "draft");
  const past = proposals.filter((p) =>
    ["accepted", "declined", "expired", "cancelled"].includes(p.status)
  );

  if (loading) {
    return (
      <div className="mx-auto flex max-w-5xl items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-charcoal" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
            Trip Proposals
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Create and manage guided trip proposals.
          </p>
        </div>
        <Link href="/guide/proposals/new">
          <Button className="bg-charcoal text-white hover:bg-charcoal/90">
            <Plus className="size-4" />
            New Proposal
          </Button>
        </Link>
      </div>

      {proposals.length === 0 && (
        <Card className="border-stone-light/20">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex size-14 items-center justify-center rounded-full bg-charcoal/10">
              <Send className="size-6 text-charcoal" />
            </div>
            <h3 className="mt-4 text-base font-medium text-text-primary">
              No proposals yet
            </h3>
            <p className="mt-1 max-w-sm text-center text-sm text-text-secondary">
              Create a trip proposal to invite anglers to fish with you on
              approved waters.
            </p>
            <Link href="/guide/proposals/new">
              <Button className="mt-6 bg-charcoal text-white hover:bg-charcoal/90">
                <Plus className="size-4" />
                Create Your First Proposal
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {active.length > 0 && (
        <ProposalSection
          title="Active"
          count={active.length}
          titleClass="text-river"
          proposals={active}
        />
      )}

      {drafts.length > 0 && (
        <ProposalSection
          title="Drafts"
          count={drafts.length}
          titleClass="text-text-light"
          proposals={drafts}
        />
      )}

      {past.length > 0 && (
        <ProposalSection
          title="Past"
          count={past.length}
          titleClass="text-text-secondary"
          proposals={past}
        />
      )}
    </div>
  );
}

function ProposalSection({
  title,
  count,
  titleClass,
  proposals,
}: {
  title: string;
  count: number;
  titleClass: string;
  proposals: Proposal[];
}) {
  return (
    <div className="space-y-3">
      <h3 className={`text-sm font-medium ${titleClass}`}>
        {title} ({count})
      </h3>
      {proposals.map((p) => (
        <ProposalCard key={p.id} proposal={p} />
      ))}
    </div>
  );
}

function ProposalCard({ proposal }: { proposal: Proposal }) {
  const config = PROPOSAL_STATUS[proposal.status] ?? PROPOSAL_STATUS.draft;
  const Icon = config.icon;
  const expiryText =
    proposal.status === "sent" && proposal.expires_at
      ? getExpiryCountdown(proposal.expires_at)
      : null;

  const linkHref =
    proposal.status === "draft"
      ? `/guide/proposals/${proposal.id}/edit`
      : `/guide/proposals/${proposal.id}`;

  return (
    <Link href={linkHref}>
      <Card className="border-stone-light/20 transition-colors hover:border-charcoal/20">
        <CardContent className="flex items-center gap-4 py-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-charcoal/10">
            <MapPin className="size-4 text-charcoal" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-text-primary">
                {proposal.properties?.name ?? "Unknown Property"}
              </p>
              <div
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.bg} ${config.color}`}
              >
                <Icon className="size-3" />
                {config.label}
              </div>
            </div>

            <div className="mt-2 flex flex-wrap gap-4 text-xs text-text-secondary">
              <span className="flex items-center gap-1">
                <CalendarDays className="size-3" />
                {new Date(proposal.proposed_date).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              {proposal.start_time && (
                <span className="flex items-center gap-1">
                  <Clock className="size-3" />
                  {proposal.start_time}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="size-3" />
                {proposal.max_anglers} angler
                {proposal.max_anglers > 1 ? "s" : ""} max
              </span>
              <span className="flex items-center gap-1">
                <DollarSign className="size-3" />$
                {proposal.guide_fee_per_angler}/angler
              </span>
              <span className="text-text-light">
                {proposal.invitee_count} invited
              </span>
            </div>

            {expiryText && (
              <p className="mt-1 text-xs font-medium text-bronze">
                {expiryText}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
