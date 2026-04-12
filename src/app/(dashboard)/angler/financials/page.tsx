"use client";

import { useEffect, useState } from "react";
import {
  DollarSign,
  Receipt,
  Percent,
  CreditCard,
  Loader2,
  MapPin,
} from "lucide-react";
import { downloadCSV } from "@/lib/csv";
import { FetchError } from "@/components/shared/FetchError";
import FinancialsHeader from "@/components/shared/FinancialsHeader";
import StatCardGrid from "@/components/shared/StatCardGrid";
import type { StatCardItem } from "@/components/shared/StatCardGrid";
import PropertyBarList from "@/components/shared/PropertyBarList";
import FeeExplanationCard from "@/components/shared/FeeExplanationCard";
import TripMetricsCard from "@/components/angler/TripMetricsCard";
import RefundsSavingsCard from "@/components/angler/RefundsSavingsCard";
import BookingFeeBreakdown from "@/components/angler/BookingFeeBreakdown";
import MembershipPaymentsTable from "@/components/angler/MembershipPaymentsTable";
import AnglerTransactionHistory from "@/components/angler/AnglerTransactionHistory";

interface PropertySpending {
  name: string;
  total_amount: number;
  bookings: number;
}

interface Transaction {
  id: string;
  status: string;
  booking_date: string;
  property_name: string;
  base_rate: number;
  platform_fee: number;
  guide_rate: number;
  guide_service_fee: number;
  cross_club_fee: number;
  total_amount: number;
  refund_amount: number;
  late_cancel_fee: number;
  created_at: string;
}

interface MembershipPayment {
  id: string;
  type: string;
  amount: number;
  processing_fee: number;
  club_name: string | null;
  created_at: string;
}

interface Financials {
  total_spent: number;
  period_spent: number;
  total_rod_fees: number;
  total_platform_fees: number;
  total_guide_fees: number;
  total_guide_rates: number;
  total_guide_service_fees: number;
  total_cross_club_fees: number;
  total_membership_dues: number;
  total_bookings: number;
  period_bookings: number;
  total_initiation_fees: number;
  total_annual_dues: number;
  total_processing_fees: number;
  total_refunds_received: number;
  period_refunds: number;
  total_cancellations: number;
  period_cancellations: number;
  total_late_cancel_fees: number;
  period_late_cancel_fees: number;
  total_discount_savings: number;
  cost_per_trip: number;
  avg_rod_fee: number;
  spending_by_property: PropertySpending[];
  monthly_spending: { month: string; amount: number }[];
  recent_transactions: Transaction[];
  membership_payments: MembershipPayment[];
}

