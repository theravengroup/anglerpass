"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DollarSign,
  TrendingUp,
  Loader2,
  Wallet,
  BarChart3,
} from "lucide-react";
import { downloadCSV } from "@/lib/csv";
import { FetchError } from "@/components/shared/FetchError";
import PayoutSetup from "@/components/shared/PayoutSetup";
import FinancialsHeader from "@/components/shared/FinancialsHeader";
import StatCardGrid from "@/components/shared/StatCardGrid";
import type { StatCardItem } from "@/components/shared/StatCardGrid";
import PropertyBarList from "@/components/shared/PropertyBarList";
import MonthlyBarChart from "@/components/shared/MonthlyBarChart";
import FeeExplanationCard from "@/components/shared/FeeExplanationCard";
import CancellationsRefundsCard from "@/components/shared/CancellationsRefundsCard";
import HeldFundsCard from "@/components/properties/HeldFundsCard";
import GuidedBookingsCard from "@/components/properties/GuidedBookingsCard";
import TaxSummaryCard from "@/components/properties/TaxSummaryCard";
import LandownerTransactionHistory from "@/components/properties/LandownerTransactionHistory";
import { LeaseAlertsBanner } from "@/components/properties/LeaseAlertsBanner";
import { LeaseIncomeCard } from "@/components/properties/LeaseIncomeCard";
import { ClassificationBreakdownCard } from "@/components/shared/ClassificationBreakdownCard";

interface Transaction {
  id: string;
  status: string;
  payment_status: string;
  booking_date: string;
  property_name: string;
  angler_name: string | null;
  base_rate: number;
  club_commission: number;
  landowner_payout: number;
  rod_count: number;
  guide_rate: number;
  guide_payout: number;
  refund_amount: number;
  created_at: string;
}

interface PropertyEarnings {
  name: string;
  base_rate: number;
  club_commission: number;
  landowner_payout: number;
  bookings: number;
}

interface QuarterlyEarnings {
  quarter: string;
  earnings: number;
  gross: number;
  commissions: number;
  bookings: number;
}

interface LeasePayment {
  id: string;
  property_name: string;
  club_name?: string;
  amount: number;
  platform_fee: number;
  landowner_net: number;
  period_start: string;
  period_end: string;
  paid_at: string | null;
}

interface PropertyPricing {
  property_id: string;
  name: string;
  pricing_mode: string;
  classification: string | null;
  lease_paid_through: string | null;
  lease_amount: number;
}

interface ClassificationBreakdown {
  classification: string;
  bookings: number;
  landowner_payout: number;
}

interface Financials {
  total_earnings: number;
  period_earnings: number;
  total_base_rate: number;
  total_commissions_paid: number;
  total_bookings: number;
  period_bookings: number;
  held_funds_total: number;
  awaiting_capture: number;
  total_refunds: number;
  period_refunds: number;
  total_cancellations: number;
  period_cancellations: number;
  guided_bookings_count: number;
  total_guide_rate: number;
  total_guide_payout: number;
  ytd_earnings: number;
  quarterly_earnings: QuarterlyEarnings[];
  earnings_by_property: PropertyEarnings[];
  monthly_earnings: { month: string; amount: number }[];
  total_lease_income: number;
  period_lease_income: number;
  recent_lease_payments: LeasePayment[];
  properties_pricing_overview: PropertyPricing[];
  classification_breakdown: ClassificationBreakdown[];
  recent_transactions: Transaction[];
}

