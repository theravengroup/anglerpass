import "server-only";

/**
 * Stripe payout ingestion and balance transaction fetching.
 *
 * Called from the Stripe webhook handler when payout events fire.
 * Uses the Stripe SDK to fetch balance transactions for itemization.
 */

import { stripe } from "@/lib/stripe/server";
import { createUntypedAdminClient } from "@/lib/supabase/untyped-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  attemptPayoutMatch,
  createException,
  updateSyncStatus,
} from "./reconciliation";

// ─── Payout Ingestion ───────────────────────────────────────────────

/**
 * Record a new Stripe payout and fetch its balance transactions.
 * Called on payout.created webhook.
 */
export async function ingestPayout(
  payoutObj: Record<string, unknown>
): Promise<void> {
  const db = createUntypedAdminClient();

  const payoutId = payoutObj.id as string;
  const amount = (payoutObj.amount as number) / 100; // Stripe sends cents
  const arrivalDate = payoutObj.arrival_date
    ? new Date((payoutObj.arrival_date as number) * 1000)
        .toISOString()
        .split("T")[0]
    : null;

  // Upsert payout record
  const { data: existing } = await db
    .from("finance_stripe_payouts")
    .select("id")
    .eq("stripe_payout_id", payoutId)
    .maybeSingle();

  if (existing) {
    await db
      .from("finance_stripe_payouts")
      .update({
        amount,
        currency: (payoutObj.currency as string) ?? "usd",
        status: payoutObj.status as string,
        arrival_date: arrivalDate,
        method: (payoutObj.method as string) ?? "standard",
        description: (payoutObj.description as string) ?? null,
        balance_transaction_id:
          (payoutObj.balance_transaction as string) ?? null,
        metadata: (payoutObj.metadata as Record<string, unknown>) ?? {},
        synced_at: new Date().toISOString(),
      })
      .eq("stripe_payout_id", payoutId);
  } else {
    await db.from("finance_stripe_payouts").insert({
      stripe_payout_id: payoutId,
      amount,
      currency: (payoutObj.currency as string) ?? "usd",
      status: payoutObj.status as string,
      arrival_date: arrivalDate,
      created_at: payoutObj.created
        ? new Date((payoutObj.created as number) * 1000).toISOString()
        : new Date().toISOString(),
      method: (payoutObj.method as string) ?? "standard",
      description: (payoutObj.description as string) ?? null,
      balance_transaction_id:
        (payoutObj.balance_transaction as string) ?? null,
      metadata: (payoutObj.metadata as Record<string, unknown>) ?? {},
      reconciliation_status: "pending",
    });
  }

  // Fetch and store balance transactions for this payout
  await fetchBalanceTransactions(payoutId);
}

/**
 * Update payout status when it's been paid (funds sent to bank).
 * Called on payout.paid webhook. Attempts Mercury match.
 */
export async function markPayoutPaid(
  payoutObj: Record<string, unknown>
): Promise<void> {
  const db = createUntypedAdminClient();
  const payoutId = payoutObj.id as string;

  const { data: payout } = await db
    .from("finance_stripe_payouts")
    .select("id")
    .eq("stripe_payout_id", payoutId)
    .maybeSingle();

  if (!payout) {
    // Payout wasn't ingested yet — ingest first
    await ingestPayout(payoutObj);
  }

  const now = new Date().toISOString();

  await db
    .from("finance_stripe_payouts")
    .update({
      status: "paid",
      paid_at: now,
      synced_at: now,
    })
    .eq("stripe_payout_id", payoutId);

  // Attempt to match with Mercury deposit
  const { data: updated } = await db
    .from("finance_stripe_payouts")
    .select("id")
    .eq("stripe_payout_id", payoutId)
    .single();

  if (updated) {
    await attemptPayoutMatch((updated as { id: string }).id);
  }
}

/**
 * Record a payout failure. Creates a critical exception.
 * Called on payout.failed webhook.
 */