export default function AnglerFinancialsPage() {
  const [data, setData] = useState<Financials | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [days, setDays] = useState(30);

  async function load() {
    setError(false);
    try {
      const res = await fetch(
        `/api/analytics/financials?view=angler&days=${days}`
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
      ["Category", "Amount"],
      ["Rod Fees", data.total_rod_fees.toFixed(2)],
      ["Platform Fees (15%)", data.total_platform_fees.toFixed(2)],
      ["Guide Rates", data.total_guide_rates.toFixed(2)],
      ["Guide Service Fees (10%)", data.total_guide_service_fees.toFixed(2)],
      ["Cross-Club Fees", data.total_cross_club_fees.toFixed(2)],
      ["Total Spent on Bookings", data.total_spent.toFixed(2)],
      [],
      ["Membership Breakdown", "Amount"],
      ["Initiation Fees", data.total_initiation_fees.toFixed(2)],
      ["Annual Dues", data.total_annual_dues.toFixed(2)],
      ["Platform Fees (5%)", data.total_processing_fees.toFixed(2)],
      ["Total Membership", data.total_membership_dues.toFixed(2)],
      [],
      ["Refunds & Fees", "Amount"],
      ["Total Refunds Received", data.total_refunds_received.toFixed(2)],
      ["Late Cancellation Fees", data.total_late_cancel_fees.toFixed(2)],
      ["Staff Discount Savings", data.total_discount_savings.toFixed(2)],
      [],
      ["Trip Metrics", "Value"],
      ["Average Cost per Trip", data.cost_per_trip.toFixed(2)],
      ["Average Rod Fee", data.avg_rod_fee.toFixed(2)],
      ["Total Trips", String(data.total_bookings)],
      [],
      ["Property", "Total Spent", "Bookings"],
      ...data.spending_by_property.map((p) => [
        p.name,
        p.total_amount.toFixed(2),
        String(p.bookings),
      ]),
      [],
      ["Date", "Property", "Rod Fee", "Platform Fee", "Guide", "Cross-Club", "Total", "Refund", "Late Fee", "Status"],
      ...data.recent_transactions.map((t) => [
        t.booking_date,
        t.property_name ?? "",
        String(t.base_rate),
        String(t.platform_fee),
        String((t.guide_rate ?? 0) + (t.guide_service_fee ?? 0)),
        String(t.cross_club_fee ?? 0),
        String(t.total_amount),
        String(t.refund_amount ?? 0),
        String(t.late_cancel_fee ?? 0),
        t.status,
      ]),
    ];
    downloadCSV(rows, `anglerpass-spending-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-5xl items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-bronze" />
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
      label: "Total Spent",
      value: `$${(data?.total_spent ?? 0).toLocaleString()}`,
      description: `$${(data?.period_spent ?? 0).toLocaleString()} last ${days === 3650 ? "all time" : `${days}d`}`,
      icon: DollarSign,
      color: "text-bronze",
      bg: "bg-bronze/10",
    },
    {
      label: "Rod Fees",
      value: `$${(data?.total_rod_fees ?? 0).toLocaleString()}`,
      description: `${data?.total_bookings ?? 0} total bookings`,
      icon: Receipt,
      color: "text-forest",
      bg: "bg-forest/10",
    },
    {
      label: "Platform Fees",
      value: `$${(data?.total_platform_fees ?? 0).toLocaleString()}`,
      description: "15% booking fee",
      icon: Percent,
      color: "text-river",
      bg: "bg-river/10",
    },
    {
      label: "Membership Dues",
      value: `$${(data?.total_membership_dues ?? 0).toLocaleString()}`,
      description: "Initiation + annual dues",
      icon: CreditCard,
      color: "text-charcoal",
      bg: "bg-charcoal/10",
    },
  ];

  const feeBreakdownItems = [
    { label: "Rod Fees", amount: data?.total_rod_fees ?? 0, color: "bg-forest" },
    { label: "Platform Fees", amount: data?.total_platform_fees ?? 0, color: "bg-river" },
    { label: "Guide Rates", amount: data?.total_guide_rates ?? 0, color: "bg-charcoal" },
    { label: "Guide Service Fees", amount: data?.total_guide_service_fees ?? 0, color: "bg-charcoal/60" },
    { label: "Cross-Club Fees", amount: data?.total_cross_club_fees ?? 0, color: "bg-bronze" },
  ];

  const feeTotal = feeBreakdownItems.filter((f) => f.amount > 0).reduce((sum, f) => sum + f.amount, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <FinancialsHeader
        backHref="/angler"
        title="Spending &amp; Fees"
        subtitle="Complete breakdown of your fishing expenses and fees."
        days={days}
        onDaysChange={setDays}
        onExport={exportCSV}
        activeBg="bg-bronze"
      />

      <StatCardGrid stats={stats} />

      <div className="grid gap-6 lg:grid-cols-2">
        <TripMetricsCard
          costPerTrip={data?.cost_per_trip ?? 0}
          avgRodFee={data?.avg_rod_fee ?? 0}
          totalBookings={data?.total_bookings ?? 0}
          totalRodFees={data?.total_rod_fees ?? 0}
          feeTotal={feeTotal}
        />
        <RefundsSavingsCard
          totalRefunds={data?.total_refunds_received ?? 0}
          totalCancellations={data?.total_cancellations ?? 0}
          totalLateFees={data?.total_late_cancel_fees ?? 0}
          totalDiscountSavings={data?.total_discount_savings ?? 0}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <BookingFeeBreakdown items={feeBreakdownItems} />
        <PropertyBarList
          title="Spending by Property"
          description="Properties you spend the most at"
          icon={MapPin}
          iconColor="text-forest"
          items={(data?.spending_by_property ?? []).map((p) => ({
            name: p.name,
            value: p.total_amount,
            detail: `$${p.total_amount.toLocaleString()} \u00B7 ${p.bookings} trip${p.bookings !== 1 ? "s" : ""}`,
          }))}
          barColor="bg-bronze"
          emptyMessage="No property data yet."
        />
      </div>

      <MembershipPaymentsTable
        payments={data?.membership_payments ?? []}
        totalInitiationFees={data?.total_initiation_fees ?? 0}
        totalAnnualDues={data?.total_annual_dues ?? 0}
        totalProcessingFees={data?.total_processing_fees ?? 0}
      />

      <AnglerTransactionHistory
        transactions={data?.recent_transactions ?? []}
      />

      <FeeExplanationCard label="Understanding your fees:">
        Rod fees are set by the landowner. A 15% platform fee is applied to
        cover payment processing and platform operation. If you book through
        the Cross-Club Network (a property outside your home club), a $25/rod
        cross-club access fee applies ($20 to AnglerPass, $5 to your home
        club). Guide fees include the guide&apos;s rate plus a 10% service fee.
        Club membership dues include initiation fees (one-time) and annual
        dues, plus a 5% platform fee. Cancellation refunds follow a
        graduated policy: 100% if 7+ days out, 75% if 3&ndash;7 days, 50% if
        1&ndash;3 days, 0% under 24 hours. A $15 late cancellation fee applies
        within 72&nbsp;hours.
      </FeeExplanationCard>
    </div>
  );
}
