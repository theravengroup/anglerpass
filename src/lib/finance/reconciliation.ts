import "server-only";

/**
 * Finance reconciliation engine.
 *
 * Matches Stripe payouts to Mercury deposits by amount + date window.
 * Creates exceptions for unmatched or anomalous items.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { toDateString } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────

interface StripePayout {
  id: string;
  stripe_payout_id: string;
  amount: number;
  arrival_date: string;
  status: string;
  paid_at: string | null;
  reconciliation_status: string;
}

interface MercuryTxn {
  id: string;
  mercury_txn_id: string;
  amount: number;
  posted_at: string | null;
  is_stripe_deposit: boolean;
  reconciliation_status: string;
}

// ─── Constants ──────────────────────────────────────────────────────

/** How many business days to allow for payout-to-deposit matching. */
const MATCH_WINDOW_DAYS = 2;

/** After this many business days, escalate to critical exception. */
const ESCALATION_DAYS = 5;

// ─── Matching ───────────────────────────────────────────────────────

/**
 * Attempt to match a Stripe payout to a Mercury deposit.
 * Returns the matched Mercury transaction ID, or null.
 */
export async function attemptPayoutMatch(
  payoutId: string
): Promise<string | null> {
  const db = createAdminClient();

  const { data: payout } = await db
    .from("finance_stripe_payouts")
    .select("id, stripe_payout_id, amount, arrival_date, status")
    .eq("id", payoutId)
    .single();

  if (!payout) return null;

  const p = payout as StripePayout;

  // Search Mercury transactions for a matching Stripe deposit
  const windowStart = addBusinessDays(new Date(p.arrival_date), -MATCH_WINDOW_DAYS);
  const windowEnd = addBusinessDays(new Date(p.arrival_date), MATCH_WINDOW_DAYS);

  const { data: candidates } = await db
    .from("finance_mercury_transactions")
    .select("id, mercury_txn_id, amount, posted_at, reconciliation_status")
    .eq("is_stripe_deposit", true)
    .eq("reconciliation_status", "pending")
    .gte("posted_at", windowStart.toISOString())
    .lte("posted_at", windowEnd.toISOString());

  const matches = ((candidates ?? []) as MercuryTxn[]).filter(
    (txn) => Math.abs(txn.amount - p.amount) < 0.01
  );

  if (matches.length === 1) {
    const match = matches[0];
    const now = new Date().toISOString();

    // Link payout -> mercury txn
    await db
      .from("finance_stripe_payouts")
      .update({
        reconciliation_status: "matched",
        matched_mercury_txn_id: match.id,
        matched_at: now,
      })
      .eq("id", p.id);

    // Link mercury txn -> payout
    await db
      .from("finance_mercury_transactions")
      .update({
        reconciliation_status: "matched",
        matched_payout_id: p.id,
        matched_at: now,
      })
      .eq("id", match.id);

    return match.id;
  }

  if (matches.length > 1) {
    // Multiple matches — create exception for human review
    await createException({
      type: "amount_mismatch",
      severity: "warning",
      stripe_payout_id: p.stripe_payout_id,
      expected_amount: p.amount,
      description: `Payout ${p.stripe_payout_id} ($${p.amount}) has ${matches.length} potential Mercury matches. Manual review required.`,
    });
  }

  return null;
}

/**
 * Attempt to match a Mercury deposit to a pending Stripe payout.
 * Called when a new Mercury transaction arrives via webhook.
 */
export async function attemptDepositMatch(
  mercuryTxnId: string
): Promise<string | null> {
  const db = createAdminClient();

  const { data: txn } = await db
    .from("finance_mercury_transactions")
    .select("id, mercury_txn_id, amount, posted_at")
    .eq("id", mercuryTxnId)
    .single();

  if (!txn) return null;
  const t = txn as MercuryTxn;

  const postedDate = t.posted_at ? new Date(t.posted_at) : new Date();
  const windowStart = addBusinessDays(postedDate, -MATCH_WINDOW_DAYS);
  const windowEnd = addBusinessDays(postedDate, MATCH_WINDOW_DAYS);

  const { data: candidates } = await db
    .from("finance_stripe_payouts")
    .select("id, stripe_payout_id, amount, arrival_date")
    .eq("reconciliation_status", "pending")
    .gte("arrival_date", toDateString(windowStart))
    .lte("arrival_date", toDateString(windowEnd));

  const matches = ((candidates ?? []) as StripePayout[]).filter(
    (p) => Math.abs(p.amount - t.amount) < 0.01
  );

  if (matches.length === 1) {
    const match = matches[0];
    const now = new Date().toISOString();

    await db
      .from("finance_stripe_payouts")
      .update({
        reconciliation_status: "matched",
        matched_mercury_txn_id: mercuryTxnId,
        matched_at: now,
      })
      .eq("id", match.id);

    await db
      .from("finance_mercury_transactions")
      .update({
        reconciliation_status: "matched",
        matched_payout_id: match.id,
        matched_at: now,
      })
      .eq("id", mercuryTxnId);

    return match.id;
  }

  return null;
}

