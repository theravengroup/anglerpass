"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  TrendingUp,
  ArrowLeft,
  Loader2,
  Download,
  Wallet,
  BarChart3,
} from "lucide-react";
import { PERIOD_OPTIONS } from "@/lib/constants/status";
import { downloadCSV } from "@/lib/csv";
import { FetchError } from "@/components/shared/FetchError";
import type { Financials, StatItem, StreamItem } from "@/components/admin/financials-types";
import { FinancialStatsGrid } from "@/components/admin/FinancialStatsGrid";
import { RevenueBreakdownCard } from "@/components/admin/RevenueBreakdownCard";
import { PayoutObligationsCard } from "@/components/admin/PayoutObligationsCard";
import { MembershipRevenueCard } from "@/components/admin/MembershipRevenueCard";
import { MonthlyRevenueTable } from "@/components/admin/MonthlyRevenueTable";
import { TopPropertiesCard } from "@/components/admin/TopPropertiesCard";
import { RecentTransactionsTable } from "@/components/admin/RecentTransactionsTable";
import { FinancialSummaryCard } from "@/components/admin/FinancialSummaryCard";
import AdminPageGuard from "@/components/admin/AdminPageGuard";
import { PricingModeSplitCard } from "@/components/admin/PricingModeSplitCard";
import { AdminClassificationMixCard } from "@/components/admin/AdminClassificationMixCard";
import { AdminRecentLeasePaymentsCard } from "@/components/admin/AdminRecentLeasePaymentsCard";

function buildExportRows(data: Financials): string[][] {
  return [
    ["AnglerPass Financial Report"],
    ["Generated", new Date().toISOString()],
    [],
    ["═══ REVENUE SUMMARY ═══"],
    ["Platform Revenue (Total)", data.platform_revenue_total.toFixed(2)],
    ["  Platform Fees (15%)", data.platform_fee_total.toFixed(2)],
    ["  Cross-Club Fees (AP share $15/rod)", data.cross_club_fee_total.toFixed(2)],
    ["  Cross-Club Referring Club Referral ($10/rod)", data.cross_club_referral_total.toFixed(2)],
    ["  Independent Guide Service Fees (10%)", data.guide_service_fee_total.toFixed(2)],
    ["  Lease Facilitation Fees (5%)", data.lease_facilitation_fee_total.toFixed(2)],
    ["  Membership Processing Fees", data.membership_processing_fees.toFixed(2)],
    [],
    ["═══ GMV ═══"],
    ["Booking GMV (Total)", data.gmv_total.toFixed(2)],
    ["Membership GMV", data.membership_gmv.toFixed(2)],
    [],
    ["═══ PAYOUT OBLIGATIONS ═══"],
    ["Landowner Payouts", data.landowner_payouts_total.toFixed(2)],
    ["Club Commissions", data.club_payouts_total.toFixed(2)],
    ["Independent Guide Payouts", data.guide_payouts_total.toFixed(2)],
    [
      "Total Payouts",
      (
        data.landowner_payouts_total +
        data.club_payouts_total +
        data.guide_payouts_total
      ).toFixed(2),
    ],
    [],
    ["═══ MONTHLY REVENUE ═══"],
    ["Month", "Platform Fee", "Cross-Club Fee", "Ind. Guide Service Fee", "Lease Facilitation Fee", "Total"],
    ...data.revenue_by_month.map((m) => [
      m.month,
      m.platform_fee.toFixed(2),
      m.cross_club_fee.toFixed(2),
      m.guide_service_fee.toFixed(2),
      m.lease_facilitation_fee.toFixed(2),
      m.total.toFixed(2),
    ]),
    [],
    ["═══ TOP PROPERTIES ═══"],
    ["Property", "GMV", "Platform Revenue", "Bookings"],
    ...data.top_properties.map((p) => [
      p.name,
      p.gmv.toFixed(2),
      p.platform_revenue.toFixed(2),
      String(p.bookings),
    ]),
    [],
    ["═══ RECENT TRANSACTIONS ═══"],
    [
      "Date",
      "Property",
      "Total",
      "Platform Fee",
      "Cross-Club",
      "Ind. Guide Fee",
      "Landowner",
      "Club",
      "Ind. Guide",
    ],
    ...data.recent_transactions.map((t) => [
      t.booking_date,
      t.property_name ?? "",
      String(t.total_amount),
      String(t.platform_fee),
      String(t.cross_club_fee ?? 0),
      String(t.guide_service_fee ?? 0),
      String(t.landowner_payout),
      String(t.club_commission),
      String(t.guide_payout ?? 0),
    ]),
  ];
}

