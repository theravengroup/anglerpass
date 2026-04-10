import { jsonOk, jsonError } from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { runDailySweep, updateSyncStatus } from "@/lib/finance/reconciliation";
import { listAccounts } from "@/lib/mercury/client";
import { stripe } from "@/lib/stripe/server";

/**
 * POST /api/cron/finance-reconciliation
 *
 * Daily finance reconciliation cron job.
 *
 * 1. Refreshes Mercury account balances
 * 2. Runs reconciliation sweep (re-matches pending items, creates exceptions)
 * 3. Generates daily snapshot
 *
 * Protected by CRON_SECRET. Run via Vercel Cron at 6:00 AM ET.
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return jsonError("Unauthorized", 401);
  }

  const db = createAdminClient();
  const results: Record<string, unknown> = {};

  // 1. Refresh Mercury account balances
  try {
    const accounts = await listAccounts();
    for (const account of accounts) {
      const { data: existing } = await db
        .from("finance_mercury_accounts")
        .select("id")
        .eq("mercury_account_id", account.id)
        .maybeSingle();

      if (existing) {
        await db
          .from("finance_mercury_accounts")
          .update({
            available_balance: account.availableBalance,
            current_balance: account.currentBalance,
            name: account.name,
            kind: account.type,
            last_snapshot_at: new Date().toISOString(),
          })
          .eq("mercury_account_id", account.id);
      } else {
        await db.from("finance_mercury_accounts").insert({
          mercury_account_id: account.id,
          name: account.name,
          account_number_last4: account.accountNumber?.slice(-4) ?? null,
          kind: account.type,
          available_balance: account.availableBalance,
          current_balance: account.currentBalance,
        });
      }
    }

    await updateSyncStatus("mercury_accounts", "success", accounts.length);
    results.mercury_accounts = { synced: accounts.length };
  } catch (err) {
    console.error("[finance-cron] Mercury balance refresh failed:", err);
    await updateSyncStatus(
      "mercury_accounts",
      "failed",
      0,
      err instanceof Error ? err.message : "Unknown error"
    );
    results.mercury_accounts = { error: "Failed to refresh" };
  }

  // 2. Run reconciliation sweep
  try {
    const sweep = await runDailySweep();
    results.reconciliation = sweep;
  } catch (err) {
    console.error("[finance-cron] Reconciliation sweep failed:", err);
    results.reconciliation = {
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }

  // 3. Generate daily snapshot
  try {
    const snapshot = await generateDailySnapshot();
    results.snapshot = snapshot ? "created" : "already_exists";
  } catch (err) {
    console.error("[finance-cron] Daily snapshot failed:", err);
    results.snapshot = {
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }

  // 4. Verify Connect transfers (last 7 days)
  try {
    const { verifyConnectTransfers } = await import(
      "@/lib/finance/connect-verification"
    );
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const verification = await verifyConnectTransfers(sevenDaysAgo, new Date());
    results.connect_verification = verification;
  } catch (err) {
    console.error("[finance-cron] Connect transfer verification failed:", err);
    results.connect_verification = {
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }

  // 5. Generate and send finance alerts
  try {
    const { generateFinanceAlerts, sendFinanceAlerts, sendDailyCashSummary } =
      await import("@/lib/finance/alerts");
    const alerts = await generateFinanceAlerts();
    const sent = await sendFinanceAlerts(alerts);
    await sendDailyCashSummary();
    results.alerts = { generated: alerts.length, sent };
  } catch (err) {
    console.error("[finance-cron] Alert generation failed:", err);
    results.alerts = {
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }

  // 6. Send email digest (daily always, weekly on Mondays)
  try {
    const { sendDailyDigest, sendWeeklyDigest } = await import(
      "@/lib/finance/email-digest"
    );
    const dailySent = await sendDailyDigest();
    results.daily_digest = { sent: dailySent };

    const dayOfWeek = new Date().getDay();
    if (dayOfWeek === 1) {
      const weeklySent = await sendWeeklyDigest();
      results.weekly_digest = { sent: weeklySent };
    }
  } catch (err) {
    console.error("[finance-cron] Email digest failed:", err);
    results.email_digest = {
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }

  return jsonOk({ results });
}

// ─── Daily Snapshot ─────────────────────────────────────────────────

async function generateDailySnapshot(): Promise<boolean> {
  const db = createAdminClient();
  const today = new Date().toISOString().split("T")[0];

  // Check if snapshot already exists for today
  const { data: existing } = await db
    .from("finance_daily_snapshots")
    .select("id")
    .eq("snapshot_date", today)
    .maybeSingle();

  if (existing) return false;

  // Gather data from multiple sources

  // Mercury balances
  const { data: accounts } = await db
    .from("finance_mercury_accounts")
    .select("available_balance");

  const mercuryBalance = ((accounts ?? []) as { available_balance: number }[]).reduce(
    (sum, a) => sum + (a.available_balance ?? 0),
    0
  );

  // Stripe balances
  let stripeAvailable = 0;
  let stripePending = 0;
  try {
    const balance = await stripe.balance.retrieve();
    stripeAvailable =
      (balance.available?.find((b) => b.currency === "usd")?.amount ?? 0) /
      100;
    stripePending =
      (balance.pending?.find((b) => b.currency === "usd")?.amount ?? 0) /
      100;
  } catch {
    // Stripe balance API may fail in test mode
  }

  // Payouts created/arrived today
  const { data: payoutsCreated } = await db
    .from("finance_stripe_payouts")
    .select("amount")
    .gte("created_at", `${today}T00:00:00Z`)
    .lt("created_at", `${today}T23:59:59Z`);

  const payoutsCreatedTotal = ((payoutsCreated ?? []) as { amount: number }[]).reduce(
    (sum, p) => sum + p.amount,
    0
  );

  const { data: payoutsArrived } = await db
    .from("finance_stripe_payouts")
    .select("amount")
    .eq("reconciliation_status", "matched")
    .gte("matched_at", `${today}T00:00:00Z`)
    .lt("matched_at", `${today}T23:59:59Z`);

  const payoutsArrivedTotal = ((payoutsArrived ?? []) as { amount: number }[]).reduce(
    (sum, p) => sum + p.amount,
    0
  );

  // Open exceptions
  const { data: exceptions } = await db
    .from("finance_reconciliation_exceptions")
    .select("id")
    .in("status", ["open", "investigating"]);

  const openExceptions = (exceptions ?? []).length;

  // Insert snapshot
  await db.from("finance_daily_snapshots").insert({
    snapshot_date: today,
    gross_processed: 0, // Populated by balance txn aggregation
    stripe_fees: 0,
    refunds_issued: 0,
    net_revenue: 0,
    payouts_created: payoutsCreatedTotal,
    payouts_arrived: payoutsArrivedTotal,
    mercury_balance: mercuryBalance,
    stripe_available_balance: stripeAvailable,
    stripe_pending_balance: stripePending,
    open_exceptions: openExceptions,
    booking_count: 0,
    dispute_count: 0,
    compass_credit_revenue: 0,
    membership_revenue: 0,
  });

  return true;
}