export default function LandownerFinancialsPage() {
  const [data, setData] = useState<Financials | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [days, setDays] = useState(30);

  async function load() {
    setError(false);
    try {
      const res = await fetch(
        `/api/analytics/financials?view=landowner&days=${days}`
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

  function exportCSV() {
    if (!data) return;
    const rows: string[][] = [
      ["Summary", "Amount"],
      ["Net Earnings (Total)", data.total_earnings.toFixed(2)],
      ["Gross Revenue (Total)", data.total_base_rate.toFixed(2)],
      ["Club Commissions Paid", data.total_commissions_paid.toFixed(2)],
      ["YTD Earnings", data.ytd_earnings.toFixed(2)],
      ["Held Funds", data.held_funds_total.toFixed(2)],
      ["Total Refunds Issued", data.total_refunds.toFixed(2)],
      ["Independent Guide Revenue (from guided bookings)", data.total_guide_rate.toFixed(2)],
      [],
      ["Quarterly Breakdown", "Earnings", "Gross", "Commissions", "Bookings"],
      ...data.quarterly_earnings.map((q) => [
        q.quarter,
        q.earnings.toFixed(2),
        q.gross.toFixed(2),
        q.commissions.toFixed(2),
        String(q.bookings),
      ]),
      [],
      ["Property", "Gross Revenue", "Club Commission", "Net Payout", "Bookings"],
      ...data.earnings_by_property.map((p) => [
        p.name,
        p.base_rate.toFixed(2),
        p.club_commission.toFixed(2),
        p.landowner_payout.toFixed(2),
        String(p.bookings),
      ]),
      [],
      ["Transaction ID", "Date", "Property", "Angler", "Gross", "Commission", "Net Payout", "Ind. Guide Rate", "Refund", "Status"],
      ...data.recent_transactions.map((t) => [
        t.id,
        t.booking_date,
        t.property_name ?? "",
        t.angler_name ?? "",
        String(t.base_rate),
        String(t.club_commission),
        String(t.landowner_payout),
        String(t.guide_rate ?? 0),
        String(t.refund_amount ?? 0),
        t.status,
      ]),
    ];
    downloadCSV(rows, `anglerpass-landowner-financials-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-5xl items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-forest" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl">
        <FetchError message="Failed to load financial data." onRetry={load} />
      </div>
    );
  }

  const stats: StatCardItem[] = [
    {
      label: "Net Earnings",
      value: `$${(data?.total_earnings ?? 0).toLocaleString()}`,
      description: `$${(data?.period_earnings ?? 0).toLocaleString()} last ${days}d`,
      icon: DollarSign,
      color: "text-forest",
      bg: "bg-forest/10",
    },
    {
      label: "Gross Revenue",
      value: `$${(data?.total_base_rate ?? 0).toLocaleString()}`,
      description: `${data?.total_bookings ?? 0} total bookings`,
      icon: TrendingUp,
      color: "text-river",
      bg: "bg-river/10",
    },
    {
      label: "Club Rod-Fee Share",
      value: `$${(data?.total_commissions_paid ?? 0).toLocaleString()}`,
      description: "Paid to clubs via rod-fee split",
      icon: Wallet,
      color: "text-bronze",
      bg: "bg-bronze/10",
    },
    {
      label: "Period Bookings",
      value: String(data?.period_bookings ?? 0),
      description: `Last ${days} days`,
      icon: BarChart3,
      color: "text-charcoal",
      bg: "bg-charcoal/10",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <FinancialsHeader
        backHref="/landowner"
        title="Financials"
        subtitle="Earnings, payouts, and fee breakdowns for your properties."
        days={days}
        onDaysChange={setDays}
        onExport={exportCSV}
        activeBg="bg-forest"
      />

      <PayoutSetup type="landowner" />
      <StatCardGrid stats={stats} />

      <LeaseAlertsBanner
        properties={data?.properties_pricing_overview ?? []}
      />

      {(data && (data.total_lease_income > 0 ||
        data.properties_pricing_overview.some((p) => p.pricing_mode === "upfront_lease"))) && (
        <LeaseIncomeCard
          totalLeaseIncome={data.total_lease_income}
          periodLeaseIncome={data.period_lease_income}
          days={days}
          payments={data.recent_lease_payments}
        />
      )}

      {(data?.classification_breakdown?.length ?? 0) > 0 && (
        <ClassificationBreakdownCard items={data!.classification_breakdown} />
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <HeldFundsCard
          heldFundsTotal={data?.held_funds_total ?? 0}
          awaitingCapture={data?.awaiting_capture ?? 0}
        />
        <CancellationsRefundsCard
          title="Cancellations &amp; Refunds"
          description="Impact of booking cancellations"
          totalCancellations={data?.total_cancellations ?? 0}
          totalAmount={data?.total_refunds ?? 0}
          amountLabel="Total Refunded"
          periodCancellations={data?.period_cancellations ?? 0}
          days={days}
          periodSuffix={`($${(data?.period_refunds ?? 0).toLocaleString()} refunded)`}
        />
      </div>

      <GuidedBookingsCard
        guidedBookingsCount={data?.guided_bookings_count ?? 0}
        totalGuideRate={data?.total_guide_rate ?? 0}
        totalGuidePayout={data?.total_guide_payout ?? 0}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <PropertyBarList
          title="Earnings by Property"
          description="Net payout after rod-fee split"
          items={(data?.earnings_by_property ?? []).map((p) => ({
            name: p.name,
            value: p.landowner_payout,
            detail: `$${p.landowner_payout.toLocaleString()} net`,
            subDetail: (
              <>
                <span>
                  ${p.base_rate.toLocaleString()} gross &middot; ${p.club_commission.toLocaleString()} club share
                </span>
                <span>
                  {p.bookings} booking{p.bookings !== 1 ? "s" : ""}
                </span>
              </>
            ),
          }))}
          barColor="bg-forest"
          emptyMessage="No earnings data yet."
        />

        <Card className="border-stone-light/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Monthly Earnings</CardTitle>
            <CardDescription>Net payout trend over time</CardDescription>
          </CardHeader>
          <CardContent>
            {(data?.monthly_earnings.length ?? 0) === 0 ? (
              <p className="py-6 text-center text-sm text-text-light">
                No monthly data yet.
              </p>
            ) : (
              <MonthlyBarChart data={data!.monthly_earnings} color="bg-forest" />
            )}
          </CardContent>
        </Card>
      </div>

      <TaxSummaryCard
        ytdEarnings={data?.ytd_earnings ?? 0}
        quarterlyEarnings={data?.quarterly_earnings ?? []}
      />

      <LandownerTransactionHistory transactions={data?.recent_transactions ?? []} />

      <FeeExplanationCard label="How payouts work:">
        Your listed rod fee is the gross amount. Each property has a
        classification that determines how the rod fee is split with your club
        (Select 50/50, Premier 35/65, Signature 25/75 &mdash; landowner share
        listed first). Your net payout is that share of the rod fee. The 15%
        platform fee shown to anglers goes to AnglerPass and does not affect
        your payout. Properties listed as upfront-lease receive an annual ACH
        payment from the club (landowner keeps 100%; AnglerPass&apos;s 5%
        facilitation fee is charged on top to the club) &mdash; with lease
        mode, per-booking rod fees go entirely to the club. Independent guide fees are
        charged separately. Payouts are processed through Stripe and deposited
        directly to your connected bank account.
      </FeeExplanationCard>
    </div>
  );
}

