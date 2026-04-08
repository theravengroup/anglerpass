"use client";

import { useEffect, useState } from "react";
import { Loader2, TrendingUp } from "lucide-react";

interface StreamData {
  period_days: number;
  gmv: number;
  total_revenue: number;
  streams: {
    platform_fees: number;
    cross_club_fees: number;
    guide_service_fees: number;
    membership_fees: number;
    compass_credit_revenue: number;
  };
  percentages: Record<string, number>;
  booking_count: number;
}

function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

const STREAM_CONFIG = [
  { key: "platform_fees", label: "Platform Fees (15%)", color: "bg-forest" },
  { key: "cross_club_fees", label: "Cross-Club Fees", color: "bg-river" },
  { key: "guide_service_fees", label: "Guide Service Fees", color: "bg-bronze" },
  { key: "membership_fees", label: "Membership Fees", color: "bg-charcoal" },
  { key: "compass_credit_revenue", label: "Compass AI Credits", color: "bg-purple-500" },
] as const;

const PERIOD_OPTIONS = [7, 14, 30, 60, 90];

export default function RevenueStreamsCard() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<StreamData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/finance-ops/revenue-streams?days=${days}`);
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
          <TrendingUp className="mr-1.5 inline h-5 w-5 text-forest" />
          Revenue by Stream
        </h2>
        <div className="flex gap-1">
          {PERIOD_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                days === d
                  ? "bg-forest text-white"
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
          {/* Totals */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-stone-light p-3">
              <p className="text-xs text-text-secondary">GMV</p>
              <p className="text-xl font-bold text-text-primary">
                {formatUsd(data.gmv)}
              </p>
            </div>
            <div className="rounded-lg border border-stone-light p-3">
              <p className="text-xs text-text-secondary">AnglerPass Revenue</p>
              <p className="text-xl font-bold text-forest">
                {formatUsd(data.total_revenue)}
              </p>
            </div>
            <div className="rounded-lg border border-stone-light p-3">
              <p className="text-xs text-text-secondary">Bookings</p>
              <p className="text-xl font-bold text-text-primary">
                {data.booking_count}
              </p>
            </div>
          </div>

          {/* Stacked bar visualization */}
          {data.total_revenue > 0 && (
            <div className="overflow-hidden rounded-full">
              <div className="flex h-6">
                {STREAM_CONFIG.map(({ key, color }) => {
                  const pct = data.percentages[key] ?? 0;
                  if (pct === 0) return null;
                  return (
                    <div
                      key={key}
                      className={`${color} transition-all`}
                      style={{ width: `${pct}%` }}
                      title={`${STREAM_CONFIG.find((s) => s.key === key)?.label}: ${pct}%`}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Stream breakdown */}
          <div className="space-y-2">
            {STREAM_CONFIG.map(({ key, label, color }) => {
              const amount = data.streams[key as keyof typeof data.streams];
              const pct = data.percentages[key] ?? 0;
              return (
                <div key={key} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${color}`} />
                    <span className="text-text-secondary">{label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-text-light">{pct}%</span>
                    <span className="min-w-[80px] text-right font-mono font-medium text-text-primary">
                      {formatUsd(amount)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
