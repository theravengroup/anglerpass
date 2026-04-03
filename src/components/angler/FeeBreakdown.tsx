"use client";

import type { FeeBreakdown as FeeBreakdownType } from "@/lib/constants/fees";
import {
  CROSS_CLUB_FEE_PER_ROD,
  HOME_CLUB_REFERRAL_PER_ROD,
  ANGLERPASS_CROSS_CLUB_SHARE_PER_ROD,
} from "@/lib/constants/fees";

interface FeeBreakdownProps {
  ratePerRod: number;
  partySize: number;
  fees: FeeBreakdownType;
  duration: string;
  nonFishingGuests: number;
  numberOfDays?: number;
  perDayGuideRate?: number;
  selectedGuideName?: string;
}

export default function FeeBreakdown({
  ratePerRod,
  partySize,
  fees,
  duration,
  nonFishingGuests,
  numberOfDays = 1,
  perDayGuideRate = 0,
  selectedGuideName,
}: FeeBreakdownProps) {
  const isMultiDay = numberOfDays > 1;
  const rodLabel = partySize > 1 ? "rods" : "rod";

  return (
    <div className="space-y-1.5 rounded-lg bg-offwhite/80 p-3 text-sm">
      <div className="flex justify-between text-text-secondary">
        <span>
          ${ratePerRod}/day x {partySize} {rodLabel}
          {isMultiDay ? ` x ${numberOfDays} days` : ""}
        </span>
        <span>${fees.baseRate.toFixed(2)}</span>
      </div>
      {fees.crossClubFee > 0 && (
        <div className="flex justify-between text-text-secondary">
          <span>
            Cross-club access fee (${CROSS_CLUB_FEE_PER_ROD}/rod x {partySize} {rodLabel}
            {isMultiDay ? ` x ${numberOfDays} days` : ""})
          </span>
          <span>${fees.crossClubFee.toFixed(2)}</span>
        </div>
      )}
      <div className="flex justify-between text-text-light">
        <span>Platform fee (15%)</span>
        <span>${fees.platformFee.toFixed(2)}</span>
      </div>
      {fees.guideRate > 0 && (
        <>
          <div className="flex justify-between text-text-secondary">
            <span>
              Guide — {selectedGuideName} ({duration === "half_day" ? "half" : "full"} day)
              {isMultiDay ? ` x ${numberOfDays} days` : ""}
            </span>
            <span>${fees.guideRate.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-text-light">
            <span>Guide service fee (10%)</span>
            <span>${fees.guideServiceFee.toFixed(2)}</span>
          </div>
        </>
      )}
      {nonFishingGuests > 0 && (
        <div className="flex justify-between text-text-light">
          <span>
            Non-fishing guests ({nonFishingGuests})
          </span>
          <span className="text-forest">No charge</span>
        </div>
      )}
      <div className="flex justify-between border-t border-stone-light/20 pt-1.5 font-medium text-text-primary">
        <span>Total{isMultiDay ? ` (${numberOfDays} days)` : ""}</span>
        <span>${fees.totalAmount.toFixed(2)}</span>
      </div>
    </div>
  );
}
