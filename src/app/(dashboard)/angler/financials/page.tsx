"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  ArrowLeft,
  Loader2,
  Download,
  Receipt,
  CreditCard,
  Percent,
  Network,
  MapPin,
} from "lucide-react";
import { downloadCSV } from "@/lib/csv";
import { FetchError } from "@/components/shared/FetchError";

const PERIOD_OPTIONS = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
  { label: "All time", value: 3650 },
];

interface PropertySpending {
  name: string;
  total_amount: number;
  bookings: number;
}

interface MonthlyData {
  month: string;
  amount: number;
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
  created_at: string;
}

interface MembershipPayment {
  id: string;
  type: string;
  amount: number;
  club_name: string | null;
  created_at: string;
}

interface Financials {
  total_spent: number;
  period_spent: number;
  total_rod_fees: number;
  total_platform_fees: number;
  total_guide_fees: number;
  total_cross_club_fees: number;
  total_membership_dues: number;
  total_bookings: number;
  period_bookings: number;
  spending_by_property: PropertySpending[];
  monthly_spending: MonthlyData[];
  recent_transactions: Transaction[];
  membership_payments: MembershipPayment[];
}

export default function AnglerFinancialsPage() {
  const [data, setData] = useState<Financials | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [days, setDays] = useState(30);

  const load = useCallback(async () => {
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
  }, [days]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  function exportCSV() {
    if (!data) return;
    const rows: string[][] = [
      ["Category", "Amount"],
      ["Rod Fees", data.total_rod_fees.toFixed(2)],
      ["Platform Fees (15%)", data.total_platform_fees.toFixed(2)],
      ["Guide Fees", data.total_guide_fees.toFixed(2)],
      ["Cross-Club Fees", data.total_cross_club_fees.toFixed(2)],
      ["Membership Dues", data.total_membership_dues.toFixed(2)],
      ["Total Spent on Bookings", data.total_spent.toFixed(2)],
      [],
      ["Property", "Total Spent", "Bookings"],
      ...data.spending_by_property.map((p) => [
        p.name,
        p.total_amount.toFixed(2),
        String(p.bookings),
      ]),
      [],
      ["Date", "Property", "Rod Fee", "Platform Fee", "Guide", "Cross-Club", "Total"],
      ...data.recent_transactions.map((t) => [
        t.booking_date,
        t.property_name ?? "",
        String(t.base_rate),
        String(t.platform_fee),
        String((t.guide_rate ?? 0) + (t.guide_service_fee ?? 0)),
        String(t.cross_club_fee ?? 0),
        String(t.total_amount),
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

  const stats = [
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

  // Fee breakdown for the visual
  const feeBreakdown = [
    { label: "Rod Fees", amount: data?.total_rod_fees ?? 0, color: "bg-forest" },
    { label: "Platform Fees", amount: data?.total_platform_fees ?? 0, color: "bg-river" },
    { label: "Guide Fees", amount: data?.total_guide_fees ?? 0, color: "bg-charcoal" },
    { label: "Cross-Club Fees", amount: data?.total_cross_club_fees ?? 0, color: "bg-bronze" },
  ].filter((f) => f.amount > 0);

  const feeTotal = feeBreakdown.reduce((sum, f) => sum + f.amount, 0);

  const maxSpending = Math.max(
    ...(data?.spending_by_property.map((p) => p.total_amount) ?? [1])
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/angler">
            <Button variant="ghost" size="sm" className="text-text-secondary">
              <ArrowLeft className="mr-1 size-4" />
              Dashboard
            </Button>
          </Link>
          <div>
            <h2 className="font-heading text-2xl font-semibold text-text-primary">
              Spending &amp; Fees
            </h2>
            <p className="mt-0.5 text-sm text-text-secondary">
              Complete breakdown of your fishing expenses and fees.
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
            Export CSV
          </Button>
          <div className="flex rounded-lg border border-stone-light/20">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDays(opt.value)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors first:rounded-l-lg last:rounded-r-lg ${
                  days === opt.value
                    ? "bg-bronze text-white"
                    : "text-text-secondary hover:bg-offwhite"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-stone-light/20">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription className="text-text-secondary">
                  {stat.label}
                </CardDescription>
                <div
                  className={`flex size-9 items-center justify-center rounded-lg ${stat.bg}`}
                >
                  <stat.icon className={`size-[18px] ${stat.color}`} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tracking-tight text-text-primary">
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-text-light">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Fee Breakdown */}
        <Card className="border-stone-light/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Booking Fee Breakdown</CardTitle>
            <CardDescription>Where your booking dollars go</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {feeTotal === 0 ? (
              <p className="py-6 text-center text-sm text-text-light">
                No spending data yet.
              </p>
            ) : (
              <>
                {/* Stacked bar */}
                <div className="flex h-4 overflow-hidden rounded-full">
                  {feeBreakdown.map((f) => (
                    <div
                      key={f.label}
                      className={`${f.color} transition-all`}
                      style={{
                        width: `${(f.amount / feeTotal) * 100}%`,
                      }}
                    />
                  ))}
                </div>
                {/* Legend */}
                <div className="space-y-2">
                  {feeBreakdown.map((f) => (
                    <div
                      key={f.label}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`size-3 rounded-sm ${f.color}`}
                        />
                        <span className="text-text-secondary">{f.label}</span>
                      </div>
                      <span className="font-medium text-text-primary">
                        ${f.amount.toLocaleString()} (
                        {Math.round((f.amount / feeTotal) * 100)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Spending by Property */}
        <Card className="border-stone-light/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="size-4 text-forest" />
              Spending by Property
            </CardTitle>
            <CardDescription>Properties you spend the most at</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(data?.spending_by_property.length ?? 0) === 0 ? (
              <p className="py-6 text-center text-sm text-text-light">
                No property data yet.
              </p>
            ) : (
              data!.spending_by_property.slice(0, 8).map((prop) => {
                const pct =
                  maxSpending > 0
                    ? (prop.total_amount / maxSpending) * 100
                    : 0;
                return (
                  <div key={prop.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-text-primary">
                        {prop.name}
                      </span>
                      <span className="text-text-secondary">
                        ${prop.total_amount.toLocaleString()} · {prop.bookings}{" "}
                        trip{prop.bookings !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-offwhite">
                      <div
                        className="h-full rounded-full bg-bronze transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Membership Payments */}
      {(data?.membership_payments.length ?? 0) > 0 && (
        <Card className="border-stone-light/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="size-4 text-charcoal" />
              Membership Payments
            </CardTitle>
            <CardDescription>
              Club initiation fees and annual dues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-light/20 text-left text-xs text-text-light">
                    <th className="pb-2 pr-4">Date</th>
                    <th className="pb-2 pr-4">Club</th>
                    <th className="pb-2 pr-4">Type</th>
                    <th className="pb-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-light/10">
                  {data!.membership_payments.map((p) => (
                    <tr key={p.id}>
                      <td className="py-2.5 pr-4 text-text-secondary">
                        {new Date(p.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-2.5 pr-4 font-medium text-text-primary">
                        {p.club_name ?? "—"}
                      </td>
                      <td className="py-2.5 pr-4 capitalize text-text-secondary">
                        {(p.type ?? "payment").replace(/_/g, " ")}
                      </td>
                      <td className="py-2.5 text-right font-medium text-text-primary">
                        ${(p.amount ?? 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Booking Transactions */}
      <Card className="border-stone-light/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Booking Transaction History</CardTitle>
          <CardDescription>
            Detailed fee breakdown for each trip
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(data?.recent_transactions.length ?? 0) === 0 ? (
            <p className="py-6 text-center text-sm text-text-light">
              No transactions yet. Book a trip to see your spending breakdown.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-light/20 text-left text-xs text-text-light">
                    <th className="pb-2 pr-4">Date</th>
                    <th className="pb-2 pr-4">Property</th>
                    <th className="pb-2 pr-4 text-right">Rod Fee</th>
                    <th className="pb-2 pr-4 text-right">Platform</th>
                    <th className="pb-2 pr-4 text-right">Guide</th>
                    <th className="pb-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-light/10">
                  {data!.recent_transactions.map((t) => (
                    <tr key={t.id}>
                      <td className="py-2.5 pr-4 text-text-secondary">
                        {new Date(t.booking_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="py-2.5 pr-4 font-medium text-text-primary">
                        {t.property_name}
                      </td>
                      <td className="py-2.5 pr-4 text-right text-text-secondary">
                        ${t.base_rate}
                      </td>
                      <td className="py-2.5 pr-4 text-right text-text-light">
                        ${t.platform_fee}
                        {(t.cross_club_fee ?? 0) > 0 && (
                          <span
                            className="ml-1 inline-flex items-center text-[10px] text-bronze"
                            title="Cross-club fee"
                          >
                            <Network className="mr-0.5 size-2.5" />+$
                            {t.cross_club_fee}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 pr-4 text-right text-text-secondary">
                        {(t.guide_rate ?? 0) > 0
                          ? `$${t.guide_rate + (t.guide_service_fee ?? 0)}`
                          : "—"}
                      </td>
                      <td className="py-2.5 text-right font-medium text-text-primary">
                        ${t.total_amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fee Explanation */}
      <Card className="border-stone-light/20 bg-offwhite/50">
        <CardContent className="py-5">
          <p className="text-xs leading-relaxed text-text-light">
            <strong className="text-text-secondary">
              Understanding your fees:
            </strong>{" "}
            Rod fees are set by the landowner. A 15% platform fee is applied to
            cover payment processing and platform operation. If you book through
            the Cross-Club Network (a property outside your home club), a
            $25/rod cross-club access fee applies ($20 to AnglerPass, $5 to your
            home club). Guide fees include a 10% service fee. Your
            club membership dues are set by your club and collected separately.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
