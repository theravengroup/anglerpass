"use client";

import { useEffect, useState } from "react";
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
  XCircle,
  AlertTriangle,
  TrendingDown,
  Sparkles,
  Calculator,
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
  monthly_spending: MonthlyData[];
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
      ["Processing Fees (3.5%)", data.total_processing_fees.toFixed(2)],
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
    { label: "Guide Rates", amount: data?.total_guide_rates ?? 0, color: "bg-charcoal" },
    { label: "Guide Service Fees", amount: data?.total_guide_service_fees ?? 0, color: "bg-charcoal/60" },
    { label: "Cross-Club Fees", amount: data?.total_cross_club_fees ?? 0, color: "bg-bronze" },
  ].filter((f) => f.amount > 0);

  const feeTotal = feeBreakdown.reduce((sum, f) => sum + f.amount, 0);

  const maxSpending = Math.max(
    ...(data?.spending_by_property.map((p) => p.total_amount) ?? [1])
  );

  const hasRefunds = (data?.total_refunds_received ?? 0) > 0;
  const hasLateFees = (data?.total_late_cancel_fees ?? 0) > 0;
  const hasDiscounts = (data?.total_discount_savings ?? 0) > 0;

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

      {/* Cost Metrics + Refunds/Fees Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Trip Cost Metrics */}
        <Card className="border-stone-light/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calculator className="size-4 text-bronze" />
              Trip Metrics
            </CardTitle>
            <CardDescription>
              Average cost analysis across your trips
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-bronze/20 bg-bronze/5 p-3">
                <p className="text-2xl font-semibold text-bronze">
                  ${(data?.cost_per_trip ?? 0).toLocaleString()}
                </p>
                <p className="text-xs text-text-secondary">Avg Cost per Trip</p>
              </div>
              <div className="rounded-lg border border-forest/20 bg-forest/5 p-3">
                <p className="text-2xl font-semibold text-forest">
                  ${(data?.avg_rod_fee ?? 0).toLocaleString()}
                </p>
                <p className="text-xs text-text-secondary">Avg Rod Fee</p>
              </div>
            </div>
            {(data?.total_bookings ?? 0) > 0 && (
              <p className="mt-3 text-xs text-text-light">
                Based on {data?.total_bookings} trip{data?.total_bookings !== 1 ? "s" : ""}.
                Rod fees make up {feeTotal > 0 ? Math.round(((data?.total_rod_fees ?? 0) / feeTotal) * 100) : 0}%
                of your total booking costs.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Refunds, Late Fees & Savings */}
        {(hasRefunds || hasLateFees || hasDiscounts) && (
          <Card className="border-stone-light/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingDown className="size-4 text-river" />
                Refunds, Fees &amp; Savings
              </CardTitle>
              <CardDescription>
                Cancellation refunds, late fees, and discounts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {hasRefunds && (
                <div className="flex items-center justify-between rounded-lg border border-forest/20 bg-forest/5 p-3">
                  <div className="flex items-center gap-2">
                    <XCircle className="size-4 text-forest" />
                    <div>
                      <p className="text-sm font-medium text-text-primary">Refunds Received</p>
                      <p className="text-xs text-text-light">
                        From {data?.total_cancellations ?? 0} cancellation{data?.total_cancellations !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <p className="text-lg font-semibold text-forest">
                    +${(data?.total_refunds_received ?? 0).toLocaleString()}
                  </p>
                </div>
              )}
              {hasLateFees && (
                <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="size-4 text-red-500" />
                    <div>
                      <p className="text-sm font-medium text-text-primary">Late Cancel Fees</p>
                      <p className="text-xs text-text-light">
                        $15 per late cancellation (within 72 hrs)
                      </p>
                    </div>
                  </div>
                  <p className="text-lg font-semibold text-red-600">
                    -${(data?.total_late_cancel_fees ?? 0).toLocaleString()}
                  </p>
                </div>
              )}
              {hasDiscounts && (
                <div className="flex items-center justify-between rounded-lg border border-river/20 bg-river/5 p-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-river" />
                    <div>
                      <p className="text-sm font-medium text-text-primary">Staff Discount Savings</p>
                      <p className="text-xs text-text-light">
                        50% own-club, 25% cross-club
                      </p>
                    </div>
                  </div>
                  <p className="text-lg font-semibold text-river">
                    -${(data?.total_discount_savings ?? 0).toLocaleString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
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
                {/* Stacked bar -- dynamic widths require inline style (percentage computed from data) */}
                <div className="flex h-4 overflow-hidden rounded-full">
                  {feeBreakdown.map((f) => (
                    <div
                      key={f.label}
                      className={`${f.color} transition-all`}
                      style={{ width: `${(f.amount / feeTotal) * 100}%` }}
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
                    {/* Dynamic width requires inline style -- percentage computed from data */}
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

      {/* Membership Payments — with initiation vs dues and processing fee */}
      {(data?.membership_payments.length ?? 0) > 0 && (
        <Card className="border-stone-light/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="size-4 text-charcoal" />
                  Membership Payments
                </CardTitle>
                <CardDescription>
                  Club initiation fees and annual dues
                </CardDescription>
              </div>
              {((data?.total_initiation_fees ?? 0) > 0 || (data?.total_annual_dues ?? 0) > 0) && (
                <div className="flex items-center gap-4 text-xs text-text-light">
                  <span>
                    Initiation: <strong className="text-text-secondary">${(data?.total_initiation_fees ?? 0).toLocaleString()}</strong>
                  </span>
                  <span>
                    Dues: <strong className="text-text-secondary">${(data?.total_annual_dues ?? 0).toLocaleString()}</strong>
                  </span>
                  {(data?.total_processing_fees ?? 0) > 0 && (
                    <span>
                      Processing: <strong className="text-text-secondary">${(data?.total_processing_fees ?? 0).toLocaleString()}</strong>
                    </span>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-light/20 text-left text-xs text-text-light">
                    <th className="pb-2 pr-4">Date</th>
                    <th className="pb-2 pr-4">Club</th>
                    <th className="pb-2 pr-4">Type</th>
                    <th className="pb-2 pr-4 text-right">Amount</th>
                    <th className="pb-2 text-right">Processing</th>
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
                      <td className="py-2.5 pr-4">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          p.type === "initiation_fee"
                            ? "bg-river/10 text-river"
                            : "bg-bronze/10 text-bronze"
                        }`}>
                          {p.type === "initiation_fee" ? "Initiation" : "Annual Dues"}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-right font-medium text-text-primary">
                        ${(p.amount ?? 0).toLocaleString()}
                      </td>
                      <td className="py-2.5 text-right text-text-light">
                        {(p.processing_fee ?? 0) > 0
                          ? `$${(p.processing_fee ?? 0).toLocaleString()}`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Booking Transactions — now includes cancelled with refund info */}
      <Card className="border-stone-light/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Booking Transaction History</CardTitle>
          <CardDescription>
            Detailed fee breakdown for each trip, including cancellations
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
                    <th className="pb-2 pr-4 text-right">Total</th>
                    <th className="pb-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-light/10">
                  {data!.recent_transactions.map((t) => {
                    const isCancelled = t.status === "cancelled";
                    return (
                      <tr key={t.id} className={isCancelled ? "opacity-60" : ""}>
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
                        <td className="py-2.5 pr-4 text-right font-medium text-text-primary">
                          {isCancelled ? (
                            <span className="text-red-500 line-through">${t.total_amount}</span>
                          ) : (
                            `$${t.total_amount}`
                          )}
                        </td>
                        <td className="py-2.5 text-right">
                          {isCancelled ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                                <XCircle className="size-3" />
                                cancelled
                              </span>
                              {(t.refund_amount ?? 0) > 0 && (
                                <p className="text-[10px] text-forest">
                                  +${t.refund_amount} refund
                                </p>
                              )}
                              {(t.late_cancel_fee ?? 0) > 0 && (
                                <p className="text-[10px] text-red-500">
                                  -${t.late_cancel_fee} late fee
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex rounded-full bg-forest/10 px-2 py-0.5 text-xs font-medium text-forest">
                              {t.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
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
            home club). Guide fees include the guide&apos;s rate plus a 10% service fee.
            Club membership dues include initiation fees (one-time) and annual dues,
            plus a 3.5% processing fee. Cancellation refunds follow a graduated
            policy: 100% if 7+ days out, 75% if 3–7 days, 50% if 1–3 days, 0% under
            24 hours. A $15 late cancellation fee applies within 72 hours.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
