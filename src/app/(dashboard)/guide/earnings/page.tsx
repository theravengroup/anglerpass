"use client";

import { useEffect, useState } from "react";
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
  Calendar,
  Loader2,
  Download,
  MapPin,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { PERIOD_OPTIONS, STATUS_BADGE_COLORS } from "@/lib/constants/status";
import { downloadCSV } from "@/lib/csv";
import { FetchError } from "@/components/shared/FetchError";
import PayoutSetup from "@/components/shared/PayoutSetup";

interface PropertyEarnings {
  name: string;
  earnings: number;
  trips: number;
}

interface MonthlyData {
  month: string;
  amount: number;
}

interface Trip {
  id: string;
  status: string;
  booking_date: string;
  property_name: string;
  angler_name: string | null;
  guide_rate: number;
  guide_payout: number;
  guide_service_fee: number;
  rod_count: number;
  created_at: string;
}

interface Financials {
  total_earnings: number;
  period_earnings: number;
  this_month_earnings: number;
  trips_total: number;
  trips_period: number;
  trips_this_month: number;
  earnings_by_property: PropertyEarnings[];
  monthly_earnings: MonthlyData[];
  recent_trips: Trip[];
}

export default function GuideEarningsPage() {
  const [data, setData] = useState<Financials | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [days, setDays] = useState(30);

  async function load() {
    setError(false);
    try {
      const res = await fetch(
        `/api/analytics/financials?view=guide&days=${days}`
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
      ["Metric", "Value"],
      ["Total Earnings", data.total_earnings.toFixed(2)],
      ["This Month", data.this_month_earnings.toFixed(2)],
      ["Total Trips", String(data.trips_total)],
      [],
      ["Property", "Earnings", "Trips"],
      ...data.earnings_by_property.map((p) => [
        p.name,
        p.earnings.toFixed(2),
        String(p.trips),
      ]),
      [],
      ["Date", "Property", "Angler", "Rate", "Payout", "Service Fee", "Rods"],
      ...data.recent_trips.map((t) => [
        t.booking_date,
        t.property_name ?? "",
        t.angler_name ?? "",
        String(t.guide_rate),
        String(t.guide_payout),
        String(t.guide_service_fee),
        String(t.rod_count),
      ]),
    ];
    downloadCSV(rows, `anglerpass-guide-earnings-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-3xl items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-charcoal" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl">
        <FetchError message="Failed to load earnings data." onRetry={load} />
      </div>
    );
  }

  const stats = [
    {
      label: "Total Earnings",
      value: `$${(data?.total_earnings ?? 0).toLocaleString()}`,
      description: "All time",
      icon: DollarSign,
      color: "text-charcoal",
      bg: "bg-charcoal/10",
    },
    {
      label: "This Month",
      value: `$${(data?.this_month_earnings ?? 0).toLocaleString()}`,
      description: `${data?.trips_this_month ?? 0} trip${(data?.trips_this_month ?? 0) !== 1 ? "s" : ""}`,
      icon: TrendingUp,
      color: "text-forest",
      bg: "bg-forest/10",
    },
    {
      label: "Period Earnings",
      value: `$${(data?.period_earnings ?? 0).toLocaleString()}`,
      description: `${data?.trips_period ?? 0} trips last ${days}d`,
      icon: Calendar,
      color: "text-river",
      bg: "bg-river/10",
    },
  ];

  const maxEarnings = Math.max(
    ...(data?.earnings_by_property.map((p) => p.earnings) ?? [1])
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-charcoal/10">
            <DollarSign className="size-6 text-charcoal" />
          </div>
          <div>
            <h2 className="font-heading text-2xl font-semibold text-text-primary">
              Earnings
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              Track your independent guide earnings and manage payouts.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(data?.recent_trips.length ?? 0) > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={exportCSV}
            >
              <Download className="mr-1 size-3" />
              CSV
            </Button>
          )}
          <div className="flex rounded-lg border border-stone-light/20">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDays(opt.value)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors first:rounded-l-lg last:rounded-r-lg ${
                  days === opt.value
                    ? "bg-charcoal text-white"
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
      <PayoutSetup type="guide" />

      {/* Earnings Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
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

      {/* Earnings by Property */}
      {(data?.earnings_by_property.length ?? 0) > 0 && (
        <Card className="border-stone-light/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="size-4 text-forest" />
              Earnings by Property
            </CardTitle>
            <CardDescription>
              Properties where you guide the most
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data!.earnings_by_property.map((prop) => {
              const pct =
                maxEarnings > 0
                  ? (prop.earnings / maxEarnings) * 100
                  : 0;
              return (
                <div key={prop.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-text-primary">
                      {prop.name}
                    </span>
                    <span className="text-text-secondary">
                      ${prop.earnings.toLocaleString()} · {prop.trips} trip
                      {prop.trips !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-offwhite">
                    {/* Dynamic width requires inline style -- percentage computed from data */}
                    <div
                      className="h-full rounded-full bg-charcoal transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Monthly Earnings Trend */}
      {(data?.monthly_earnings.length ?? 0) > 0 && (
        <Card className="border-stone-light/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Monthly Earnings</CardTitle>
            <CardDescription>Your independent guide income over time</CardDescription>
          </CardHeader>
          <CardContent>
            <MonthlyBarChart data={data!.monthly_earnings} />
          </CardContent>
        </Card>
      )}

      {/* Recent Trips */}
      <Card className="border-stone-light/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent Guided Trips</CardTitle>
          <CardDescription>
            Earnings from your guided fishing trips
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(data?.recent_trips.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center py-8">
              <div className="flex size-12 items-center justify-center rounded-full bg-charcoal/10">
                <DollarSign className="size-5 text-charcoal" />
              </div>
              <p className="mt-3 text-sm font-medium text-text-primary">
                No Earnings Yet
              </p>
              <p className="mt-1 max-w-xs text-center text-sm text-text-secondary">
                Earnings from guided trips will be listed here as they come in.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-light/20 text-left text-xs text-text-light">
                    <th className="pb-2 pr-4">Date</th>
                    <th className="pb-2 pr-4">Property</th>
                    <th className="pb-2 pr-4">Angler</th>
                    <th className="pb-2 pr-4 text-right">Rate</th>
                    <th className="pb-2 pr-4 text-right">Payout</th>
                    <th className="pb-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-light/10">
                  {data!.recent_trips.map((t) => (
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
                      <td className="py-2.5 pr-4 text-text-secondary">
                        {t.angler_name ?? "—"}
                      </td>
                      <td className="py-2.5 pr-4 text-right text-text-secondary">
                        ${t.guide_rate}
                      </td>
                      <td className="py-2.5 pr-4 text-right font-medium text-charcoal">
                        ${t.guide_payout}
                      </td>
                      <td className="py-2.5 text-right">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                            STATUS_BADGE_COLORS[t.status] ??
                            STATUS_BADGE_COLORS.pending
                          }`}
                        >
                          {t.status === "confirmed" ||
                          t.status === "completed" ? (
                            <CheckCircle2 className="size-3" />
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
            <strong className="text-text-secondary">
              How independent guide payouts work:
            </strong>{" "}
            You set your own day rates and keep 100% of your independent guide fee. The
            angler pays a 10% service fee on top of your rate — this goes to
            AnglerPass and does not reduce your payout. Earnings are deposited
            directly to your connected Stripe account.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Mini bar chart component ── */
function MonthlyBarChart({ data }: { data: MonthlyData[] }) {
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
              {/* Dynamic height requires inline style -- percentage computed from data */}
              <div
                className="w-full min-h-[2px] rounded-t bg-charcoal transition-all"
                style={{ height: `${Math.max(pct, 2)}%` }}
              />
            </div>
            <span className="text-[10px] text-text-light">{label}</span>
          </div>
        );
      })}
    </div>
  );
}