// ─── Daily Sweep ────────────────────────────────────────────────────

/**
 * Daily reconciliation sweep.
 * Re-attempts matching for pending items and escalates old ones.
 */
export async function runDailySweep(): Promise<{
  rematched: number;
  exceptions_created: number;
}> {
  const db = createAdminClient();
  let rematched = 0;
  let exceptions_created = 0;

  // 1. Re-attempt unmatched payouts older than 3 business days
  const threeDaysAgo = addBusinessDays(new Date(), -3);
  const { data: pendingPayouts } = await db
    .from("finance_stripe_payouts")
    .select("id, stripe_payout_id, amount, paid_at, arrival_date")
    .eq("reconciliation_status", "pending")
    .lt("paid_at", threeDaysAgo.toISOString());

  for (const payout of (pendingPayouts ?? []) as StripePayout[]) {
    const matched = await attemptPayoutMatch(payout.id);
    if (matched) {
      rematched++;
    } else {
      // Check if past escalation threshold
      const paidAt = payout.paid_at ? new Date(payout.paid_at) : new Date(payout.arrival_date);
      const escalationDate = addBusinessDays(paidAt, ESCALATION_DAYS);

      if (new Date() > escalationDate) {
        // Check if exception already exists
        const { data: existing } = await db
          .from("finance_reconciliation_exceptions")
          .select("id")
          .eq("stripe_payout_id", payout.stripe_payout_id)
          .eq("type", "unmatched_payout")
          .eq("status", "open")
          .maybeSingle();

        if (!existing) {
          await createException({
            type: "unmatched_payout",
            severity: "critical",
            stripe_payout_id: payout.stripe_payout_id,
            expected_amount: payout.amount,
            description: `Payout ${payout.stripe_payout_id} ($${payout.amount}) has been unmatched for ${ESCALATION_DAYS}+ business days.`,
          });
          exceptions_created++;
        }
      }
    }
  }

  // 2. Flag unmatched Mercury Stripe deposits older than 3 business days
  const { data: unmatchedDeposits } = await db
    .from("finance_mercury_transactions")
    .select("id, mercury_txn_id, amount, posted_at")
    .eq("is_stripe_deposit", true)
    .eq("reconciliation_status", "pending")
    .lt("posted_at", threeDaysAgo.toISOString());

  for (const txn of (unmatchedDeposits ?? []) as MercuryTxn[]) {
    const matched = await attemptDepositMatch(txn.id);
    if (matched) {
      rematched++;
    } else {
      const { data: existing } = await db
        .from("finance_reconciliation_exceptions")
        .select("id")
        .eq("mercury_txn_id", txn.mercury_txn_id)
        .eq("type", "unmatched_deposit")
        .eq("status", "open")
        .maybeSingle();

      if (!existing) {
        await createException({
          type: "unmatched_deposit",
          severity: "warning",
          mercury_txn_id: txn.mercury_txn_id,
          actual_amount: txn.amount,
          description: `Mercury Stripe deposit ${txn.mercury_txn_id} ($${txn.amount}) has no matching Stripe payout.`,
        });
        exceptions_created++;
      }
    }
  }

  return { rematched, exceptions_created };
}

// ─── Exception Helpers ──────────────────────────────────────────────

interface CreateExceptionOpts {
  type: string;
  severity: string;
  stripe_payout_id?: string;
  mercury_txn_id?: string;
  expected_amount?: number;
  actual_amount?: number;
  description: string;
}

export async function createException(opts: CreateExceptionOpts) {
  const db = createAdminClient();
  await db.from("finance_reconciliation_exceptions").insert({
    type: opts.type,
    severity: opts.severity,
    stripe_payout_id: opts.stripe_payout_id ?? null,
    mercury_txn_id: opts.mercury_txn_id ?? null,
    expected_amount: opts.expected_amount ?? null,
    actual_amount: opts.actual_amount ?? null,
    description: opts.description,
    status: "open",
  });
}

// ─── Sync Status ────────────────────────────────────────────────────

export async function updateSyncStatus(
  system: string,
  status: "success" | "failed" | "partial",
  recordsSynced: number,
  error?: string
) {
  const db = createAdminClient();
  await db
    .from("finance_sync_status")
    .update({
      last_sync_at: new Date().toISOString(),
      last_sync_status: status,
      last_error: error ?? null,
      records_synced: recordsSynced,
    })
    .eq("system", system);
}

// ─── Date Helpers ───────────────────────────────────────────────────

/** Add business days (skip weekends) to a date. Negative values go backwards. */
function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  const direction = days >= 0 ? 1 : -1;
  let remaining = Math.abs(days);

  while (remaining > 0) {
    result.setDate(result.getDate() + direction);
    const dayOfWeek = result.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      remaining--;
    }
  }

  return result;
}
