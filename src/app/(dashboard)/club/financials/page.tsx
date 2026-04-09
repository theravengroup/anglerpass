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
  Users,
  CreditCard,
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
import MemberDuesHealthCard from "@/components/clubs/MemberDuesHealthCard";
import MembershipRevenueBreakdown from "@/components/clubs/MembershipRevenueBreakdown";
import CrossClubNetworkCard from "@/components/clubs/CrossClubNetworkCard";
import ClubMembershipPaymentsTable from "@/components/clubs/ClubMembershipPaymentsTable";
import ClubTransactionHistory from "@/components/clubs/ClubTransactionHistory";

interface PropertyCommission {
  name: string;
  commission: number;
  bookings: number;
}

interface MonthlyData {
  month: string;
  amount: number;
}

interface MembershipPayment {
  id: string;
  type: string;
  amount: number;
  processing_fee: number;
  member_name: string | null;
  created_at: string;
}

interface Transaction {
  id: string;
  status: string;
  booking_date: string;
  property_name: string;
  angler_name: string | null;
  club_commission: number;
  base_rate: number;
  rod_count: number;
  created_at: string;
}

interface MemberDuesHealth {
  active: number;
  past_due: number;
  grace_period: number;
  lapsed: number;
}

interface Financials {
  total_commission: number;
  period_commission: number;
  total_membership_revenue: number;
  period_membership_revenue: number;
  total_revenue: number;
  active_members: number;
  total_bookings: number;
  period_bookings: number;
  total_initiation_revenue: number;
  total_dues_revenue: number;
  member_dues_health: MemberDuesHealth;
  total_cancellations: number;
  period_cancellations: number;
  lost_commission_from_cancellations: number;
  cross_club_booking_count: number;
  monthly_membership: MonthlyData[];
  commission_by_property: PropertyCommission[];
  monthly_commission: MonthlyData[];
  recent_transactions: Transaction[];
  recent_membership_payments: MembershipPayment[];
}

