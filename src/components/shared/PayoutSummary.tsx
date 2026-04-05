"use client";

import type { FeeBreakdown } from "@/lib/constants/fees";

interface PayoutSummaryProps {
  fees: FeeBreakdown;
  className?: string;
}

/**
 * Visual breakdown of where booking funds are distributed.
 * Used in admin dashboard, landowner booking details, and club reports.
 */
export function PayoutSummary({ fees, className = "" }: PayoutSummaryProps) {
  const rows: Array<{
    label: string;
    amount: number;
    color: string;
    sublabel?: string;
  }> = [];

  rows.push({
    label: "Landowner Payout",
    amount: fees.landownerPayout,
    color: "text-forest",
    sublabel: `$${fees.ratePerRod}/rod × ${fees.rodCount} rod${fees.rodCount > 1 ? "s" : ""} × ${fees.numberOfDays} day${fees.numberOfDays > 1 ? "s" : ""} − $${fees.clubCommission} commission`,
  });

  if (fees.clubCommission > 0) {
    rows.push({
      label: "Club Commission",
      amount: fees.clubCommission,
      color: "text-river",
      sublabel: `$5/rod × ${fees.rodCount} × ${fees.numberOfDays} day${fees.numberOfDays > 1 ? "s" : ""}`,
    });
  }

  if (fees.isCrossClub && fees.homeClubReferral > 0) {
    rows.push({
      label: "Home Club Referral",
      amount: fees.homeClubReferral,
      color: "text-river",
      sublabel: `$5/rod cross-club referral`,
    });
  }

  if (fees.guidePayout > 0) {
    rows.push({
      label: "Guide Payout",
      amount: fees.guidePayout,
      color: "text-charcoal",
      sublabel: `Guide rate × ${fees.numberOfDays} day${fees.numberOfDays > 1 ? "s" : ""}`,
    });
  }

  rows.push({
    label: "AnglerPass Revenue",
    amount: fees.anglerpassRevenue,
    color: "text-bronze",
    sublabel: [
      fees.platformFee > 0 ? `$${fees.platformFee.toFixed(2)} platform fee` : null,
      fees.isCrossClub ? `$${(fees.crossClubFee - fees.homeClubReferral).toFixed(2)} cross-club` : null,
      fees.guideServiceFee > 0 ? `$${fees.guideServiceFee.toFixed(2)} guide service` : null,
    ]
      .filter(Boolean)
      .join(" + "),
  });

  return (
    <div className={`space-y-3 ${className}`}>
      <h4 className="text-sm font-semibold text-text-primary">
        Payout Distribution
      </h4>

      {/* Visual bar — inline style={{ width }} is required here because each
         segment's width is a runtime-computed percentage of the total. Tailwind
         cannot generate arbitrary dynamic values so this is an accepted exception. */}
      <div className="flex h-3 overflow-hidden rounded-full">
        {fees.landownerPayout > 0 && (
          <div
            className="bg-forest"
            title={`Landowner: $${fees.landownerPayout.toFixed(2)}`}
            aria-label={`Landowner payout: $${fees.landownerPayout.toFixed(2)}`}
            role="img"
            style={{ width: `${(fees.landownerPayout / fees.totalAmount) * 100}%` }}
          />
        )}
        {fees.clubCommission > 0 && (
          <div
            className="bg-river"
            title={`Club: $${fees.clubCommission.toFixed(2)}`}
            aria-label={`Club commission: $${fees.clubCommission.toFixed(2)}`}
            role="img"
            style={{ width: `${(fees.clubCommission / fees.totalAmount) * 100}%` }}
          />
        )}
        {fees.homeClubReferral > 0 && (
          <div
            className="bg-river-light"
            title={`Home Club: $${fees.homeClubReferral.toFixed(2)}`}
            aria-label={`Home club referral: $${fees.homeClubReferral.toFixed(2)}`}
            role="img"
            style={{ width: `${(fees.homeClubReferral / fees.totalAmount) * 100}%` }}
          />
        )}
        {fees.guidePayout > 0 && (
          <div
            className="bg-charcoal"
            title={`Guide: $${fees.guidePayout.toFixed(2)}`}
            aria-label={`Guide payout: $${fees.guidePayout.toFixed(2)}`}
            role="img"
            style={{ width: `${(fees.guidePayout / fees.totalAmount) * 100}%` }}
          />
        )}
        <div
          className="bg-bronze"
          title={`AnglerPass: $${fees.anglerpassRevenue.toFixed(2)}`}
          aria-label={`AnglerPass revenue: $${fees.anglerpassRevenue.toFixed(2)}`}
          role="img"
          style={{ width: `${(fees.anglerpassRevenue / fees.totalAmount) * 100}%` }}
        />
      </div>

      {/* Line items */}
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start justify-between">
            <div>
              <p className={`text-sm font-medium ${row.color}`}>{row.label}</p>
              {row.sublabel && (
                <p className="text-xs text-text-light">{row.sublabel}</p>
              )}
            </div>
            <span className={`text-sm font-semibold ${row.color}`}>
              ${row.amount.toFixed(2)}
            </span>
          </div>
        ))}

        <div className="border-t border-border pt-2">
          <div className="flex justify-between">
            <span className="text-sm font-semibold text-text-primary">
              Total Collected
            </span>
            <span className="text-sm font-bold text-text-primary">
              ${fees.totalAmount.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
