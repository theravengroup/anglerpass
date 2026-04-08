"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";

interface ReportData {
  month: string;
  payout_summary: {
    total: number;
    matched: number;
    pending: number;
    failed: number;
    total_amount: number;
  };
  revenue: {
    gross_charges: number;
    stripe_fees: number;
    refunds: number;
    transfers_out: number;
    net_to_platform: number;
  };
  platform_revenue: number;
  exception_summary: {
    total: number;
    open: number;
    resolved: number;
    dismissed: number;
    critical: number;
  };
  readiness_score: number;
  daily_snapshots: Array<{
    snapshot_date: string;
    mercury_balance: number;
    stripe_available_balance: number;
    payouts_arrived: number;
    open_exceptions: number;
  }>;
}

function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export default function MonthlyReportCard() {
  const now = new Date();
  const [month, setMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/admin/finance-ops/report?month=${month}`
        );
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [month]);

  function shiftMonth(delta: number) {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    );
  }

  const monthLabel = new Date(`${month}-01T00:00:00`).toLocaleDateString(
    "en-US",
    { month: "long", year: "numeric" }
  );

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">
          <BarChart3 className="mr-1.5 inline h-5 w-5 text-river" />
          Monthly Report
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => shiftMonth(-1)}
            className="rounded-md p-1.5 text-text-secondary hover:bg-parchment"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[140px] text-center text-sm font-medium text-text-primary">
            {monthLabel}
          </span>
          <button
            onClick={() => shiftMonth(1)}
            className="rounded-md p-1.5 text-text-secondary hover:bg-parchment"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-stone" />
        </div>
      ) : !data ? (
        <p className="text-center text-sm text-text-secondary">
          No data for this month.
        </p>
      ) : (
        <div className="space-y-4">
          {/* Readiness Score */}
          <ReadinessScore score={data.readiness_score} />

          {/* Revenue Decomposition */}
          <div className="rounded-lg border border-stone-light p-4">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-secondary">
              Revenue Flow
            </h3>
            <div className="space-y-2 text-sm">
              <FlowRow
                label="Gross Charges"
                value={formatUsd(data.revenue.gross_charges)}
                color="text-forest"
              />
              <FlowRow
                label="Stripe Fees"
                value={`- ${formatUsd(data.revenue.stripe_fees)}`}
                color="text-red-600"
                indent
              />
              <FlowRow
                label="Refunds"
                value={`- ${formatUsd(data.revenue.refunds)}`}
                color="text-bronze"
                indent
              />
              <FlowRow
                label="Transfers to Connected Accounts"
                value={`- ${formatUsd(data.revenue.transfers_out)}`}
                color="text-river"
                indent
              />
              <div className="border-t border-stone-light pt-2">
                <FlowRow
                  label="Net to Platform"
                  value={formatUsd(data.revenue.net_to_platform)}
                  color="text-text-primary"
                  bold
                />
              </div>
              <FlowRow
                label="Platform Fees from Bookings"
                value={formatUsd(data.platform_revenue)}
                color="text-forest"
              />
            </div>
          </div>

          {/* Payout Summary */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniCard
              label="Total Payouts"
              value={String(data.payout_summary.total)}
            />
            <MiniCard
              label="Matched"
              value={String(data.payout_summary.matched)}
              color="text-forest"
            />
            <MiniCard
              label="Pending"
              value={String(data.payout_summary.pending)}
              color="text-bronze"
            />
            <MiniCard
              label="Total Paid Out"
              value={formatUsd(data.payout_summary.total_amount)}
            />
          </div>

          {/* Exception Summary */}
          <div className="rounded-lg border border-stone-light p-4">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-text-secondary">
              Exceptions
            </h3>
            <div className="flex gap-4 text-sm">
              <span>
                Total: <strong>{data.exception_summary.total}</strong>
              </span>
              <span className="text-red-600">
                Open: <strong>{data.exception_summary.open}</strong>
              </span>
              <span className="text-forest">
                Resolved: <strong>{data.exception_summary.resolved}</strong>
              </span>
              {data.exception_summary.critical > 0 && (
                <span className="text-red-700">
                  <AlertTriangle className="mr-0.5 inline h-3.5 w-3.5" />
                  Critical: <strong>{data.exception_summary.critical}</strong>
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function ReadinessScore({ score }: { score: number }) {
  const color =
    score >= 90
      ? "text-forest bg-forest/10 border-forest/20"
      : score >= 70
        ? "text-bronze bg-bronze/10 border-bronze/20"
        : "text-red-600 bg-red-50 border-red-200";

  const label =
    score >= 90 ? "Ready" : score >= 70 ? "Needs Attention" : "Not Ready";

  return (
    <div
      className={`flex items-center justify-between rounded-lg border p-4 ${color}`}
    >
      <div>
        <p className="text-sm font-medium">Month-End Readiness</p>
        <p className="text-xs opacity-75">{label}</p>
      </div>
      <p className="text-3xl font-bold">{score}%</p>
    </div>
  );
}

function FlowRow({
  label,
  value,
  color,
  indent,
  bold,
}: {
  label: string;
  value: string;
  color: string;
  indent?: boolean;
  bold?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between ${indent ? "pl-4" : ""}`}
    >
      <span
        className={`text-text-secondary ${bold ? "font-semibold text-text-primary" : ""}`}
      >
        {label}
      </span>
      <span className={`font-mono ${color} ${bold ? "font-bold" : "font-medium"}`}>
        {value}
      </span>
    </div>
  );
}

function MiniCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="rounded-lg border border-stone-light p-3 text-center">
      <p className="text-xs text-text-secondary">{label}</p>
      <p className={`mt-0.5 text-lg font-semibold ${color ?? "text-text-primary"}`}>
        {value}
      </p>
    </div>
  );
}
