"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Loader2,
  User,
  Users,
} from "lucide-react";
import { PROPOSAL_STATUS } from "@/lib/constants/status";
import type { FeeBreakdown } from "@/lib/constants/fees";
import { getExpiryInfo } from "@/lib/utils/proposal-expiry";
import ProposalCostBreakdown from "@/components/angler/ProposalCostBreakdown";
import ProposalActionButtons from "@/components/angler/ProposalActionButtons";
import ProposalPropertyCard from "@/components/angler/ProposalPropertyCard";
import ProposalGuideCard from "@/components/angler/ProposalGuideCard";

interface ProposalDetail {
  id: string;
  status: string;
  proposed_date: string;
  proposed_time: string | null;
  duration_hours: number;
  max_anglers: number;
  expires_at: string | null;
  guide_notes: string | null;
  total_amount: number;
  is_cross_club: boolean;
  created_at: string;
  invitee_status: string;
  invitee_count: number;
  guide: {
    id: string;
    display_name: string;
    bio: string | null;
    profile_photo_url: string | null;
    rating_avg: number | null;
    rating_count: number | null;
  };
  property: {
    id: string;
    name: string;
    location_description: string | null;
    water_type: string | null;
  };
  fee_breakdown: FeeBreakdown;
}

export default function ProposalDetailPage() {
  const params = useParams();
  const proposalId = params.id as string;

  const [proposal, setProposal] = useState<ProposalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [responseResult, setResponseResult] = useState<
    "accepted" | "declined" | null
  >(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/proposals/${proposalId}`);
        if (res.status === 404) {
          setError("Proposal not found.");
          return;
        }
        if (!res.ok) {
          setError("Failed to load proposal.");
          return;
        }
        const data = await res.json();
        setProposal(data.proposal);
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [proposalId]);

  if (loading) {
    return (
      <div className="mx-auto flex max-w-3xl items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-bronze" />
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="mx-auto max-w-3xl py-12">
        <Card className="border-stone-light/20">
          <CardContent className="flex flex-col items-center py-16">
            <p className="text-sm text-text-secondary" role="alert" aria-live="polite">
              {error ?? "Proposal not found."}
            </p>
            <Link href="/angler/proposals">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="mr-1.5 size-4" />
                Back to Proposals
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusConfig =
    PROPOSAL_STATUS[proposal.status] ?? PROPOSAL_STATUS.draft;
  const StatusIcon = statusConfig.icon;
  const expiry = getExpiryInfo(proposal.expires_at);
  const canRespond =
    proposal.invitee_status === "pending" &&
    proposal.status === "sent" &&
    !expiry.isExpired &&
    !responseResult;

  function handleResponded(response: "accepted" | "declined") {
    setResponseResult(response);
    setProposal((prev) =>
      prev
        ? {
            ...prev,
            invitee_status: response,
            status: response === "accepted" ? "accepted" : prev.status,
          }
        : prev
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back link + header */}
      <div>
        <Link
          href="/angler/proposals"
          className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft className="size-3.5" />
          Back to Proposals
        </Link>
        <div className="mt-3 flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
            Trip Proposal
          </h2>
          <div
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${statusConfig.bg} ${statusConfig.color}`}
          >
            <StatusIcon className="size-3.5" />
            {statusConfig.label}
          </div>
        </div>
      </div>

      {/* Property info */}
      <ProposalPropertyCard
        name={proposal.property.name}
        locationDescription={proposal.property.location_description}
        waterType={proposal.property.water_type}
      />

      {/* Trip details */}
      <Card className="border-stone-light/20">
        <CardContent className="py-4">
          <h3 className="text-xs font-medium uppercase tracking-wide text-text-light">
            Trip Details
          </h3>
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="flex items-center gap-1 text-xs text-text-light">
                <CalendarDays className="size-3" />
                Date
              </p>
              <p className="mt-0.5 text-sm font-medium text-text-primary">
                {new Date(proposal.proposed_date).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
            {proposal.proposed_time && (
              <div>
                <p className="flex items-center gap-1 text-xs text-text-light">
                  <Clock className="size-3" />
                  Time
                </p>
                <p className="mt-0.5 text-sm font-medium text-text-primary">
                  {proposal.proposed_time}
                </p>
              </div>
            )}
            <div>
              <p className="flex items-center gap-1 text-xs text-text-light">
                <Clock className="size-3" />
                Duration
              </p>
              <p className="mt-0.5 text-sm font-medium text-text-primary">
                {proposal.duration_hours}h
              </p>
            </div>
            <div>
              <p className="flex items-center gap-1 text-xs text-text-light">
                <Users className="size-3" />
                Party Size
              </p>
              <p className="mt-0.5 text-sm font-medium text-text-primary">
                {proposal.max_anglers} angler
                {proposal.max_anglers > 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Guide info */}
      <ProposalGuideCard
        displayName={proposal.guide.display_name}
        bio={proposal.guide.bio}
        profilePhotoUrl={proposal.guide.profile_photo_url}
        ratingAvg={proposal.guide.rating_avg}
        ratingCount={proposal.guide.rating_count}
      />

      {/* Cost breakdown */}
      <ProposalCostBreakdown
        fees={proposal.fee_breakdown}
        maxAnglers={proposal.max_anglers}
      />

      {/* Guide notes */}
      {proposal.guide_notes && (
        <Card className="border-stone-light/20">
          <CardContent className="py-4">
            <h3 className="text-xs font-medium uppercase tracking-wide text-text-light">
              Notes from Guide
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              {proposal.guide_notes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Expiry countdown */}
      {expiry.label && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm font-medium ${
            expiry.isExpired
              ? "border-red-200 bg-red-50 text-red-600"
              : expiry.isUrgent
                ? "border-bronze/30 bg-bronze/10 text-bronze"
                : "border-stone-light/20 bg-offwhite text-text-secondary"
          }`}
        >
          <Clock className="mr-1.5 inline size-4 align-text-bottom" />
          {expiry.isExpired ? "This proposal has expired." : expiry.label}
        </div>
      )}

      {/* Other invitees */}
      {proposal.invitee_count > 1 && (
        <p className="flex items-center gap-1.5 text-sm text-text-light">
          <User className="size-3.5" />
          {proposal.invitee_count - 1} other angler
          {proposal.invitee_count - 1 > 1 ? "s" : ""} also invited
        </p>
      )}

      {/* Response result message */}
      {responseResult && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm font-medium ${
            responseResult === "accepted"
              ? "border-forest/20 bg-forest/10 text-forest"
              : "border-red-200 bg-red-50 text-red-500"
          }`}
          role="alert"
          aria-live="polite"
        >
          {responseResult === "accepted"
            ? "You've accepted this trip proposal. A confirmed booking has been created."
            : "You've declined this trip proposal."}
        </div>
      )}

      {/* Already responded */}
      {!responseResult && proposal.invitee_status !== "pending" && (
        <div className="rounded-lg border border-stone-light/20 bg-offwhite px-4 py-3 text-sm text-text-secondary">
          You {proposal.invitee_status} this proposal.
        </div>
      )}

      {/* Action buttons */}
      {canRespond && (
        <ProposalActionButtons
          proposalId={proposal.id}
          onResponded={handleResponded}
        />
      )}
    </div>
  );
}
