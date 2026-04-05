"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Send } from "lucide-react";
import ProposalCard from "@/components/angler/ProposalCard";

interface ProposalSummary {
  id: string;
  status: string;
  proposed_date: string;
  expires_at: string | null;
  guide_name: string;
  property_name: string;
  property_location: string | null;
  max_anglers: number;
  total_amount: number;
  invitee_status: string;
}

export default function AnglerProposalsPage() {
  const [proposals, setProposals] = useState<ProposalSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/proposals?role=angler");
        if (res.ok) {
          const data = await res.json();
          setProposals(data.proposals ?? []);
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const pending = proposals.filter(
    (p) => p.invitee_status === "pending" && p.status === "sent"
  );
  const responded = proposals.filter(
    (p) => p.invitee_status !== "pending" || p.status !== "sent"
  );

  if (loading) {
    return (
      <div className="mx-auto flex max-w-5xl items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-bronze" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
          Trip Proposals
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Proposals from guides for upcoming fishing trips.
        </p>
      </div>

      {proposals.length === 0 && (
        <Card className="border-stone-light/20">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex size-14 items-center justify-center rounded-full bg-bronze/10">
              <Send className="size-6 text-bronze" />
            </div>
            <h3 className="mt-4 text-base font-medium text-text-primary">
              No proposals yet
            </h3>
            <p className="mt-1 max-w-sm text-center text-sm text-text-secondary">
              When a guide sends you a trip proposal, it will appear here for
              you to review and accept.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pending proposals */}
      {pending.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-text-secondary">
            Awaiting Response ({pending.length})
          </h3>
          {pending.map((proposal) => (
            <ProposalCard key={proposal.id} proposal={proposal} />
          ))}
        </div>
      )}

      {/* Responded / expired proposals */}
      {responded.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-text-secondary">
            Past ({responded.length})
          </h3>
          {responded.map((proposal) => (
            <ProposalCard key={proposal.id} proposal={proposal} />
          ))}
        </div>
      )}
    </div>
  );
}