export default function AdminFinancialsPage() {
  const [data, setData] = useState<Financials | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [days, setDays] = useState(30);

  async function load() {
    setError(false);
    try {
      const res = await fetch(
        `/api/analytics/financials?view=admin&days=${days}`
      );
      if (res.ok) {
        setData(await res.json());
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    load();
  }, [days]);

  if (loading) {
    return (
      <AdminPageGuard path="/admin/financials">
      <div className="mx-auto flex max-w-6xl items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-river" />
      </div>
      </AdminPageGuard>
    );
  }

  if (error) {
    return (
      <AdminPageGuard path="/admin/financials">
      <div className="mx-auto max-w-6xl">
        <FetchError message="Failed to load financial data." onRetry={load} />
      </div>
      </AdminPageGuard>
    );
  }

  const totalPayouts =
    (data?.landowner_payouts_total ?? 0) +
    (data?.club_payouts_total ?? 0) +
    (data?.cross_club_referral_total ?? 0) +
    (data?.guide_payouts_total ?? 0);

  const stats: StatItem[] = [
    {
      label: "Platform Revenue",
      value: `$${(data?.platform_revenue_total ?? 0).toLocaleString()}`,
      description: `$${(data?.platform_revenue_period ?? 0).toLocaleString()} last ${days}d`,
      icon: DollarSign,
      color: "text-forest",
      bg: "bg-forest/10",
    },
    {
      label: "Booking GMV",
      value: `$${(data?.gmv_total ?? 0).toLocaleString()}`,
      description: `$${(data?.gmv_period ?? 0).toLocaleString()} last ${days}d`,
      icon: TrendingUp,
      color: "text-river",
      bg: "bg-river/10",
    },
    {
      label: "Total Payouts",
      value: `$${totalPayouts.toLocaleString()}`,
      description: "Landowners + clubs + independent guides",
      icon: Wallet,
      color: "text-bronze",
      bg: "bg-bronze/10",
    },
    {
      label: "Total Bookings",
      value: String(data?.total_bookings ?? 0),
      description: `${data?.period_bookings ?? 0} last ${days}d`,
      icon: BarChart3,
      color: "text-charcoal",
      bg: "bg-charcoal/10",
    },
  ];

  const revenueStreams: StreamItem[] = [
    { label: "Platform Fees (15%)", amount: data?.platform_fee_total ?? 0, color: "bg-forest" },
    { label: "Cross-Club Fees (AP $15/rod)", amount: data?.cross_club_fee_total ?? 0, color: "bg-river" },
    { label: "Independent Guide Service Fees (10%)", amount: data?.guide_service_fee_total ?? 0, color: "bg-charcoal" },
    { label: "Lease Facilitation Fee (5%)", amount: data?.lease_facilitation_fee_total ?? 0, color: "bg-bronze" },
    { label: "Membership Processing Fees", amount: data?.membership_processing_fees ?? 0, color: "bg-river-light" },
  ].filter((s) => s.amount > 0);

  const revenueTotal = revenueStreams.reduce((sum, s) => sum + s.amount, 0);

  const payoutStreams: StreamItem[] = [
    { label: "Landowner Payouts", amount: data?.landowner_payouts_total ?? 0, color: "bg-forest" },
    { label: "Club Rod-Fee Share", amount: data?.club_payouts_total ?? 0, color: "bg-river" },
    { label: "Cross-Club Referral Payouts", amount: data?.cross_club_referral_total ?? 0, color: "bg-river-light" },
    { label: "Independent Guide Payouts", amount: data?.guide_payouts_total ?? 0, color: "bg-charcoal" },
  ].filter((s) => s.amount > 0);

  function exportCSV() {
    if (!data) return;
    downloadCSV(
      buildExportRows(data),
      `anglerpass-financial-report-${new Date().toISOString().slice(0, 10)}.csv`
    );
  }

  return (
    <AdminPageGuard path="/admin/financials">
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="text-text-secondary">
              <ArrowLeft className="mr-1 size-4" />
              Admin
            </Button>
          </Link>
          <div>
            <h2 className="font-heading text-2xl font-semibold text-text-primary">
              AnglerPass Financials
            </h2>
            <p className="mt-0.5 text-sm text-text-secondary">
              Complete financial picture — revenue, GMV, payouts, and fee splits.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={exportCSV}
          >
            <Download className="mr-1 size-3" />
            Export Full Report
          </Button>
          <div className="flex rounded-lg border border-stone-light/20">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDays(opt.value)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors first:rounded-l-lg last:rounded-r-lg ${
                  days === opt.value
                    ? "bg-river text-white"
                    : "text-text-secondary hover:bg-offwhite"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <FinancialStatsGrid stats={stats} />

      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueBreakdownCard
          revenueStreams={revenueStreams}
          revenueTotal={revenueTotal}
        />
        <PayoutObligationsCard
          payoutStreams={payoutStreams}
          totalPayouts={totalPayouts}
        />
      </div>

      <MembershipRevenueCard
        membershipGmv={data?.membership_gmv ?? 0}
        membershipProcessingFees={data?.membership_processing_fees ?? 0}
      />

      <MonthlyRevenueTable
        months={data?.revenue_by_month ?? []}
        platformFeeTotal={data?.platform_fee_total ?? 0}
        crossClubFeeTotal={data?.cross_club_fee_total ?? 0}
        guideServiceFeeTotal={data?.guide_service_fee_total ?? 0}
        platformRevenueTotal={data?.platform_revenue_total ?? 0}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <PricingModeSplitCard split={data?.pricing_mode_split} />
        <AdminClassificationMixCard items={data?.classification_mix ?? []} />
      </div>

      {(data?.recent_lease_payments?.length ?? 0) > 0 && (
        <AdminRecentLeasePaymentsCard
          payments={data?.recent_lease_payments ?? []}
          total={data?.lease_facilitation_fee_total ?? 0}
          count={data?.lease_payment_count ?? 0}
        />
      )}

      <TopPropertiesCard properties={data?.top_properties ?? []} />

      <RecentTransactionsTable
        transactions={data?.recent_transactions ?? []}
      />

      <FinancialSummaryCard />
    </div>
    </AdminPageGuard>
  );
}

