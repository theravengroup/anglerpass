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
  TrendingUp,
  ArrowLeft,
  Loader2,
  Download,
  Wallet,
  BarChart3,
  PieChart,
  Users,
  MapPin,
  ArrowUpRight,
} from "lucide-react";
import { PERIOD_OPTIONS } from "@/lib/constants/status";
import { downloadCSV } from "@/lib/csv";
import { FetchError } from "@/components/shared/FetchError";

interface MonthlyRevenue {
  month: string;
  platform_fee: number;
  cross_club_fee: number;
  guide_service_fee: number;
  total: number;
}

interface TopProperty {
  name: string;
  gmv: number;
  platform_revenue: number;
  bookings: number;
}

interface Transaction {
  id: string;
  status: string;
  booking_date: string;
  property_name: string;
  base_rate: number;
  platform_fee: number;
  cross_club_fee: number;
  guide_service_fee: number;
  landowner_payout: number;
  club_commission: number;
  guide_payout: number;
  total_amount: number;
  created_at: string;
}

interface Financials {
  platform_revenue_total: number;
  platform_revenue_period: number;
  platform_fee_total: number;
  cross_club_fee_total: number;
  guide_service_fee_total: number;
  gmv_total: number;
  gmv_period: number;
  landowner_payouts_total: number;
  club_payouts_total: number;
  guide_payouts_total: number;
  total_bookings: number;
  period_bookings: number;
  membership_gmv: number;
  membership_processing_fees: number;
  revenue_by_month: MonthlyRevenue[];
  top_properties: TopProperty[];
  recent_transactions: Transaction[];
}

