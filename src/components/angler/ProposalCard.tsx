"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, Clock, MapPin, User } from "lucide-react";
import { PROPOSAL_STATUS } from "@/lib/constants/status";
import { getExpiryInfo } from "@/lib/utils/proposal-expiry";

interface ProposalCardProps {
  proposal: {
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
  };
}

export default function ProposalCard({ proposal }: ProposalCardProps) {
  const config = PROPOSAL_STATUS[proposal.status] ?? PROPOSAL_STATUS.draft;
  const Icon = config.icon;
  const expiry = getExpiryInfo(proposal.expires_at);

  return (
    <Link href={`/angler/proposals/${proposal.id}`}>
      <Card className="border-stone-light/20 transition-all hover:border-bronze/30 hover:shadow-md">
        <CardContent className="flex items-center gap-4 py-4">
          {/* Guide avatar placeholder */}
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-charcoal/10 text-base font-semibold text-charcoal">
            {proposal.guide_name.charAt(0).toUpperCase()}
          </div>

          {/* Details */}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-text-primary">
                  {proposal.guide_name}
                </p>
                <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-text-secondary">
                  <MapPin className="size-3 shrink-0" />
                  {proposal.property_name}
                  {proposal.property_location && (
                    <span className="text-text-light">
                      — {proposal.property_location}
                    </span>
                  )}
                </p>
              </div>
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
              <span className="flex items-center gap-1">
                <User className="size-3" />
                {proposal.max_anglers} angler
                {proposal.max_anglers > 1 ? "s" : ""}
              </span>
              <span className="font-medium text-text-primary">
                ${proposal.total_amount.toFixed(2)}
              </span>
              {expiry.label && (
                <span
                  className={`flex items-center gap-1 ${expiry.isExpired ? "text-red-500" : expiry.isUrgent ? "text-bronze" : "text-text-light"}`}
                >
                  <Clock className="size-3" />
                  {expiry.label}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
