"use client";

import { useEffect, useState } from "react";
import {
  Landmark,
  ArrowUpDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  Loader2,
  Search,
  DollarSign,
  Building2,
} from "lucide-react";
import AdminPageGuard from "@/components/admin/AdminPageGuard";
import PayoutDrilldown from "@/components/admin/PayoutDrilldown";
import MonthlyReportCard from "@/components/admin/MonthlyReportCard";

// ─── Types ──────────────────────────────────────────────────────────

interface Payout {
  id: string;
  stripe_payout_id: string;
  amount: number;
  currency: string;
  status: string;
  arrival_date: string | null;
  paid_at: string | null;
  reconciliation_status: string;
  item_count: number;
  gross_amount: number;
  fee_amount: number;
  refund_amount: number;
  matched_at: string | null;
  created_at: string;
}

interface MercuryAccount {
  id: string;
  mercury_account_id: string;
  name: string;
  kind: string;
  available_balance: number;
  current_balance: number;
  last_snapshot_at: string;
}

interface Exception {
  id: string;
  type: string;
  severity: string;
  stripe_payout_id: string | null;
  mercury_txn_id: string | null;
  expected_amount: number | null;
  actual_amount: number | null;
  description: string;
  status: string;
  created_at: string;
}

interface SyncStatus {
  system: string;
  last_sync_at: string | null;
  last_sync_status: string;
  last_error: string | null;
  records_synced: number;
}

interface DailySnapshot {
  snapshot_date: string;
  mercury_balance: number;
  stripe_available_balance: number;
  stripe_pending_balance: number;
  payouts_created: number;
  payouts_arrived: number;
  open_exceptions: number;
}

// ─── Helpers ────────────────────────────────────────────────────────

function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ─── Sub-Components ─────────────────────────────────────────────────

function ReconStatusBadge({ status }: { status: string }) {
  const config: Record<string, { icon: typeof CheckCircle2; color: string; bg: string; label: string }> = {
    matched: { icon: CheckCircle2, color: "text-forest", bg: "bg-forest/10", label: "Matched" },
    pending: { icon: Clock, color: "text-bronze", bg: "bg-bronze/10", label: "Pending" },
    unmatched: { icon: Search, color: "text-red-600", bg: "bg-red-50", label: "Unmatched" },
    exception: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50", label: "Exception" },
  };

  const c = config[status] ?? config.pending;
  const Icon = c.icon;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${c.bg} ${c.color}`}>
      <Icon className="h-3 w-3" />
      {c.label}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    critical: "bg-red-100 text-red-700",
    warning: "bg-amber-100 text-amber-700",
    info: "bg-blue-100 text-blue-700",
  };

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colors[severity] ?? colors.info}`}>
      {severity}
    </span>
  );
}

function SyncStatusIndicator({ status }: { status: SyncStatus }) {
  const isOk = status.last_sync_status === "success";
  const isFresh = status.last_sync_at
    ? Date.now() - new Date(status.last_sync_at).getTime() < 24 * 60 * 60 * 1000
    : false;

  return (
    <div className="flex items-center justify-between rounded-lg border border-stone-light p-3">
      <div>
        <p className="text-sm font-medium text-text-primary">
          {status.system.replace(/_/g, " ")}
        </p>
        <p className="text-xs text-text-secondary">
          Last sync: {formatDateTime(status.last_sync_at)}
          {status.records_synced > 0 && ` · ${status.records_synced} records`}
        </p>
        {status.last_error && (
          <p className="mt-1 text-xs text-red-600">{status.last_error}</p>
        )}
      </div>
      <div className={`h-3 w-3 rounded-full ${isOk && isFresh ? "bg-forest" : isOk ? "bg-bronze" : "bg-red-500"}`} />
    </div>
  );
}

// ─── Main Content ───────────────────────────────────────────────────

