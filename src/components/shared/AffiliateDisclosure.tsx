"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import {
  AFFILIATE_DISCLOSURE_SHORT,
  AFFILIATE_DISCLOSURE_FULL,
} from "@/lib/constants/affiliate";

interface AffiliateDisclosureProps {
  /** Compact inline version (default) or expanded block */
  variant?: "inline" | "block";
}

/**
 * FTC-compliant affiliate disclosure component.
 * Shown near every Compass AI product recommendation block.
 */
export default function AffiliateDisclosure({
  variant = "inline",
}: AffiliateDisclosureProps) {
  const [expanded, setExpanded] = useState(false);

  if (variant === "block") {
    return (
      <div className="rounded-lg border border-parchment bg-parchment-light/50 px-4 py-3 text-xs leading-relaxed text-text-secondary">
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 size-3.5 shrink-0 text-stone" />
          <p>{AFFILIATE_DISCLOSURE_FULL}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-[11px] leading-relaxed text-text-light">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="inline-flex items-center gap-1 text-text-light/70 transition-colors hover:text-text-secondary"
        aria-expanded={expanded}
        aria-label="Affiliate disclosure"
      >
        <Info className="size-3" />
        <span>{AFFILIATE_DISCLOSURE_SHORT}</span>
      </button>
      {expanded && (
        <p className="mt-1.5 rounded border border-parchment bg-parchment-light/50 px-3 py-2">
          {AFFILIATE_DISCLOSURE_FULL}
        </p>
      )}
    </div>
  );
}
