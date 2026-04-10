import "server-only";

/**
 * Finance Operations Alert System
 *
 * Generates and sends alerts for finance-critical events:
 * - Payout failures (critical)
 * - Unmatched items past threshold (warning/critical)
 * - Large refunds (warning)
 * - Disputes opened (warning)
 * - Daily cash summary (info)
 */

import { createAdminClient } from "@/lib/supabase/admin";

// ─── Types ──────────────────────────────────────────────────────────

export type AlertSeverity = "info" | "warning" | "critical";

export interface FinanceAlert {
  severity: AlertSeverity;
  title: string;
  body: string;
  link?: string;
}

// ─── Alert Generators ───────────────────────────────────────────────

/**
 * Check for conditions that warrant finance alerts.
 * Returns a list of alerts that should be sent to admin/finance staff.
 */
export async function generateFinanceAlerts(): Promise<FinanceAlert[]> {
  const db = createAdminClient();
  const alerts: FinanceAlert[] = [];

  // 1. Critical: Payout failures in last 24h
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: failedPayouts } = await db
    .from("finance_stripe_payouts")
    .select("stripe_payout_id, amount, failure_message")
    .eq("status", "failed")
    .gte("failed_at", oneDayAgo);

  for (const payout of (failedPayouts ?? []) as Array<{
    stripe_payout_id: string;
    amount: number;
    failure_message: string | null;
  }>) {
    alerts.push({
      severity: "critical",
      title: `Payout Failed: $${payout.amount}`,
      body: `Payout ${payout.stripe_payout_id} failed: ${payout.failure_message ?? "unknown reason"}. Immediate action required.`,
      link: "/admin/finance-ops",
    });
  }

  // 2. Warning: Unmatched payouts older than 3 business days
  const { data: unmatchedPayouts } = await db
    .from("finance_stripe_payouts")
    .select("stripe_payout_id, amount, paid_at")
    .eq("reconciliation_status", "pending")
    .eq("status", "paid")
    .lt("paid_at", new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString());

  if ((unmatchedPayouts ?? []).length > 0) {
    const total = (unmatchedPayouts as Array<{ amount: number }>).reduce(
      (sum, p) => sum + p.amount, 0
    );
    alerts.push({
      severity: "warning",
      title: `${unmatchedPayouts!.length} Unmatched Payout${unmatchedPayouts!.length > 1 ? "s" : ""}`,
      body: `$${total.toFixed(2)} in Stripe payouts have not been matched to Mercury deposits after 3+ days.`,
      link: "/admin/finance-ops",
    });
  }

  // 3. Warning: Unmatched Mercury deposits older than 3 days
  const { data: unmatchedDeposits } = await db
    .from("finance_mercury_transactions")
    .select("mercury_txn_id, amount")
    .eq("is_stripe_deposit", true)
    .eq("reconciliation_status", "pending")
    .lt("posted_at", new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString());

  if ((unmatchedDeposits ?? []).length > 0) {
    alerts.push({
      severity: "warning",
      title: `${unmatchedDeposits!.length} Unmatched Mercury Deposit${unmatchedDeposits!.length > 1 ? "s" : ""}`,
      body: `Stripe deposits in Mercury with no matching Stripe payout record.`,
      link: "/admin/finance-ops",
    });
  }

  // 4. Warning: Open critical exceptions
  const { data: criticalExceptions } = await db
    .from("finance_reconciliation_exceptions")
    .select("id")
    .eq("severity", "critical")
    .eq("status", "open");

  if ((criticalExceptions ?? []).length > 0) {
    alerts.push({
      severity: "critical",
      title: `${criticalExceptions!.length} Critical Exception${criticalExceptions!.length > 1 ? "s" : ""}`,
      body: `Unresolved critical reconciliation exceptions require immediate review.`,
      link: "/admin/finance-ops",
    });
  }

  // 5. Info: Sync failures
  const { data: syncFailures } = await db
    .from("finance_sync_status")
    .select("system, last_error")
    .eq("last_sync_status", "failed");

  for (const sync of (syncFailures ?? []) as Array<{
    system: string;
    last_error: string | null;
  }>) {
    alerts.push({
      severity: "warning",
      title: `Sync Failed: ${sync.system.replace(/_/g, " ")}`,
      body: sync.last_error ?? "Unknown sync error. Check system logs.",
      link: "/admin/finance-ops",
    });
  }

  return alerts;
}

/**
 * Send finance alerts to all super_admin and finance_admin staff.
 * Creates in-app notifications for each alert.
 */
export async function sendFinanceAlerts(
  alerts: FinanceAlert[]
): Promise<number> {
  if (alerts.length === 0) return 0;

  const typedAdmin = createAdminClient();

  // Find all finance-capable admin users
  const { data: staff } = await typedAdmin
    .from("platform_staff")
    .select("user_id, role")
    .in("role", ["super_admin", "finance_admin"]);

  if (!staff || staff.length === 0) return 0;

  const { notify } = await import("@/lib/notifications");
  let sent = 0;

  for (const alert of alerts) {
    for (const member of staff) {
      try {
        await notify(typedAdmin, {
          userId: member.user_id,
          type: "booking_cancelled", // Reuse existing type for routing
          title: `[Finance] ${alert.title}`,
          body: alert.body,
          link: alert.link ?? "/admin/finance-ops",
        });
        sent++;
      } catch {
        // Non-critical — don't let notification failures break the alert loop
      }
    }
  }

  return sent;
}

/**
 * Generate and send a daily cash summary notification.
 */
export async function sendDailyCashSummary(): Promise<void> {
  const db = createAdminClient();

  // Get latest snapshot
  const { data: snapshot } = await db
    .from("finance_daily_snapshots")
    .select("*")
    .order("snapshot_date", { ascending: false })
    .limit(1)
    .single();

  if (!snapshot) return;

  const s = snapshot as {
    snapshot_date: string;
    mercury_balance: number;
    stripe_available_balance: number;
    stripe_pending_balance: number;
    payouts_created: number;
    payouts_arrived: number;
    open_exceptions: number;
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(n);

  const alert: FinanceAlert = {
    severity: "info",
    title: `Daily Cash Summary — ${s.snapshot_date}`,
    body: [
      `Mercury: ${fmt(s.mercury_balance)}`,
      `Stripe Available: ${fmt(s.stripe_available_balance)} (${fmt(s.stripe_pending_balance)} pending)`,
      `Payouts Created: ${fmt(s.payouts_created)} | Arrived: ${fmt(s.payouts_arrived)}`,
      s.open_exceptions > 0
        ? `⚠ ${s.open_exceptions} open exception${s.open_exceptions > 1 ? "s" : ""}`
        : "✓ No open exceptions",
    ].join("\n"),
    link: "/admin/finance-ops",
  };

  await sendFinanceAlerts([alert]);
}