function FinanceOpsContent() {
  const [data, setData] = useState<{
    payouts: Payout[];
    accounts: MercuryAccount[];
    exceptions: Exception[];
    sync_status: SyncStatus[];
    latest_snapshot: DailySnapshot | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);
  const [selectedPayoutId, setSelectedPayoutId] = useState<string | null>(null);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/finance-ops");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function resolveException(
    exceptionId: string,
    action: "resolved" | "dismissed" | "investigating"
  ) {
    setResolving(exceptionId);
    try {
      const res = await fetch("/api/admin/finance-ops", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exception_id: exceptionId, action }),
      });
      if (res.ok) {
        await fetchData();
      }
    } finally {
      setResolving(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-stone" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-700">Failed to load finance operations data.</p>
      </div>
    );
  }

  const snapshot = data.latest_snapshot;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={<Building2 className="h-5 w-5 text-river" />}
          label="Mercury Balance"
          value={formatUsd(
            data.accounts.reduce((s, a) => s + a.available_balance, 0)
          )}
        />
        <SummaryCard
          icon={<DollarSign className="h-5 w-5 text-forest" />}
          label="Stripe Available"
          value={formatUsd(snapshot?.stripe_available_balance ?? 0)}
          sub={`${formatUsd(snapshot?.stripe_pending_balance ?? 0)} pending`}
        />
        <SummaryCard
          icon={<ArrowUpDown className="h-5 w-5 text-bronze" />}
          label="Pending Payouts"
          value={String(
            data.payouts.filter((p) => p.reconciliation_status === "pending").length
          )}
        />
        <SummaryCard
          icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
          label="Open Exceptions"
          value={String(data.exceptions.length)}
        />
      </div>

      {/* Sync Status */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">
            System Sync Status
          </h2>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-1.5 rounded-md bg-parchment px-3 py-1.5 text-sm text-text-primary hover:bg-parchment-light"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {data.sync_status.map((s) => (
            <SyncStatusIndicator key={s.system} status={s as SyncStatus} />
          ))}
        </div>
      </section>

      {/* Mercury Accounts */}
      {data.accounts.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-text-primary">
            Mercury Accounts
          </h2>
          <div className="overflow-hidden rounded-lg border border-stone-light">
            <table className="w-full text-left text-sm">
              <thead className="bg-parchment text-text-secondary">
                <tr>
                  <th className="px-4 py-2">Account</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2 text-right">Available</th>
                  <th className="px-4 py-2 text-right">Current</th>
                  <th className="px-4 py-2 text-right">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-light">
                {data.accounts.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-2 font-medium text-text-primary">{a.name}</td>
                    <td className="px-4 py-2 capitalize text-text-secondary">{a.kind}</td>
                    <td className="px-4 py-2 text-right font-mono text-forest">{formatUsd(a.available_balance)}</td>
                    <td className="px-4 py-2 text-right font-mono text-text-secondary">{formatUsd(a.current_balance)}</td>
                    <td className="px-4 py-2 text-right text-text-secondary">{formatDateTime(a.last_snapshot_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Exceptions */}
      {data.exceptions.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-text-primary">
            <AlertTriangle className="mr-1.5 inline h-5 w-5 text-red-500" />
            Open Exceptions ({data.exceptions.length})
          </h2>
          <div className="space-y-3">
            {data.exceptions.map((ex) => (
              <div key={ex.id} className="rounded-lg border border-stone-light p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <SeverityBadge severity={ex.severity} />
                      <span className="text-xs text-text-secondary">
                        {ex.type.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs text-text-light">
                        {formatDateTime(ex.created_at)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-text-primary">
                      {ex.description}
                    </p>
                    {(ex.expected_amount || ex.actual_amount) && (
                      <p className="mt-1 text-xs text-text-secondary">
                        {ex.expected_amount != null && `Expected: ${formatUsd(ex.expected_amount)}`}
                        {ex.expected_amount != null && ex.actual_amount != null && " · "}
                        {ex.actual_amount != null && `Actual: ${formatUsd(ex.actual_amount)}`}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => resolveException(ex.id, "investigating")}
                      disabled={resolving === ex.id}
                      className="rounded-md border border-stone-light px-2 py-1 text-xs text-text-secondary hover:bg-parchment disabled:opacity-50"
                    >
                      Investigate
                    </button>
                    <button
                      onClick={() => resolveException(ex.id, "resolved")}
                      disabled={resolving === ex.id}
                      className="rounded-md bg-forest px-2 py-1 text-xs text-white hover:bg-forest-deep disabled:opacity-50"
                    >
                      Resolve
                    </button>
                    <button
                      onClick={() => resolveException(ex.id, "dismissed")}
                      disabled={resolving === ex.id}
                      className="rounded-md border border-stone-light px-2 py-1 text-xs text-text-light hover:bg-parchment disabled:opacity-50"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Monthly Report */}
      <MonthlyReportCard />

      {/* Recent Payouts */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-text-primary">
          Recent Stripe Payouts
        </h2>
        {data.payouts.length === 0 ? (
          <div className="rounded-lg border border-stone-light p-6 text-center text-text-secondary">
            No payouts recorded yet. Payouts will appear here as Stripe webhooks fire.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-stone-light">
            <table className="w-full text-left text-sm">
              <thead className="bg-parchment text-text-secondary">
                <tr>
                  <th className="px-4 py-2">Payout ID</th>
                  <th className="px-4 py-2 text-right">Amount</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Recon</th>
                  <th className="px-4 py-2">Arrival</th>
                  <th className="px-4 py-2 text-right">Items</th>
                  <th className="px-4 py-2">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-light">
                {data.payouts.map((p) => (
                  <tr
                    key={p.id}
                    className="cursor-pointer hover:bg-parchment/50"
                    onClick={() => setSelectedPayoutId(p.id)}
                  >
                    <td className="px-4 py-2 font-mono text-xs text-river underline">
                      {p.stripe_payout_id.slice(0, 20)}…
                    </td>
                    <td className="px-4 py-2 text-right font-mono font-medium text-text-primary">
                      {formatUsd(p.amount)}
                    </td>
                    <td className="px-4 py-2">
                      <PayoutStatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-2">
                      <ReconStatusBadge status={p.reconciliation_status} />
                    </td>
                    <td className="px-4 py-2 text-text-secondary">
                      {formatDate(p.arrival_date)}
                    </td>
                    <td className="px-4 py-2 text-right text-text-secondary">
                      {p.item_count}
                    </td>
                    <td className="px-4 py-2 text-text-secondary">
                      {formatDateTime(p.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Payout Drilldown Modal */}
      {selectedPayoutId && (
        <PayoutDrilldown
          payoutId={selectedPayoutId}
          onClose={() => setSelectedPayoutId(null)}
        />
      )}
    </div>
  );
}

// ─── Small Components ───────────────────────────────────────────────

function SummaryCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-stone-light bg-white p-4">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-text-secondary">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold text-text-primary">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-text-light">{sub}</p>}
    </div>
  );
}

function PayoutStatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; bg: string }> = {
    paid: { color: "text-forest", bg: "bg-forest/10" },
    pending: { color: "text-bronze", bg: "bg-bronze/10" },
    in_transit: { color: "text-river", bg: "bg-river/10" },
    failed: { color: "text-red-600", bg: "bg-red-50" },
    canceled: { color: "text-text-light", bg: "bg-stone-light" },
  };

  const c = config[status] ?? config.pending;

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${c.bg} ${c.color}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

// ─── Page Export ─────────────────────────────────────────────────────

export default function FinanceOpsPage() {
  return (
    <AdminPageGuard path="/admin/finance-ops">
      <FinanceOpsContent />
    </AdminPageGuard>
  );
}
