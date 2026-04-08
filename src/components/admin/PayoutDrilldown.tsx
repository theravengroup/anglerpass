"use client";

import { useEffect, useState } from "react";
import {
  X,
  Loader2,
  CheckCircle2,
  Clock,
  ArrowRight,
  Receipt,
} from "lucide-react";

interface BalanceTxn {
  id: string;
  stripe_balance_txn_id: string;
  type: string;
  amount: number;
  fee: number;
  net: number;
  source_id: string | null;
  description: string | null;
  booking_id: string | null;
  created_at: string;
}

interface Booking {
  id: string;
  booking_date: string;
  party_size: number;
  amount_cents: number;
  payment_status: string;
}

interface PayoutDetail {
  payout: Record<string, unknown>;
  balance_transactions: BalanceTxn[];
  bookings: Booking[];
  mercury_transaction: Record<string, unknown> | null;
  breakdown: {
    charges: number;
    fees: number;
    refunds: number;
    transfers: number;
    adjustments: number;
  };
}

function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
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

export default function PayoutDrilldown({
  payoutId,
  onClose,
}: {
  payoutId: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<PayoutDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/finance-ops/payout/${payoutId}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [payoutId]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-label="Payout Details"
    >
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-light px-6 py-4">
          <h2 className="text-lg font-semibold text-text-primary">
            <Receipt className="mr-2 inline h-5 w-5 text-river" />
            Payout Details
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-text-secondary hover:bg-parchment"
            aria-label="Close payout details"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-stone" />
          </div>
        ) : !data ? (
          <div className="p-6 text-center text-text-secondary">
            Failed to load payout details.
          </div>
        ) : (
          <div className="space-y-6 p-6">
            {/* Payout Summary */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatBlock
                label="Payout Amount"
                value={formatUsd(
                  (data.payout.amount as number) ?? 0
                )}
              />
              <StatBlock label="Status" value={(data.payout.status as string) ?? "—"} />
              <StatBlock
                label="Reconciliation"
                value={(data.payout.reconciliation_status as string) ?? "—"}
              />
              <StatBlock
                label="Items"
                value={String((data.payout.item_count as number) ?? 0)}
              />
            </div>

            {/* Breakdown */}
            <section>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-text-secondary">
                Breakdown
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                <MiniStat label="Charges" value={formatUsd(data.breakdown.charges)} color="text-forest" />
                <MiniStat label="Stripe Fees" value={formatUsd(data.breakdown.fees)} color="text-red-600" />
                <MiniStat label="Refunds" value={formatUsd(data.breakdown.refunds)} color="text-bronze" />
                <MiniStat label="Transfers" value={formatUsd(data.breakdown.transfers)} color="text-river" />
                <MiniStat label="Adjustments" value={formatUsd(data.breakdown.adjustments)} color="text-text-secondary" />
              </div>
            </section>

            {/* Mercury Match */}
            {data.mercury_transaction && (
              <section>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-text-secondary">
                  <CheckCircle2 className="mr-1 inline h-4 w-4 text-forest" />
                  Matched Mercury Deposit
                </h3>
                <div className="rounded-lg border border-forest/20 bg-forest/5 p-3 text-sm">
                  <p>
                    <span className="text-text-secondary">Amount:</span>{" "}
                    <span className="font-mono font-medium text-forest">
                      {formatUsd(
                        (data.mercury_transaction.amount as number) ?? 0
                      )}
                    </span>
                  </p>
                  <p>
                    <span className="text-text-secondary">Posted:</span>{" "}
                    {formatDateTime(
                      (data.mercury_transaction.posted_at as string) ?? null
                    )}
                  </p>
                  <p>
                    <span className="text-text-secondary">Counterparty:</span>{" "}
                    {(data.mercury_transaction.counterparty_name as string) ??
                      "—"}
                  </p>
                </div>
              </section>
            )}

            {/* Balance Transactions */}
            <section>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-text-secondary">
                Balance Transactions ({data.balance_transactions.length})
              </h3>
              {data.balance_transactions.length === 0 ? (
                <p className="text-sm text-text-light">
                  No balance transactions recorded for this payout.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-stone-light">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-parchment text-text-secondary">
                      <tr>
                        <th className="px-3 py-2">Type</th>
                        <th className="px-3 py-2 text-right">Amount</th>
                        <th className="px-3 py-2 text-right">Fee</th>
                        <th className="px-3 py-2 text-right">Net</th>
                        <th className="px-3 py-2">Source</th>
                        <th className="px-3 py-2">Booking</th>
                        <th className="px-3 py-2">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-light">
                      {data.balance_transactions.map((bt) => (
                        <tr key={bt.id} className="hover:bg-parchment/50">
                          <td className="px-3 py-1.5">
                            <TxnTypeBadge type={bt.type} />
                          </td>
                          <td className="px-3 py-1.5 text-right font-mono">
                            {formatUsd(bt.amount)}
                          </td>
                          <td className="px-3 py-1.5 text-right font-mono text-red-600">
                            {bt.fee > 0 ? formatUsd(bt.fee) : "—"}
                          </td>
                          <td className="px-3 py-1.5 text-right font-mono font-medium">
                            {formatUsd(bt.net)}
                          </td>
                          <td className="px-3 py-1.5 font-mono text-text-light">
                            {bt.source_id?.slice(0, 15) ?? "—"}
                          </td>
                          <td className="px-3 py-1.5">
                            {bt.booking_id ? (
                              <span className="font-mono text-river">
                                {bt.booking_id.slice(0, 8)}…
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-3 py-1.5 text-text-light">
                            {formatDateTime(bt.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Linked Bookings */}
            {data.bookings.length > 0 && (
              <section>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-text-secondary">
                  Linked Bookings ({data.bookings.length})
                </h3>
                <div className="space-y-2">
                  {data.bookings.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between rounded-lg border border-stone-light p-3 text-sm"
                    >
                      <div>
                        <span className="font-mono text-text-secondary">
                          {b.id.slice(0, 8)}…
                        </span>
                        <span className="ml-2 text-text-primary">
                          {new Date(b.booking_date).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric" }
                          )}
                        </span>
                        <span className="ml-2 text-text-light">
                          {b.party_size} rod{b.party_size !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <span className="font-mono font-medium text-text-primary">
                        {formatUsd(b.amount_cents / 100)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-stone-light p-3">
      <p className="text-xs text-text-secondary">{label}</p>
      <p className="mt-0.5 text-lg font-semibold capitalize text-text-primary">
        {value}
      </p>
    </div>
  );
}

function MiniStat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="text-center">
      <p className="text-xs text-text-secondary">{label}</p>
      <p className={`font-mono text-sm font-medium ${color}`}>{value}</p>
    </div>
  );
}

function TxnTypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    charge: "bg-forest/10 text-forest",
    refund: "bg-red-50 text-red-600",
    transfer: "bg-river/10 text-river",
    payout: "bg-bronze/10 text-bronze",
    adjustment: "bg-stone-light text-text-secondary",
    dispute: "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colors[type] ?? colors.adjustment}`}
    >
      {type}
    </span>
  );
}
