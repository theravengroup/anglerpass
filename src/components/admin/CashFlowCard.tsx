"use client";

import { useEffect, useState } from "react";
import { Loader2, ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

interface CashFlowData {
  period_days: number;
  daily_snapshots: Array<{
    snapshot_date: string;
    mercury_balance: number;
    stripe_available_balance: number;
    payouts_arrived: number;
    open_exceptions: number;
  }>;
  daily_payouts: Array<{
    date: string;
    created: number;
    settled: number;
  }>;
  summary: {
    total_created: number;
    total_settled: number;
    total_pending: number;
    payout_count: number;
    matched_count: number;
  };
}

function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

const PERIOD_OPTIONS = [7, 14, 30, 60, 90];

export default function CashFlowCard() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<CashFlowData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/finance-ops/cash-flow?days=${days}`);
        if (res.ok) setData(await res.json());
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [days]);

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">
          Cash Flow
        </h2>
        <div className="flex gap-1">
          {PERIOD_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                days === d
                  ? "bg-river text-white"
                  : "bg-parchment text-text-secondary hover:bg-parchment-light"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-stone" />
        </div>
      ) : !data ? (
        <p className="text-center text-sm text-text-secondary">No data available.</p>
      ) : (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <FlowStat
              label="Payouts Created"
              value={formatUsd(data.summary.total_created)}
              icon={<ArrowUpRight className="h-4 w-4 text-bronze" />}
            />
            <FlowStat
              label="Settled in Mercury"
              value={formatUsd(data.summary.total_settled)}
              icon={<ArrowDownRight className="h-4 w-4 text-forest" />}
            />
            <FlowStat
              label="Pending Settlement"
              value={formatUsd(data.summary.total_pending)}
              icon={<Minus className="h-4 w-4 text-text-light" />}
            />
            <FlowStat
              label="Match Rate"
              value={
                data.summary.payout_count > 0
                  ? `${Math.round((data.summary.matched_count / data.summary.payout_count) * 100)}%`
                  : "—"
              }
              icon={null}
            />
          </div>

          {/* Cash Flow Bar Chart (text-based) */}
          {data.daily_payouts.length > 0 && (
            <div className="rounded-lg border border-stone-light p-4">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-secondary">
                Daily Cash Flow
              </h3>
              <div className="space-y-1.5">
                {data.daily_payouts.slice(-14).map((day) => {
                  const maxAmount = Math.max(
                    ...data.daily_payouts.map((d) =>
                      Math.max(d.created, d.settled)
                    ),
                    1
                  );
                  const createdPct = (day.created / maxAmount) * 100;
                  const settledPct = (day.settled / maxAmount) * 100;

                  return (
                    <div key={day.date} className="flex items-center gap-2 text-xs">
                      <span className="w-16 shrink-0 text-text-light">
                        {new Date(day.date + "T00:00:00").toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric" }
                        )}
                      </span>
                      <div className="flex-1">
                        <div className="flex gap-1">
                          {createdPct > 0 && (
                            <div
                              className="h-3 rounded-sm bg-bronze/60"
                              style={{ width: `${Math.max(createdPct, 2)}%` }}
                              title={`Created: ${formatUsd(day.created)}`}
                            />
                          )}
                          {settledPct > 0 && (
                            <div
                              className="h-3 rounded-sm bg-forest/60"
                              style={{ width: `${Math.max(settledPct, 2)}%` }}
                              title={`Settled: ${formatUsd(day.settled)}`}
                            />
                          )}
                        </div>
                      </div>
                      <span className="w-20 shrink-0 text-right font-mono text-text-secondary">
                        {formatUsd(day.settled || day.created)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 flex gap-4 text-xs text-text-light">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-sm bg-bronze/60" />
                  Created
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-sm bg-forest/60" />
                  Settled
                </div>
              </div>
            </div>
          )}

          {/* Mercury Balance Trend */}
          {data.daily_snapshots.length > 0 && (
            <div className="rounded-lg border border-stone-light p-4">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-secondary">
                Mercury Balance Trend
              </h3>
              <div className="space-y-1.5">
                {data.daily_snapshots.slice(-14).map((snap) => {
                  const maxBalance = Math.max(
                    ...data.daily_snapshots.map((s) => s.mercury_balance),
                    1
                  );
                  const pct = (snap.mercury_balance / maxBalance) * 100;

                  return (
                    <div key={snap.snapshot_date} className="flex items-center gap-2 text-xs">
                      <span className="w-16 shrink-0 text-text-light">
                        {new Date(snap.snapshot_date + "T00:00:00").toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric" }
                        )}
                      </span>
                      <div className="flex-1">
                        <div
                          className="h-3 rounded-sm bg-river/40"
                          style={{ width: `${Math.max(pct, 2)}%` }}
                        />
                      </div>
                      <span className="w-24 shrink-0 text-right font-mono text-text-secondary">
                        {formatUsd(snap.mercury_balance)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function FlowStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-stone-light p-3">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-xs text-text-secondary">{label}</span>
      </div>
      <p className="mt-1 text-lg font-semibold text-text-primary">{value}</p>
    </div>
  );
}
