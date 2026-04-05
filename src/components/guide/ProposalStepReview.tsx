"use client";

import {
  CalendarDays,
  Clock,
  MapPin,
  Users,
  DollarSign,
  UserPlus,
} from "lucide-react";
import { GUIDE_SERVICE_FEE_RATE } from "@/lib/constants/fees";
import type { TripDetails } from "./ProposalStepDetails";
import type { InvitedAngler } from "./ProposalStepInvite";

export function ProposalStepReview({
  propertyName,
  details,
  feePerAngler,
  invitees,
}: {
  propertyName: string;
  details: TripDetails;
  feePerAngler: number;
  invitees: InvitedAngler[];
}) {
  const serviceFee =
    Math.round(feePerAngler * GUIDE_SERVICE_FEE_RATE * 100) / 100;
  const netPerAngler = Math.round((feePerAngler - serviceFee) * 100) / 100;

  return (
    <div className="space-y-5">
      <p className="text-sm text-text-secondary">
        Review your proposal before sending.
      </p>

      <div className="space-y-4 rounded-lg border border-stone-light/20 bg-offwhite/50 p-5">
        {/* Property */}
        <div className="flex items-center gap-2">
          <MapPin className="size-4 text-charcoal" />
          <span className="text-sm font-medium text-text-primary">
            {propertyName}
          </span>
        </div>

        {/* Date & Time */}
        <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5" />
            {new Date(details.proposedDate).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          {details.startTime && (
            <span className="flex items-center gap-1.5">
              <Clock className="size-3.5" />
              {details.startTime}
            </span>
          )}
          <span>{details.durationHours}h duration</span>
        </div>

        {/* Party size */}
        <div className="flex items-center gap-1.5 text-sm text-text-secondary">
          <Users className="size-3.5" />
          Up to {details.maxAnglers} angler
          {details.maxAnglers > 1 ? "s" : ""}
        </div>

        {/* Fee */}
        <div className="flex items-center gap-1.5 text-sm text-text-secondary">
          <DollarSign className="size-3.5" />
          ${feePerAngler.toFixed(2)}/angler (you net $
          {netPerAngler.toFixed(2)} after {GUIDE_SERVICE_FEE_RATE * 100}% fee)
        </div>

        {/* Notes */}
        {details.notes && (
          <div className="border-t border-stone-light/20 pt-3">
            <p className="text-xs font-medium text-text-secondary">Notes</p>
            <p className="mt-1 text-sm text-text-primary">{details.notes}</p>
          </div>
        )}

        {/* Invitees */}
        <div className="border-t border-stone-light/20 pt-3">
          <div className="flex items-center gap-1.5">
            <UserPlus className="size-3.5 text-text-secondary" />
            <p className="text-xs font-medium text-text-secondary">
              Invitees ({invitees.length})
            </p>
          </div>
          <ul className="mt-2 space-y-1">
            {invitees.map((a) => (
              <li key={a.id} className="text-sm text-text-primary">
                {a.display_name}{" "}
                <span className="text-text-light">({a.email})</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