export default function AdminFinancialsPage() {
  const [data, setData] = useState<Financials | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [days, setDays] = useState(30);

  const load = useCallback(async () => {
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
  }, [days]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  function exportCSV() {
    if (!data) return;
    const rows: string[][] = [
      ["AnglerPass Financial Report"],
      ["Generated", new Date().toISOString()],
      [],
      ["═══ REVENUE SUMMARY ═══"],
      ["Platform Revenue (Total)", data.platform_revenue_total.toFixed(2)],
      ["  Platform Fees (15%)", data.platform_fee_total.toFixed(2)],
      ["  Cross-Club Fees ($10/rod)", data.cross_club_fee_total.toFixed(2)],
      ["  Guide Service Fees (10%)", data.guide_service_fee_total.toFixed(2)],
      [],
      ["═══ GMV ═══"],
      ["Booking GMV (Total)", data.gmv_total.toFixed(2)],
      ["Membership GMV", data.membership_gmv.toFixed(2)],
      [],
      ["═══ PAYOUT OBLIGATIONS ═══"],
      ["Landowner Payouts", data.landowner_payouts_total.toFixed(2)],
      ["Club Commissions", data.club_payouts_total.toFixed(2)],
      ["Guide Payouts", data.guide_payouts_total.toFixed(2)],
      ["Total Payouts", (data.landowner_payouts_total + data.club_payouts_total + data.guide_payouts_total).toFixed(2)],
      [],
      ["═══ MONTHLY REVENUE ═══"],
      ["Month", "Platform Fee", "Cross-Club Fee", "Guide Service Fee", "Total"],
      ...data.revenue_by_month.map((m) => [
        m.month,
        m.platform_fee.toFixed(2),
        m.cross_club_fee.toFixed(2),
        m.guide_service_fee.toFixed(2),
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
      ["Date", "Property", "Total", "Platform Fee", "Cross-Club", "Guide Fee", "Landowner", "Club", "Guide"],
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
    downloadCSV(rows, `anglerpass-financial-report-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-6xl items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-river" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl">
        <FetchError message="Failed to load financial data." onRetry={load} />
      </div>
    );
  }

  const totalPayouts =
    (data?.landowner_payouts_total ?? 0) +
    (data?.club_payouts_total ?? 0) +
    (data?.guide_payouts_total ?? 0);

  const stats = [
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
      description: "Landowners + clubs + guides",
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

  // Revenue breakdown
  const revenueStreams = [
    { label: "Platform Fees (15%)", amount: data?.platform_fee_total ?? 0, color: "bg-forest" },
    { label: "Cross-Club Fees ($10/rod)", amount: data?.cross_club_fee_total ?? 0, color: "bg-river" },
    { label: "Guide Service Fees (10%)", amount: data?.guide_service_fee_total ?? 0, color: "bg-charcoal" },
  ].filter((s) => s.amount > 0);

  const revenueTotal = revenueStreams.reduce((sum, s) => sum + s.amount, 0);

  // Payout breakdown
  const payoutStreams = [
    { label: "Landowner Payouts", amount: data?.landowner_payouts_total ?? 0, color: "bg-forest" },
    { label: "Club Commissions", amount: data?.club_payouts_total ?? 0, color: "bg-river" },
    { label: "Guide Payouts", amount: data?.guide_payouts_total ?? 0, color: "bg-charcoal" },
  ].filter((s) => s.amount > 0);

  const maxPropertyRevenue = Math.max(
    ...(data?.top_properties.map((p) => p.platform_revenue) ?? [1])
  );

  return (
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

      {/* Top Stats */}
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

      {/* Revenue + Payout Breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Breakdown */}
        <Card className="border-stone-light/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <PieChart className="size-4 text-forest" />
              Revenue by Source
            </CardTitle>
            <CardDescription>
              AnglerPass platform revenue streams
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {revenueTotal === 0 ? (
              <p className="py-6 text-center text-sm text-text-light">
                No revenue data yet.
              </p>
            ) : (
              <>
                <div className="flex h-4 overflow-hidden rounded-full">
                  {revenueStreams.map((s) => (
                    <div
                      key={s.label}
                      className={`${s.color} transition-all`}
                      style={{ width: `${(s.amount / revenueTotal) * 100}%` }}
                    />
                  ))}
                </div>
                <div className="space-y-2">
                  {revenueStreams.map((s) => (
                    <div
                      key={s.label}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`size-3 rounded-sm ${s.color}`} />
                        <span className="text-text-secondary">{s.label}</span>
                      </div>
                      <span className="font-medium text-text-primary">
                        ${s.amount.toLocaleString()} (
                        {Math.round((s.amount / revenueTotal) * 100)}%)
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-stone-light/20 pt-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-text-primary">
                      Total Platform Revenue
                    </span>
                    <span className="text-lg font-semibold text-forest">
                      ${revenueTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Payout Obligations */}
        <Card className="border-stone-light/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="size-4 text-bronze" />
              Payout Obligations
            </CardTitle>
            <CardDescription>
              Total amounts owed to platform participants
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {totalPayouts === 0 ? (
              <p className="py-6 text-center text-sm text-text-light">
                No payout data yet.
              </p>
            ) : (
              <>
                <div className="flex h-4 overflow-hidden rounded-full">
                  {payoutStreams.map((s) => (
                    <div
                      key={s.label}
                      className={`${s.color} transition-all`}
                      style={{
                        width: `${(s.amount / totalPayouts) * 100}%`,
                      }}
                    />
                  ))}
                </div>
                <div className="space-y-2">
                  {payoutStreams.map((s) => (
                    <div
                      key={s.label}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`size-3 rounded-sm ${s.color}`} />
                        <span className="text-text-secondary">{s.label}</span>
                      </div>
                      <span className="font-medium text-text-primary">
                        ${s.amount.toLocaleString()} (
                        {Math.round((s.amount / totalPayouts) * 100)}%)
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-stone-light/20 pt-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-text-primary">
                      Total Payout Obligations
                    </span>
                    <span className="text-lg font-semibold text-bronze">
                      ${totalPayouts.toLocaleString()}
                    </span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Membership Revenue */}
      {(data?.membership_gmv ?? 0) > 0 && (
        <Card className="border-stone-light/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ArrowUpRight className="size-4 text-river" />
              Membership Revenue
            </CardTitle>
            <CardDescription>
              Club membership fees processed through the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-stone-light/20 p-4">
                <p className="text-xs text-text-light">Membership GMV</p>
                <p className="mt-1 text-2xl font-semibold text-text-primary">
                  ${(data?.membership_gmv ?? 0).toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg border border-stone-light/20 p-4">
                <p className="text-xs text-text-light">Processing Fees Collected</p>
                <p className="mt-1 text-2xl font-semibold text-text-primary">
                  ${(data?.membership_processing_fees ?? 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Revenue Trend */}
      {(data?.revenue_by_month.length ?? 0) > 0 && (
        <Card className="border-stone-light/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Monthly Revenue Trend</CardTitle>
            <CardDescription>
              Platform revenue by month, broken down by source
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-light/20 text-left text-xs text-text-light">
                    <th className="pb-2 pr-4">Month</th>
                    <th className="pb-2 pr-4 text-right">Platform Fee</th>
                    <th className="pb-2 pr-4 text-right">Cross-Club</th>
                    <th className="pb-2 pr-4 text-right">Guide Service</th>
                    <th className="pb-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-light/10">
                  {data!.revenue_by_month.map((m) => (
                    <tr key={m.month}>
                      <td className="py-2.5 pr-4 font-medium text-text-primary">
                        {new Date(m.month + "-01").toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-2.5 pr-4 text-right text-text-secondary">
                        ${m.platform_fee.toLocaleString()}
                      </td>
                      <td className="py-2.5 pr-4 text-right text-text-secondary">
                        ${m.cross_club_fee.toLocaleString()}
                      </td>
                      <td className="py-2.5 pr-4 text-right text-text-secondary">
                        ${m.guide_service_fee.toLocaleString()}
                      </td>
                      <td className="py-2.5 text-right font-medium text-forest">
                        ${m.total.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-stone-light/30">
                    <td className="pb-1 pt-3 pr-4 font-semibold text-text-primary">
                      Total
                    </td>
                    <td className="pb-1 pt-3 pr-4 text-right font-medium text-text-primary">
                      ${(data?.platform_fee_total ?? 0).toLocaleString()}
                    </td>
                    <td className="pb-1 pt-3 pr-4 text-right font-medium text-text-primary">
                      ${(data?.cross_club_fee_total ?? 0).toLocaleString()}
                    </td>
                    <td className="pb-1 pt-3 pr-4 text-right font-medium text-text-primary">
                      ${(data?.guide_service_fee_total ?? 0).toLocaleString()}
                    </td>
                    <td className="pb-1 pt-3 text-right text-lg font-semibold text-forest">
                      ${(data?.platform_revenue_total ?? 0).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Properties */}
      {(data?.top_properties.length ?? 0) > 0 && (
        <Card className="border-stone-light/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="size-4 text-forest" />
              Top Revenue Properties
            </CardTitle>
            <CardDescription>
              Properties generating the most platform revenue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data!.top_properties.slice(0, 10).map((prop) => {
              const pct =
                maxPropertyRevenue > 0
                  ? (prop.platform_revenue / maxPropertyRevenue) * 100
                  : 0;
              return (
                <div key={prop.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-text-primary">
                      {prop.name}
                    </span>
                    <span className="text-text-secondary">
                      ${prop.platform_revenue.toLocaleString()} rev · $
                      {prop.gmv.toLocaleString()} GMV · {prop.bookings}{" "}
                      booking{prop.bookings !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-offwhite">
                    <div
                      className="h-full rounded-full bg-forest transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions — Full Breakdown */}
      <Card className="border-stone-light/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Recent Transactions — Full Fee Split
          </CardTitle>
          <CardDescription>
            Complete breakdown showing every party&apos;s share
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
                    <th className="pb-2 pr-3">Date</th>
                    <th className="pb-2 pr-3">Property</th>
                    <th className="pb-2 pr-3 text-right">Total</th>
                    <th className="pb-2 pr-3 text-right">
                      <span className="text-forest">AP Fee</span>
                    </th>
                    <th className="pb-2 pr-3 text-right">
                      <span className="text-river">Cross-Club</span>
                    </th>
                    <th className="pb-2 pr-3 text-right">
                      <span className="text-charcoal">Guide Fee</span>
                    </th>
                    <th className="pb-2 pr-3 text-right">Landowner</th>
                    <th className="pb-2 pr-3 text-right">Club</th>
                    <th className="pb-2 text-right">Guide</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-light/10">
                  {data!.recent_transactions.map((t) => (
                    <tr key={t.id}>
                      <td className="py-2 pr-3 text-text-secondary">
                        {new Date(t.booking_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="py-2 pr-3 font-medium text-text-primary">
                        {t.property_name}
                      </td>
                      <td className="py-2 pr-3 text-right font-medium text-text-primary">
                        ${t.total_amount}
                      </td>
                      <td className="py-2 pr-3 text-right text-forest">
                        ${t.platform_fee}
                      </td>
                      <td className="py-2 pr-3 text-right text-river">
                        {(t.cross_club_fee ?? 0) > 0
                          ? `$${t.cross_club_fee}`
                          : "—"}
                      </td>
                      <td className="py-2 pr-3 text-right text-charcoal">
                        {(t.guide_service_fee ?? 0) > 0
                          ? `$${t.guide_service_fee}`
                          : "—"}
                      </td>
                      <td className="py-2 pr-3 text-right text-text-secondary">
                        ${t.landowner_payout}
                      </td>
                      <td className="py-2 pr-3 text-right text-text-secondary">
                        ${t.club_commission}
                      </td>
                      <td className="py-2 text-right text-text-secondary">
                        {(t.guide_payout ?? 0) > 0
                          ? `$${t.guide_payout}`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card className="border-stone-light/20 bg-offwhite/50">
        <CardContent className="py-5">
          <div className="grid gap-4 text-xs leading-relaxed text-text-light sm:grid-cols-2">
            <div>
              <strong className="text-text-secondary">Revenue streams:</strong>
              <ul className="mt-1 list-inside list-disc space-y-0.5">
                <li>15% platform fee on rod bookings (paid by angler)</li>
                <li>$10/rod cross-club network fee (paid by angler)</li>
                <li>10% guide service fee (paid by angler)</li>
                <li>3.5% payment processing markup on membership payments</li>
              </ul>
            </div>
            <div>
              <strong className="text-text-secondary">Payout splits:</strong>
              <ul className="mt-1 list-inside list-disc space-y-0.5">
                <li>Landowners receive base rod fee minus $5/rod club commission</li>
                <li>Clubs receive $5/rod commission + membership fees</li>
                <li>Guides receive 100% of their listed day rate</li>
                <li>All payouts processed via Stripe Connect</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
