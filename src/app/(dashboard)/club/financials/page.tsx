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
  ArrowUpRight,
  FileText,
  Layers,
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

interface LeasePayment {
  id: string;
  property_name: string;
  amount: number;
  platform_fee: number;
  landowner_net: number;
  period_start: string;
  period_end: string;
  paid_at: string | null;
}

interface ClassificationMixEntry {
  classification: string;
  bookings: number;
  commission: number;
}

interface Financials {
  total_commission: number;
  period_commission: number;
  managing_commission: number;
  period_managing_commission: number;
  referral_revenue: number;
  period_referral_revenue: number;
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
  cross_club_inbound_count: number;
  cross_club_outbound_count: number;
  total_lease_outflows: number;
  total_lease_platform_fees_paid: number;
  recent_lease_payments: LeasePayment[];
  classification_mix: ClassificationMixEntry[];
  monthly_membership: MonthlyData[];
  commission_by_property: PropertyCommission[];
  monthly_commission: MonthlyData[];
  recent_transactions: Transaction[];
  recent_membership_payments: MembershipPayment[];
}

const CLUB_CLASSIFICATION_LABEL: Record<string, string> = {
  select: "Select (50% club)",
  premier: "Premier (35% club)",
  signature: "Signature (25% club)",
  lease: "Upfront lease (100% club)",
  unclassified: "Unclassified",
};

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
      label: "Total Club Earnings",
      value: `$${(data?.total_commission ?? 0).toLocaleString()}`,
      description: "Managing rod-fee share + referrals",
      icon: DollarSign,
      color: "text-river",
      bg: "bg-river/10",
    },
    {
      label: "Rod-Fee Share (Managing)",
      value: `$${(data?.managing_commission ?? 0).toLocaleString()}`,
      description: `$${(data?.period_managing_commission ?? 0).toLocaleString()} last ${days}d`,
      icon: TrendingUp,
      color: "text-forest",
      bg: "bg-forest/10",
    },
    {
      label: "Cross-Club Referral Income",
      value: `$${(data?.referral_revenue ?? 0).toLocaleString()}`,
      description: "$10/rod/day from members booking elsewhere",
      icon: ArrowUpRight,
      color: "text-bronze",
      bg: "bg-bronze/10",
    },
    {
      label: "Membership Revenue",
      value: `$${(data?.total_membership_revenue ?? 0).toLocaleString()}`,
      description: `$${(data?.period_membership_revenue ?? 0).toLocaleString()} last ${days}d`,
      icon: CreditCard,
      color: "text-charcoal",
      bg: "bg-charcoal/10",
    },
    {
      label: "Active Members",
      value: String(data?.active_members ?? 0),
      description: `${data?.period_bookings ?? 0} bookings last ${days}d`,
      icon: Users,
      color: "text-river",
      bg: "bg-river/10",
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
          title="Rod-Fee Share by Property"
          description="Managing share of rod fees"
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

      {((data?.recent_lease_payments?.length ?? 0) > 0 ||
        (data?.total_lease_outflows ?? 0) > 0) && (
        <ClubLeasePaymentsCard
          totalLeaseOutflows={data?.total_lease_outflows ?? 0}
          totalLeasePlatformFeesPaid={data?.total_lease_platform_fees_paid ?? 0}
          payments={data?.recent_lease_payments ?? []}
        />
      )}

      {(data?.classification_mix?.length ?? 0) > 0 && (
        <ClubClassificationMixCard items={data!.classification_mix} />
      )}

      <ClubMembershipPaymentsTable payments={data?.recent_membership_payments ?? []} />
      <ClubTransactionHistory transactions={data?.recent_transactions ?? []} />

      <FeeExplanationCard label="How club revenue works:">
        For rod-fee-split properties your club earns a share of each rod fee
        based on the property&apos;s classification (Select 50%, Premier 35%,
        Signature 25%). For upfront-lease properties your club pays the
        landowner an agreed annual amount via ACH (AnglerPass adds a 5%
        facilitation fee on top) and keeps 100% of rod-fee income. Membership
        fees (initiation and annual dues) are set by you and collected through
        AnglerPass. When one of your members books at another club&apos;s
        property, your club earns a $10/rod/day referral. Payouts are processed
        via&nbsp;Stripe.
      </FeeExplanationCard>
    </div>
  );
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function ClubLeasePaymentsCard({
  totalLeaseOutflows,
  totalLeasePlatformFeesPaid,
  payments,
}: {
  totalLeaseOutflows: number;
  totalLeasePlatformFeesPaid: number;
  payments: LeasePayment[];
}) {
  return (
    <Card className="border-river/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="size-4 text-river" />
          Lease Payments Out
        </CardTitle>
        <CardDescription>
          ${totalLeaseOutflows.toLocaleString()} total ACH charges &middot; $
          {totalLeasePlatformFeesPaid.toLocaleString()} AnglerPass 5% fee
        </CardDescription>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <p className="py-3 text-sm text-text-light">No lease payments yet.</p>
        ) : (
          <div className="divide-y divide-stone-light/20">
            {payments.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-4 py-2 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-text-primary">{p.property_name}</div>
                  <div className="text-xs text-text-secondary">
                    {formatDate(p.period_start)} – {formatDate(p.period_end)}
                    {p.paid_at ? ` · paid ${formatDate(p.paid_at)}` : ""}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-text-primary">
                    ${p.amount.toLocaleString()}
                  </div>
                  <div className="text-xs text-text-secondary">
                    ${p.landowner_net.toLocaleString()} landowner &middot; $
                    {p.platform_fee.toLocaleString()} AP
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ClubClassificationMixCard({ items }: { items: ClassificationMixEntry[] }) {
  return (
    <Card className="border-stone-light/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Layers className="size-4 text-river" />
          Classification Mix
        </CardTitle>
        <CardDescription>
          Rod-fee share earned by property tier (as managing club).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-stone-light/20">
          {items.map((c) => (
            <div key={c.classification} className="flex items-center justify-between py-2 text-sm">
              <span className="text-text-secondary">
                {CLUB_CLASSIFICATION_LABEL[c.classification] ?? c.classification}
              </span>
              <span className="font-medium text-text-primary">
                {c.bookings} booking{c.bookings === 1 ? "" : "s"} &middot; $
                {c.commission.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
