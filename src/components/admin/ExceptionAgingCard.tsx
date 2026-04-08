"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Clock, Loader2 } from "lucide-react";

interface AgingData {
  exceptions: Array<{
    id: string;
    type: string;
    severity: string;
    status: string;
    description: string;
    created_at: string;
    age_days: number;
    resolved_in_days: number | null;
  }>;
  aging_summary: {
    total_open: number;
    under_1_day: number;
    one_to_3_days: number;
    three_to_7_days: number;
    over_7_days: number;
    avg_age_days: number;
  };
  resolution_stats: {
    total_resolved: number;
    avg_resolution_days: number;
  };
  type_breakdown: Record<string, number>;
}

const AGING_BUCKETS = [
  { key: "under_1_day", label: "< 1 day", color: "bg-forest" },
  { key: "one_to_3_days", label: "1–3 days", color: "bg-bronze" },
  { key: "three_to_7_days", label: "3–7 days", color: "bg-red-400" },
  { key: "over_7_days", label: "> 7 days", color: "bg-red-600" },
] as const;

export default function ExceptionAgingCard() {
  const [data, setData] = useState<AgingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/finance-ops/exceptions?status=open");
        if (res.ok) setData(await res.json());
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-stone" />
      </div>
    );
  }

  if (!data || data.aging_summary.total_open === 0) {
    return null; // Hide if no open exceptions
  }

  const summary = data.aging_summary;
  const total = summary.total_open;

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-text-primary">
        <Clock className="mr-1.5 inline h-5 w-5 text-bronze" />
        Exception Aging
      </h2>

      <div className="space-y-4">
        {/* Aging bar */}
        <div className="overflow-hidden rounded-full">
          <div className="flex h-5">
            {AGING_BUCKETS.map(({ key, color }) => {
              const count = summary[key as keyof typeof summary] as number;
              const pct = total > 0 ? (count / total) * 100 : 0;
              if (pct === 0) return null;
              return (
                <div
                  key={key}
                  className={`${color} transition-all`}
                  style={{ width: `${pct}%` }}
                />
              );
            })}
          </div>
        </div>

        {/* Legend + counts */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {AGING_BUCKETS.map(({ key, label, color }) => {
            const count = summary[key as keyof typeof summary] as number;
            return (
              <div key={key} className="flex items-center gap-2 text-sm">
                <div className={`h-3 w-3 rounded-full ${color}`} />
                <span className="text-text-secondary">{label}</span>
                <span className="ml-auto font-semibold text-text-primary">
                  {count}
                </span>
              </div>
            );
          })}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-stone-light p-3 text-center">
            <p className="text-xs text-text-secondary">Open</p>
            <p className="text-lg font-bold text-red-600">{summary.total_open}</p>
          </div>
          <div className="rounded-lg border border-stone-light p-3 text-center">
            <p className="text-xs text-text-secondary">Avg Age</p>
            <p className="text-lg font-bold text-text-primary">
              {summary.avg_age_days}d
            </p>
          </div>
          <div className="rounded-lg border border-stone-light p-3 text-center">
            <p className="text-xs text-text-secondary">Avg Resolution</p>
            <p className="text-lg font-bold text-forest">
              {data.resolution_stats.avg_resolution_days}d
            </p>
          </div>
        </div>

        {/* Type breakdown */}
        {Object.keys(data.type_breakdown).length > 0 && (
          <div className="rounded-lg border border-stone-light p-3">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
              By Type
            </h3>
            <div className="space-y-1">
              {Object.entries(data.type_breakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => (
                  <div
                    key={type}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-text-secondary">
                      {type.replace(/_/g, " ")}
                    </span>
                    <span className="font-medium text-text-primary">
                      {count}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
