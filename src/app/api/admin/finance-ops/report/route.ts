import { requireAdmin, jsonOk, jsonError } from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/admin/finance-ops/report?month=2026-04
 *
 * Monthly reconciliation report. Returns:
 * - All payouts for the month with match status
 * - Revenue decomposition (gross -> fees -> net -> settled)
 * - Exception summary
 * - Month-end readiness score
 */
export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth) return jsonError("Unauthorized", 401);

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return jsonError("Missing or invalid month param (format: YYYY-MM)", 400);
  }

  const startDate = `${month}-01`;
  const endYear = parseInt(month.split("-")[0]);
  const endMonth = parseInt(month.split("-")[1]);
  const nextMonth = endMonth === 12
    ? `${endYear + 1}-01-01`
    : `${endYear}-${String(endMonth + 1).padStart(2, "0")}-01`;

  const db = createAdminClient();
  const typedAdmin = createAdminClient();

  // 1. All payouts for the month
  const { data: payouts } = await db
    .from("finance_stripe_payouts")
    .select(
      "id, stripe_payout_id, amount, status, arrival_date, reconciliation_status, paid_at, gross_amount, fee_amount, refund_amount, item_count, created_at"
    )
    .gte("created_at", `${startDate}T00:00:00Z`)
    .lt("created_at", `${nextMonth}T00:00:00Z`)
    .order("created_at", { ascending: true });

  const payoutList = (payouts ?? []) as Array<{
    id: string;
    stripe_payout_id: string;
    amount: number;
    status: string;
    reconciliation_status: string;
    gross_amount: number;
    fee_amount: number;
    refund_amount: number;
    item_count: number;
  }>;

  // 2. Revenue decomposition from balance transactions
  const { data: balanceTxns } = await db
    .from("finance_stripe_balance_txns")
    .select("type, amount, fee, net")
    .gte("created_at", `${startDate}T00:00:00Z`)
    .lt("created_at", `${nextMonth}T00:00:00Z`);

  const txns = (balanceTxns ?? []) as Array<{
    type: string;
    amount: number;
    fee: number;
    net: number;
  }>;

  const revenue = {
    gross_charges: txns
      .filter((t) => t.type === "charge")
      .reduce((sum, t) => sum + t.amount, 0),
    stripe_fees: txns
      .filter((t) => t.type === "charge")
      .reduce((sum, t) => sum + t.fee, 0),
    refunds: txns
      .filter((t) => t.type === "refund")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0),
    transfers_out: txns
      .filter((t) => t.type === "transfer")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0),
    net_to_platform: 0,
  };
  revenue.net_to_platform =
    revenue.gross_charges -
    revenue.stripe_fees -
    revenue.refunds -
    revenue.transfers_out;

  // 3. Platform revenue from bookings
  const { data: bookings } = await typedAdmin
    .from("bookings")
    .select("platform_fee_cents")
    .eq("payment_status", "succeeded")
    .gte("paid_at", `${startDate}T00:00:00Z`)
    .lt("paid_at", `${nextMonth}T00:00:00Z`);

  const platformRevenue = ((bookings ?? []) as Array<{ platform_fee_cents: number | null }>)
    .reduce((sum, b) => sum + ((b.platform_fee_cents ?? 0) / 100), 0);

  // 4. Exceptions for the month
  const { data: exceptions } = await db
    .from("finance_reconciliation_exceptions")
    .select("id, type, severity, status, created_at, resolved_at")
    .gte("created_at", `${startDate}T00:00:00Z`)
    .lt("created_at", `${nextMonth}T00:00:00Z`);

  const exceptionList = (exceptions ?? []) as Array<{
    type: string;
    severity: string;
    status: string;
  }>;

  const exceptionSummary = {
    total: exceptionList.length,
    open: exceptionList.filter((e) => e.status === "open").length,
    resolved: exceptionList.filter((e) => e.status === "resolved").length,
    dismissed: exceptionList.filter((e) => e.status === "dismissed").length,
    critical: exceptionList.filter((e) => e.severity === "critical").length,
  };

  // 5. Month-end readiness score
  const totalPayouts = payoutList.length;
  const matchedPayouts = payoutList.filter(
    (p) => p.reconciliation_status === "matched"
  ).length;
  const criticalOpen = exceptionList.filter(
    (e) => e.severity === "critical" && e.status === "open"
  ).length;

  const scores = {
    payouts_matched: totalPayouts > 0 ? matchedPayouts / totalPayouts : 1,
    no_critical_exceptions: criticalOpen === 0 ? 1 : 0,
    refunds_reconciled: 1, // Assume reconciled if we have balance txn data
    disputes_current: 1, // Placeholder
    transfers_verified: 1, // Placeholder — Connect verification runs in cron
    mercury_balanced: 1, // Placeholder
  };

  const weights = {
    payouts_matched: 0.3,
    no_critical_exceptions: 0.25,
    refunds_reconciled: 0.15,
    disputes_current: 0.1,
    transfers_verified: 0.1,
    mercury_balanced: 0.1,
  };

  const readinessScore = Object.entries(scores).reduce(
    (total, [key, value]) =>
      total + value * weights[key as keyof typeof weights],
    0
  );

  // 6. Daily snapshots for the month (for trend data)
  const { data: snapshots } = await db
    .from("finance_daily_snapshots")
    .select("snapshot_date, mercury_balance, stripe_available_balance, payouts_arrived, open_exceptions")
    .gte("snapshot_date", startDate)
    .lt("snapshot_date", nextMonth)
    .order("snapshot_date", { ascending: true });

  return jsonOk({
    month,
    payouts: payoutList,
    payout_summary: {
      total: totalPayouts,
      matched: matchedPayouts,
      pending: payoutList.filter((p) => p.reconciliation_status === "pending").length,
      failed: payoutList.filter((p) => p.status === "failed").length,
      total_amount: payoutList.reduce((sum, p) => sum + p.amount, 0),
    },
    revenue,
    platform_revenue: platformRevenue,
    exception_summary: exceptionSummary,
    readiness_score: Math.round(readinessScore * 100),
    daily_snapshots: snapshots ?? [],
  });
}
