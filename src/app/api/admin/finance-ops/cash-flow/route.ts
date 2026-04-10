import { requireAdmin, jsonOk, jsonError } from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/admin/finance-ops/cash-flow?days=30
 *
 * Cash flow trend data:
 * - Daily net settled (payouts that matched Mercury deposits)
 * - Daily payouts created
 * - Mercury balance trend
 * - Stripe balance trend
 */
export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth) return jsonError("Unauthorized", 401);

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") ?? "30", 10);

  const db = createAdminClient();

  // Daily snapshots give us the trend data
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const { data: snapshots } = await db
    .from("finance_daily_snapshots")
    .select(
      "snapshot_date, mercury_balance, stripe_available_balance, stripe_pending_balance, payouts_created, payouts_arrived, gross_processed, net_revenue, open_exceptions"
    )
    .gte("snapshot_date", since)
    .order("snapshot_date", { ascending: true });

  // Also get payout-level detail for the period
  const { data: payouts } = await db
    .from("finance_stripe_payouts")
    .select("amount, status, reconciliation_status, arrival_date, paid_at, created_at")
    .gte("created_at", `${since}T00:00:00Z`)
    .order("created_at", { ascending: true });

  const payoutList = (payouts ?? []) as Array<{
    amount: number;
    status: string;
    reconciliation_status: string;
    arrival_date: string | null;
    paid_at: string | null;
    created_at: string;
  }>;

  // Group payouts by date for daily aggregation
  const dailyPayouts = new Map<string, { created: number; settled: number }>();
  for (const p of payoutList) {
    const createdDate = p.created_at.split("T")[0];
    const entry = dailyPayouts.get(createdDate) ?? { created: 0, settled: 0 };
    entry.created += p.amount;
    dailyPayouts.set(createdDate, entry);

    if (p.reconciliation_status === "matched" && p.paid_at) {
      const settledDate = p.paid_at.split("T")[0];
      const settledEntry = dailyPayouts.get(settledDate) ?? { created: 0, settled: 0 };
      settledEntry.settled += p.amount;
      dailyPayouts.set(settledDate, settledEntry);
    }
  }

  // Summary stats
  const totalCreated = payoutList.reduce((s, p) => s + p.amount, 0);
  const totalSettled = payoutList
    .filter((p) => p.reconciliation_status === "matched")
    .reduce((s, p) => s + p.amount, 0);
  const totalPending = payoutList
    .filter((p) => p.reconciliation_status === "pending")
    .reduce((s, p) => s + p.amount, 0);

  return jsonOk({
    period_days: days,
    daily_snapshots: snapshots ?? [],
    daily_payouts: [...dailyPayouts.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, values]) => ({ date, ...values })),
    summary: {
      total_created: totalCreated,
      total_settled: totalSettled,
      total_pending: totalPending,
      payout_count: payoutList.length,
      matched_count: payoutList.filter((p) => p.reconciliation_status === "matched").length,
    },
  });
}
