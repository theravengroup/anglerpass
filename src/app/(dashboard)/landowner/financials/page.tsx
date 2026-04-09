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
      ["Guide Revenue (from guided bookings)", data.total_guide_rate.toFixed(2)],
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
      ["Transaction ID", "Date", "Property", "Angler", "Gross", "Commission", "Net Payout", "Guide Rate", "Refund", "Status"],
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
      label: "Club Commissions",
      value: `$${(data?.total_commissions_paid ?? 0).toLocaleString()}`,
      description: "$5/rod paid to clubs",
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
          description="Net payout after $5/rod club commission"
          items={(data?.earnings_by_property ?? []).map((p) => ({
            name: p.name,
            value: p.landowner_payout,
            detail: `$${p.landowner_payout.toLocaleString()} net`,
            subDetail: (
              <>
                <span>
                  ${p.base_rate.toLocaleString()} gross &middot; ${p.club_commission.toLocaleString()} commission
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
        Your listed rod fee is the gross amount. A $5/rod commission is paid
        to the associated club on each booking. Your net payout is the gross
        amount minus the club commission. The 15% platform fee shown to anglers
        goes to AnglerPass and does not affect your payout. Guide fees are
        charged separately to anglers and paid directly to guides. Payouts are
        processed through Stripe and deposited directly to your connected bank
        account. When a booking is cancelled, the refund comes from the held
        payment &mdash; your net earnings reflect only completed transactions.
      </FeeExplanationCard>
    </div>
  );
}