export async function markPayoutFailed(
  payoutObj: Record<string, unknown>
): Promise<void> {
  const db = createUntypedAdminClient();
  const payoutId = payoutObj.id as string;
  const amount = (payoutObj.amount as number) / 100;
  const now = new Date().toISOString();

  const { data: payout } = await db
    .from("finance_stripe_payouts")
    .select("id")
    .eq("stripe_payout_id", payoutId)
    .maybeSingle();

  if (!payout) {
    await ingestPayout(payoutObj);
  }

  const failureCode = (payoutObj.failure_code as string) ?? null;
  const failureMessage = (payoutObj.failure_message as string) ?? null;

  await db
    .from("finance_stripe_payouts")
    .update({
      status: "failed",
      failed_at: now,
      failure_code: failureCode,
      failure_message: failureMessage,
      reconciliation_status: "exception",
      synced_at: now,
    })
    .eq("stripe_payout_id", payoutId);

  await createException({
    type: "payout_failed",
    severity: "critical",
    stripe_payout_id: payoutId,
    expected_amount: amount,
    description: `Payout ${payoutId} ($${amount}) failed: ${failureMessage ?? failureCode ?? "unknown reason"}.`,
  });

  // Audit log
  const typedAdmin = createAdminClient();
  await typedAdmin.from("audit_log").insert({
    action: "finance.payout_failed",
    entity_type: "finance_stripe_payout",
    entity_id: payoutId,
    new_data: {
      amount,
      failure_code: failureCode,
      failure_message: failureMessage,
    },
  });
}

// ─── Balance Transaction Fetching ───────────────────────────────────

/**
 * Fetch all balance transactions for a payout and store them.
 * Links charges to bookings where possible.
 */
async function fetchBalanceTransactions(
  stripePayoutId: string
): Promise<void> {
  const db = createUntypedAdminClient();
  const typedAdmin = createAdminClient();

  let itemCount = 0;
  let grossAmount = 0;
  let feeAmount = 0;
  let refundAmount = 0;

  try {
    // Auto-paginate through all balance transactions for this payout
    for await (const bt of stripe.balanceTransactions.list({
      payout: stripePayoutId,
      limit: 100,
    })) {
      const amount = bt.amount / 100;
      const fee = bt.fee / 100;
      const net = bt.net / 100;

      // Attempt to link to a booking
      let bookingId: string | null = null;
      if (bt.source && typeof bt.source === "string" && bt.source.startsWith("ch_")) {
        // Try to find booking by charge -> payment intent metadata
        // We match on the payment_intent_id since bookings store that
        const { data: booking } = await typedAdmin
          .from("bookings")
          .select("id")
          .eq("stripe_payment_intent_id", bt.source)
          .maybeSingle();
        bookingId = booking?.id ?? null;
      }

      // Upsert balance transaction
      const { data: existing } = await db
        .from("finance_stripe_balance_txns")
        .select("id")
        .eq("stripe_balance_txn_id", bt.id)
        .maybeSingle();

      if (!existing) {
        await db.from("finance_stripe_balance_txns").insert({
          stripe_balance_txn_id: bt.id,
          stripe_payout_id: stripePayoutId,
          type: bt.type,
          amount,
          fee,
          net,
          currency: bt.currency,
          source_id: typeof bt.source === "string" ? bt.source : null,
          source_type: bt.type,
          description: bt.description ?? null,
          available_on: bt.available_on
            ? new Date(bt.available_on * 1000).toISOString()
            : null,
          created_at: new Date(bt.created * 1000).toISOString(),
          reporting_category: bt.reporting_category ?? null,
          booking_id: bookingId,
        });
      }

      itemCount++;
      if (bt.type === "charge") {
        grossAmount += amount;
        feeAmount += fee;
      } else if (bt.type === "refund") {
        refundAmount += Math.abs(amount);
      }
    }

    // Update payout with aggregated totals
    await db
      .from("finance_stripe_payouts")
      .update({
        item_count: itemCount,
        gross_amount: grossAmount,
        fee_amount: feeAmount,
        refund_amount: refundAmount,
      })
      .eq("stripe_payout_id", stripePayoutId);

    await updateSyncStatus("stripe_balance_txns", "success", itemCount);
  } catch (err) {
    console.error(
      `[finance] Failed to fetch balance transactions for ${stripePayoutId}:`,
      err
    );
    await updateSyncStatus(
      "stripe_balance_txns",
      "failed",
      itemCount,
      err instanceof Error ? err.message : "Unknown error"
    );
  }
}
