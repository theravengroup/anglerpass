"use client";

import { useEffect, useState } from "react";
import type { UsageStatus } from "@/lib/compass/usage";
import type { CreditPack } from "@/lib/constants/compass-usage";

interface UsageResponse extends UsageStatus {
  packs: CreditPack[];
  suggestedPack: string | null;
}

interface CompassUsageBadgeProps {
  onBuyCredits: () => void;
}

export default function CompassUsageBadge({
  onBuyCredits,
}: CompassUsageBadgeProps) {
  const [usage, setUsage] = useState<UsageResponse | null>(null);

  useEffect(() => {
    fetch("/api/compass/usage")
      .then((res) => res.json())
      .then(setUsage)
      .catch(() => {});
  }, []);

  if (!usage || usage.isUnlimited) return null;

  const { monthlyUsed, monthlyLimit, creditBalance, warningReached } = usage;

  if (monthlyLimit === null) return null;

  const percentage = Math.min((monthlyUsed / monthlyLimit) * 100, 100);
  const overLimit = monthlyUsed >= monthlyLimit;

  // Using purchased credits
  if (overLimit && creditBalance > 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-river-pale/50 px-3 py-1.5 text-xs">
        <div className="flex-1">
          <span className="text-text-secondary">
            Using purchased credits ({creditBalance} remaining)
          </span>
        </div>
      </div>
    );
  }

  // Fully exhausted
  if (overLimit) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-1.5 text-xs">
        <span className="text-red-700">Monthly messages used up</span>
        <button
          onClick={onBuyCredits}
          className="ml-auto shrink-0 rounded-md bg-bronze px-2.5 py-1 font-medium text-white transition-colors hover:bg-bronze/90"
        >
          Get More
        </button>
      </div>
    );
  }

  // Warning state
  if (warningReached) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-1.5 text-xs">
        <div className="flex flex-1 items-center gap-2">
          <span className="text-amber-700">Running low</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-amber-200">
            <div
              className="h-full rounded-full bg-amber-500 transition-all"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="text-text-light">
            {monthlyUsed}/{monthlyLimit}
          </span>
        </div>
      </div>
    );
  }

  // Normal state
  return (
    <div className="flex items-center gap-2 rounded-lg bg-stone-light/30 px-3 py-1.5 text-xs">
      <div className="flex flex-1 items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone-light">
          <div
            className="h-full rounded-full bg-river transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-text-light">
          {monthlyUsed}/{monthlyLimit}
        </span>
      </div>
    </div>
  );
}

/**
 * Hook to refresh usage after a message is sent.
 * Call refreshUsage() from CompassChat after each successful response.
 */
export function useCompassUsage() {
  const [usage, setUsage] = useState<UsageResponse | null>(null);

  const refreshUsage = () => {
    fetch("/api/compass/usage")
      .then((res) => res.json())
      .then(setUsage)
      .catch(() => {});
  };

  useEffect(() => {
    refreshUsage();
  }, []);

  return { usage, refreshUsage };
}
