"use client";

import type { FeeBreakdown } from "@/lib/constants/fees";
import { CROSS_CLUB_FEE_PER_ROD } from "@/lib/constants/fees";

interface ProposalCostBreakdownProps {
  fees: FeeBreakdown;
  maxAnglers: number;
}

export default function ProposalCostBreakdown({
  fees,
  maxAnglers,
}: ProposalCostBreakdownProps) {
  const rodLabel = maxAnglers > 1 ? "anglers" : "angler";
  const totalPerAngler =
    maxAnglers > 0 ? Math.round((fees.totalAmount / maxAnglers) * 100) / 100 : 0;

  return (
    <div className="space-y-2 rounded-lg border border-stone-light/20 bg-offwhite/50 p-4">
      <h4 className="text-sm font-medium text-text-primary">Cost Breakdown</h4>

      <div className="space-y-1.5 text-sm">
        {/* Rod fee */}
        <div className="flex justify-between text-text-secondary">
          <span>
            Rod fee: ${fees.ratePerRod}/rod x {maxAnglers} {rodLabel}
          </span>
          <span>${fees.baseRate.toFixed(2)}</span>
        </div>

        {/* Platform fee */}
        <div className="flex justify-between text-text-light">
          <span>Platform fee (15%)</span>
          <span>${fees.platformFee.toFixed(2)}</span>
        </div>

        {/* Cross-club fee */}
        {fees.crossClubFee > 0 && (
          <div className="flex justify-between text-text-secondary">
            <span>
              Cross-club access (${CROSS_CLUB_FEE_PER_ROD}/rod x {maxAnglers}{" "}
              {rodLabel})
            </span>
            <span>${fees.crossClubFee.toFixed(2)}</span>
          </div>
        )}

        {/* Guide fee */}
        {fees.guideRate > 0 && (
          <>
            <div className="flex justify-between text-text-secondary">
              <span>Guide fee</span>
              <span>${fees.guideRate.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-text-light">
              <span>Guide service fee (10%)</span>
              <span>${fees.guideServiceFee.toFixed(2)}</span>
            </div>
          </>
        )}

        {/* Divider + totals */}
        <div className="border-t border-stone-light/20 pt-2">
          {maxAnglers > 1 && (
            <div className="flex justify-between text-sm font-medium text-text-secondary">
              <span>Total per angler</span>
              <span>${totalPerAngler.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-semibold text-text-primary">
            <span>Total for party</span>
            <span>${fees.totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
