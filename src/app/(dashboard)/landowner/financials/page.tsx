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
  TrendingUp,
  ArrowLeft,
  Loader2,
  Download,
  CheckCircle2,
  Clock,
  BarChart3,
  Wallet,
  XCircle,
  AlertTriangle,
  FileText,
  Users,
} from "lucide-react";
import { PERIOD_OPTIONS, STATUS_BADGE_COLORS } from "@/lib/constants/status";
import { downloadCSV } from "@/lib/csv";
import { FetchError } from "@/components/shared/FetchError";
import PayoutSetup from "@/components/shared/PayoutSetup";

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

interface MonthlyEarnings {
  month: string;
  amount: number;
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
  monthly_earnings: MonthlyEarnings[];
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

  const stats = [
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

  const maxEarnings = Math.max(
    ...(data?.earnings_by_property.map((p) => p.landowner_payout) ?? [1])
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/landowner">
            <Button variant="ghost" size="sm" className="text-text-secondary">
              <ArrowLeft className="mr-1 size-4" />
              Dashboard
            </Button>
          </Link>
          <div>
            <h2 className="font-heading text-2xl font-semibold text-text-primary">
              Financials
            </h2>
            <p className="mt-0.5 text-sm text-text-secondary">
              Earnings, payouts, and fee breakdowns for your properties.
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
                    ? "bg-forest text-white"
                    : "text-text-secondary hover:bg-offwhite"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Payout Setup */}
      <PayoutSetup type="landowner" />

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

      {/* Held Funds + Refund Tracking */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Held Funds */}
        {((data?.held_funds_total ?? 0) > 0 || (data?.awaiting_capture ?? 0) > 0) && (
          <Card className="border-forest/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="size-4 text-forest" />
                Funds in Pipeline
              </CardTitle>
              <CardDescription>
                Payments held or awaiting your action
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border border-forest/20 bg-forest/5 p-4">
                <p className="text-2xl font-semibold text-forest">
                  ${(data?.held_funds_total ?? 0).toLocaleString()}
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  Total held or awaiting payout
                </p>
              </div>
              {(data?.awaiting_capture ?? 0) > 0 && (
                <p className="flex items-center gap-1.5 text-xs text-forest">
                  <Clock className="size-3" />
                  {data?.awaiting_capture} completed trip{data?.awaiting_capture !== 1 ? "s" : ""} awaiting payment capture.
                  <Link href="/landowner/bookings" className="underline">
                    Review bookings
                  </Link>
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Refund Tracking */}
        {(data?.total_cancellations ?? 0) > 0 && (
          <Card className="border-stone-light/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <XCircle className="size-4 text-red-500" />
                Cancellations &amp; Refunds
              </CardTitle>
              <CardDescription>
                Impact of booking cancellations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-stone-light/20 bg-offwhite/50 p-3">
                  <p className="text-xl font-semibold text-text-primary">
                    {data?.total_cancellations ?? 0}
                  </p>
                  <p className="text-xs text-text-secondary">Total Cancellations</p>
                </div>
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-xl font-semibold text-red-600">
                    ${(data?.total_refunds ?? 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-text-secondary">Total Refunded</p>
                </div>
              </div>
              {(data?.period_cancellations ?? 0) > 0 && (
                <p className="mt-3 text-xs text-text-light">
                  {data?.period_cancellations} cancellation{data?.period_cancellations !== 1 ? "s" : ""} in the last {days} days
                  (${(data?.period_refunds ?? 0).toLocaleString()} refunded).
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Guide Bookings Summary */}
      {(data?.guided_bookings_count ?? 0) > 0 && (
        <Card className="border-stone-light/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="size-4 text-charcoal" />
              Guided Bookings
            </CardTitle>
            <CardDescription>
              Revenue split on bookings with guides
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-stone-light/20 bg-offwhite/50 p-3">
                <p className="text-xl font-semibold text-text-primary">
                  {data?.guided_bookings_count ?? 0}
                </p>
                <p className="text-xs text-text-secondary">Guided Bookings</p>
              </div>
              <div className="rounded-lg border border-stone-light/20 bg-offwhite/50 p-3">
                <p className="text-xl font-semibold text-text-primary">
                  ${(data?.total_guide_rate ?? 0).toLocaleString()}
                </p>
                <p className="text-xs text-text-secondary">Total Guide Revenue</p>
              </div>
              <div className="rounded-lg border border-charcoal/20 bg-charcoal/5 p-3">
                <p className="text-xl font-semibold text-charcoal">
                  ${(data?.total_guide_payout ?? 0).toLocaleString()}
                </p>
                <p className="text-xs text-text-secondary">Paid to Guides</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-text-light">
              Guide rates are charged to anglers in addition to your rod fee. You receive your full net payout regardless of guide involvement.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Earnings by Property */}
        <Card className="border-stone-light/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Earnings by Property</CardTitle>
            <CardDescription>
              Net payout after $5/rod club commission
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(data?.earnings_by_property.length ?? 0) === 0 ? (
              <p className="py-6 text-center text-sm text-text-light">
                No earnings data yet.
              </p>
            ) : (
              data!.earnings_by_property.map((prop) => {
                const pct =
                  maxEarnings > 0
                    ? (prop.landowner_payout / maxEarnings) * 100
                    : 0;
                return (
                  <div key={prop.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-text-primary">
                        {prop.name}
                      </span>
                      <span className="text-text-secondary">
                        ${prop.landowner_payout.toLocaleString()} net
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-offwhite">
                      <div
                        className="h-full rounded-full bg-forest transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-text-light">
                      <span>
                        ${prop.base_rate.toLocaleString()} gross · ${prop.club_commission.toLocaleString()} commission
                      </span>
                      <span>
                        {prop.bookings} booking{prop.bookings !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Monthly Earnings Trend */}
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
              <MonthlyBarChart
                data={data!.monthly_earnings}
                color="bg-forest"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tax Summary */}
      <Card className="border-stone-light/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="size-4 text-forest" />
            Tax Summary
          </CardTitle>
          <CardDescription>
            Year-to-date earnings and quarterly breakdown
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-forest/20 bg-forest/5 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">YTD Net Earnings</p>
                <p className="text-3xl font-semibold text-forest">
                  ${(data?.ytd_earnings ?? 0).toLocaleString()}
                </p>
              </div>
              <p className="text-sm text-text-light">
                {new Date().getFullYear()}
              </p>
            </div>
          </div>

          {(data?.quarterly_earnings?.length ?? 0) > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-light/20 text-left text-xs text-text-light">
                    <th className="pb-2 pr-4">Quarter</th>
                    <th className="pb-2 pr-4 text-right">Gross</th>
                    <th className="pb-2 pr-4 text-right">Commissions</th>
                    <th className="pb-2 pr-4 text-right">Net Earnings</th>
                    <th className="pb-2 text-right">Bookings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-light/10">
                  {data!.quarterly_earnings.map((q) => (
                    <tr key={q.quarter}>
                      <td className="py-2.5 pr-4 font-medium text-text-primary">
                        {q.quarter}
                      </td>
                      <td className="py-2.5 pr-4 text-right text-text-secondary">
                        ${q.gross.toLocaleString()}
                      </td>
                      <td className="py-2.5 pr-4 text-right text-text-light">
                        -${q.commissions.toLocaleString()}
                      </td>
                      <td className="py-2.5 pr-4 text-right font-medium text-forest">
                        ${q.earnings.toLocaleString()}
                      </td>
                      <td className="py-2.5 text-right text-text-secondary">
                        {q.bookings}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card className="border-stone-light/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent Transactions</CardTitle>
          <CardDescription>
            Detailed fee breakdown per booking
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(data?.recent_transactions.length ?? 0) === 0 ? (
            <p className="py-6 text-center text-sm text-text-light">
              No transactions yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-light/20 text-left text-xs text-text-light">
                    <th className="pb-2 pr-4">Date</th>
                    <th className="pb-2 pr-4">Property</th>
                    <th className="pb-2 pr-4">Angler</th>
                    <th className="pb-2 pr-4 text-right">Gross</th>
                    <th className="pb-2 pr-4 text-right">Commission</th>
                    <th className="pb-2 pr-4 text-right">Net Payout</th>
                    <th className="pb-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-light/10">
                  {data!.recent_transactions.map((t) => (
                    <tr key={t.id} className={t.status === "cancelled" ? "opacity-60" : ""}>
                      <td className="py-2.5 pr-4 text-text-secondary">
                        {new Date(t.booking_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="py-2.5 pr-4 font-medium text-text-primary">
                        {t.property_name}
                        {(t.guide_rate ?? 0) > 0 && (
                          <span className="ml-1 text-[10px] text-charcoal">(guided)</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-4 text-text-secondary">
                        {t.angler_name ?? "—"}
                      </td>
                      <td className="py-2.5 pr-4 text-right text-text-primary">
                        ${t.base_rate}
                      </td>
                      <td className="py-2.5 pr-4 text-right text-text-light">
                        -${t.club_commission}
                      </td>
                      <td className="py-2.5 pr-4 text-right font-medium text-forest">
                        {t.status === "cancelled" ? (
                          <span className="text-red-500">
                            {(t.refund_amount ?? 0) > 0
                              ? `-$${t.refund_amount}`
                              : "Cancelled"}
                          </span>
                        ) : (
                          `$${t.landowner_payout}`
                        )}
                      </td>
                      <td className="py-2.5 text-right">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                            t.status === "cancelled"
                              ? "bg-red-50 text-red-600"
                              : STATUS_BADGE_COLORS[t.status] ?? STATUS_BADGE_COLORS.pending
                          }`}
                        >
                          {t.status === "confirmed" || t.status === "completed" ? (
                            <CheckCircle2 className="size-3" />
                          ) : t.status === "cancelled" ? (
                            <XCircle className="size-3" />
                          ) : (
                            <Clock className="size-3" />
                          )}
                          {t.status}
                        </span>
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
            <strong className="text-text-secondary">How payouts work:</strong>{" "}
            Your listed rod fee is the gross amount. A $5/rod commission is paid
            to the associated club on each booking. Your net payout is the gross
            amount minus the club commission. The 15% platform fee shown to anglers
            goes to AnglerPass and does not affect your payout. Guide fees are
            charged separately to anglers and paid directly to guides. Payouts are
            processed through Stripe and deposited directly to your connected
            bank account. When a booking is cancelled, the refund comes from the
            held payment — your net earnings reflect only completed transactions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Mini bar chart component ── */
function MonthlyBarChart({
  data,
  color,
}: {
  data: MonthlyEarnings[];
  color: string;
}) {
  const max = Math.max(...data.map((d) => d.amount), 1);

  return (
    <div className="flex h-[120px] items-end gap-1.5">
      {data.map((d) => {
        const pct = (d.amount / max) * 100;
        const label = new Date(d.month + "-01").toLocaleDateString("en-US", {
          month: "short",
        });
        return (
          <div
            key={d.month}
            className="group flex flex-1 flex-col items-center gap-1"
          >
            <span className="text-[10px] text-text-light opacity-0 transition-opacity group-hover:opacity-100">
              ${d.amount.toLocaleString()}
            </span>
            <div className="w-full overflow-hidden rounded-t">
              <div
                className={`w-full rounded-t ${color} transition-all`}
                style={{ height: `${Math.max(pct, 2)}%`, minHeight: 2 }}
              />
            </div>
            <span className="text-[10px] text-text-light">{label}</span>
          </div>
        );
      })}
    </div>
  );
}
