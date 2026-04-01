"use client";

import type { FeeBreakdown as FeeBreakdownType } from "@/lib/constants/fees";

interface FeeBreakdownProps {
  ratePerRod: number;
  partySize: number;
  fees: FeeBreakdownType;
  duration: string;
  nonFishingGuests: number;
  selectedGuideName?: string;
}

export default function FeeBreakdown({
  ratePerRod,
  partySize,
  fees,
  duration,
  nonFishingGuests,
  selectedGuideName,
}: FeeBreakdownProps) {
  return (
    <div className="space-y-1.5 rounded-lg bg-offwhite/80 p-3 text-sm">
      <div className="flex justify-between text-text-secondary">
        <span>
          ${ratePerRod} x {partySize} rod
          {partySize > 1 ? "s" : ""}
        </span>
        <span>${fees.baseRate.toFixed(2)}</span>
      </div>
      {fees.crossClubFee > 0 && (
        <div className="flex justify-between text-text-secondary">
          <span>
            Cross-club fee ($10 x {partySize} rod
            {partySize > 1 ? "s" : ""})
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
        <span>Total</span>
        <span>${fees.totalAmount.toFixed(2)}</span>
      </div>
    </div>
  );
}
