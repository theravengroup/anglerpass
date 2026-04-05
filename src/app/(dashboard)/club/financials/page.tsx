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
  Users,
  BarChart3,
  CreditCard,
} from "lucide-react";
import { PERIOD_OPTIONS } from "@/lib/constants/status";
import { downloadCSV } from "@/lib/csv";
import { FetchError } from "@/components/shared/FetchError";
import PayoutSetup from "@/components/shared/PayoutSetup";

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

interface Financials {
  total_commission: number;
  period_commission: number;
  total_membership_revenue: number;
  period_membership_revenue: number;
  total_revenue: number;
  active_members: number;
  total_bookings: number;
  period_bookings: number;
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
      ["Membership Revenue (Total)", data.total_membership_revenue.toFixed(2)],
      ["Combined Revenue", data.total_revenue.toFixed(2)],
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

  const stats = [
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

  const maxCommission = Math.max(
    ...(data?.commission_by_property.map((p) => p.commission) ?? [1])
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/club">
            <Button variant="ghost" size="sm" className="text-text-secondary">
              <ArrowLeft className="mr-1 size-4" />
              Dashboard
            </Button>
          </Link>
          <div>
            <h2 className="font-heading text-2xl font-semibold text-text-primary">
              Club Financials
            </h2>
            <p className="mt-0.5 text-sm text-text-secondary">
              Commission income, membership revenue, and payout tracking.
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

      {/* Payout Setup */}
      <PayoutSetup type="club" />

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
        {/* Commission by Property */}
        <Card className="border-stone-light/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Commission by Property
            </CardTitle>
            <CardDescription>$5/rod earned per booking</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(data?.commission_by_property.length ?? 0) === 0 ? (
              <p className="py-6 text-center text-sm text-text-light">
                No commission data yet.
              </p>
            ) : (
              data!.commission_by_property.map((prop) => {
                const pct =
                  maxCommission > 0
                    ? (prop.commission / maxCommission) * 100
                    : 0;
                return (
                  <div key={prop.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-text-primary">
                        {prop.name}
                      </span>
                      <span className="text-text-secondary">
                        ${prop.commission.toLocaleString()} · {prop.bookings}{" "}
                        booking{prop.bookings !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-offwhite">
                      {/* Dynamic width requires inline style -- percentage computed from data */}
                      <div
                        className="h-full rounded-full bg-river transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Monthly Commission Trend */}
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
              <MonthlyBarChart
                data={data!.monthly_commission}
                color="bg-river"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Membership Payments */}
      {(data?.recent_membership_payments.length ?? 0) > 0 && (
        <Card className="border-stone-light/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="size-4 text-bronze" />
              Recent Membership Payments
            </CardTitle>
            <CardDescription>
              Initiation fees and annual dues collected
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-light/20 text-left text-xs text-text-light">
                    <th className="pb-2 pr-4">Date</th>
                    <th className="pb-2 pr-4">Member</th>
                    <th className="pb-2 pr-4">Type</th>
                    <th className="pb-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-light/10">
                  {data!.recent_membership_payments.map((p) => (
                    <tr key={p.id}>
                      <td className="py-2.5 pr-4 text-text-secondary">
                        {new Date(p.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-2.5 pr-4 font-medium text-text-primary">
                        {p.member_name ?? "—"}
                      </td>
                      <td className="py-2.5 pr-4 capitalize text-text-secondary">
                        {(p.type ?? "payment").replace(/_/g, " ")}
                      </td>
                      <td className="py-2.5 text-right font-medium text-river">
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
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="size-4 text-forest" />
            Booking Commission History
          </CardTitle>
          <CardDescription>
            Commission earned from property bookings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(data?.recent_transactions.length ?? 0) === 0 ? (
            <p className="py-6 text-center text-sm text-text-light">
              No booking transactions yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-light/20 text-left text-xs text-text-light">
                    <th className="pb-2 pr-4">Date</th>
                    <th className="pb-2 pr-4">Property</th>
                    <th className="pb-2 pr-4">Angler</th>
                    <th className="pb-2 pr-4 text-right">Rods</th>
                    <th className="pb-2 text-right">Commission</th>
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
                      <td className="py-2.5 pr-4 text-text-secondary">
                        {t.angler_name ?? "—"}
                      </td>
                      <td className="py-2.5 pr-4 text-right text-text-secondary">
                        {t.rod_count}
                      </td>
                      <td className="py-2.5 text-right font-medium text-river">
                        ${t.club_commission}
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
              How club revenue works:
            </strong>{" "}
            Your club earns a $5/rod commission on every booking made at your
            associated properties. This commission comes from the
            landowner&apos;s listed rate — it is not an additional charge to the
            angler. Membership fees (initiation and annual dues) are set by you
            and collected through AnglerPass. Payouts are processed via Stripe.
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
  data: MonthlyData[];
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
              {/* Dynamic height requires inline style -- percentage computed from data */}
              <div
                className={`w-full min-h-[2px] rounded-t ${color} transition-all`}
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