export default function ClubFinancialsPage() {
  const [data, setData] = useState<Financials | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [days, setDays] = useState(30);

  async function load() {
    setError(false);
    try {
      const res = await fetch(
        `/api/analytics/financials?view=club&days=${days}`
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
      ["Revenue Source", "Amount"],
      ["Booking Commissions (Total)", data.total_commission.toFixed(2)],
      ["Initiation Fee Revenue", data.total_initiation_revenue.toFixed(2)],
      ["Annual Dues Revenue", data.total_dues_revenue.toFixed(2)],
      ["Membership Revenue (Total)", data.total_membership_revenue.toFixed(2)],
      ["Combined Revenue", data.total_revenue.toFixed(2)],
      ["Lost Commission from Cancellations", data.lost_commission_from_cancellations.toFixed(2)],
      [],
      ["Member Dues Health", "Count"],
      ["Active", String(data.member_dues_health.active)],
      ["Past Due", String(data.member_dues_health.past_due)],
      ["Grace Period", String(data.member_dues_health.grace_period)],
      ["Lapsed", String(data.member_dues_health.lapsed)],
      [],
      ["Property", "Commission", "Bookings"],
      ...data.commission_by_property.map((p) => [
        p.name,
        p.commission.toFixed(2),
        String(p.bookings),
      ]),
      [],
      ["Transaction ID", "Date", "Property", "Angler", "Commission", "Rods"],
      ...data.recent_transactions.map((t) => [
        t.id,
        t.booking_date,
        t.property_name ?? "",
        t.angler_name ?? "",
        String(t.club_commission),
        String(t.rod_count),
      ]),
    ];
    downloadCSV(rows, `anglerpass-club-financials-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-5xl items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-river" />
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
      label: "Total Revenue",
      value: `$${(data?.total_revenue ?? 0).toLocaleString()}`,
      description: "Commissions + memberships",
      icon: DollarSign,
      color: "text-river",
      bg: "bg-river/10",
    },
    {
      label: "Booking Commissions",
      value: `$${(data?.total_commission ?? 0).toLocaleString()}`,
      description: `$${(data?.period_commission ?? 0).toLocaleString()} last ${days}d`,
      icon: TrendingUp,
      color: "text-forest",
      bg: "bg-forest/10",
    },
    {
      label: "Membership Revenue",
      value: `$${(data?.total_membership_revenue ?? 0).toLocaleString()}`,
      description: `$${(data?.period_membership_revenue ?? 0).toLocaleString()} last ${days}d`,
      icon: CreditCard,
      color: "text-bronze",
      bg: "bg-bronze/10",
    },
    {
      label: "Active Members",
      value: String(data?.active_members ?? 0),
      description: `${data?.period_bookings ?? 0} bookings last ${days}d`,
      icon: Users,
      color: "text-charcoal",
      bg: "bg-charcoal/10",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <FinancialsHeader
        backHref="/club"
        title="Club Financials"
        subtitle="Commission income, membership revenue, and payout tracking."
        days={days}
        onDaysChange={setDays}
        onExport={exportCSV}
        activeBg="bg-river"
      />

      <PayoutSetup type="club" />
      <StatCardGrid stats={stats} />

      <div className="grid gap-6 lg:grid-cols-2">
        <MemberDuesHealthCard
          duesHealth={data?.member_dues_health ?? { active: 0, past_due: 0, grace_period: 0, lapsed: 0 }}
        />
        <MembershipRevenueBreakdown
          totalInitiationRevenue={data?.total_initiation_revenue ?? 0}
          totalDuesRevenue={data?.total_dues_revenue ?? 0}
          totalMembershipRevenue={data?.total_membership_revenue ?? 0}
          monthlyMembership={data?.monthly_membership ?? []}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <CancellationsRefundsCard
          title="Cancellation Impact"
          description="Revenue lost from cancelled bookings"
          totalCancellations={data?.total_cancellations ?? 0}
          totalAmount={-(data?.lost_commission_from_cancellations ?? 0)}
          amountLabel="Lost Commission"
          periodCancellations={data?.period_cancellations ?? 0}
          days={days}
        />
        <CrossClubNetworkCard
          crossClubBookingCount={data?.cross_club_booking_count ?? 0}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <PropertyBarList
          title="Commission by Property"
          description="$5/rod earned per booking"
          items={(data?.commission_by_property ?? []).map((p) => ({
            name: p.name,
            value: p.commission,
            detail: `$${p.commission.toLocaleString()} \u00B7 ${p.bookings} booking${p.bookings !== 1 ? "s" : ""}`,
          }))}
          barColor="bg-river"
          emptyMessage="No commission data yet."
        />

        <Card className="border-stone-light/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Monthly Commission</CardTitle>
            <CardDescription>Booking commission trend</CardDescription>
          </CardHeader>
          <CardContent>
            {(data?.monthly_commission.length ?? 0) === 0 ? (
              <p className="py-6 text-center text-sm text-text-light">
                No monthly data yet.
              </p>
            ) : (
              <MonthlyBarChart data={data!.monthly_commission} color="bg-river" />
            )}
          </CardContent>
        </Card>
      </div>

      <ClubMembershipPaymentsTable payments={data?.recent_membership_payments ?? []} />
      <ClubTransactionHistory transactions={data?.recent_transactions ?? []} />

      <FeeExplanationCard label="How club revenue works:">
        Your club earns a $5/rod commission on every booking made at your
        associated properties. This commission comes from the
        landowner&apos;s listed rate &mdash; it is not an additional charge to
        the angler. Membership fees (initiation and annual dues) are set by you
        and collected through AnglerPass. When members of other clubs book your
        properties through the Cross-Club Network, your club still earns the
        standard $5/rod commission. Payouts are processed via&nbsp;Stripe.
      </FeeExplanationCard>
    </div>
  );
}
