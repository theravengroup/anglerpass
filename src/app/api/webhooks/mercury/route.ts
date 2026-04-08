import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { createUntypedAdminClient } from "@/lib/supabase/untyped-admin";
import { isStripeDeposit } from "@/lib/mercury/client";
import {
  attemptDepositMatch,
  updateSyncStatus,
} from "@/lib/finance/reconciliation";

/**
 * Mercury webhook handler.
 *
 * Receives transaction.created and *.balance.updated events.
 * Verifies HMAC-SHA256 signature from Mercury-Signature header.
 */

// ─── Signature Verification ────────────────────────────────────────

function verifyMercurySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  try {
    return timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expected, "hex")
    );
  } catch {
    return false;
  }
}

// ─── Event Handlers ────────────────────────────────────────────────

async function handleTransactionCreated(
  transaction: Record<string, unknown>
) {
  const db = createUntypedAdminClient();

  const txnId = transaction.id as string;
  const accountId = transaction.accountId as string;
  const amount = transaction.amount as number;
  const counterpartyName =
    (transaction.counterpartyName as string) ?? null;
  const bankDescription =
    (transaction.bankDescription as string) ?? null;
  const postedAt = transaction.postedAt
    ? (transaction.postedAt as string)
    : null;

  const txnStatus = (transaction.status as string) ?? "pending";
  const isStripe = isStripeDeposit({
    id: txnId,
    accountId,
    amount,
    status: txnStatus as "pending" | "sent" | "cancelled" | "failed" | "reversed",
    counterpartyName,
    bankDescription,
    externalMemo: (transaction.externalMemo as string) ?? null,
    note: (transaction.note as string) ?? null,
    createdAt: (transaction.createdAt as string) ?? new Date().toISOString(),
    postedAt,
    merchantCategoryCode: null,
  });

  // Upsert transaction
  const { data: existing } = await db
    .from("finance_mercury_transactions")
    .select("id")
    .eq("mercury_txn_id", txnId)
    .maybeSingle();

  if (existing) {
    await db
      .from("finance_mercury_transactions")
      .update({
        amount,
        status: (transaction.status as string) ?? "pending",
        counterparty_name: counterpartyName,
        bank_description: bankDescription,
        external_memo: (transaction.externalMemo as string) ?? null,
        note: (transaction.note as string) ?? null,
        posted_at: postedAt,
        mercury_category:
          (transaction.merchantCategoryCode as string) ?? null,
        is_stripe_deposit: isStripe,
        synced_at: new Date().toISOString(),
      })
      .eq("mercury_txn_id", txnId);
  } else {
    await db.from("finance_mercury_transactions").insert({
      mercury_txn_id: txnId,
      mercury_account_id: accountId,
      amount,
      status: (transaction.status as string) ?? "pending",
      counterparty_name: counterpartyName,
      bank_description: bankDescription,
      external_memo: (transaction.externalMemo as string) ?? null,
      note: (transaction.note as string) ?? null,
      created_at:
        (transaction.createdAt as string) ?? new Date().toISOString(),
      posted_at: postedAt,
      mercury_category:
        (transaction.merchantCategoryCode as string) ?? null,
      is_stripe_deposit: isStripe,
      reconciliation_status: "pending",
    });
  }

  await updateSyncStatus("mercury_transactions", "success", 1);

  // If this is a Stripe deposit, try to match it to a pending payout
  if (isStripe) {
    const { data: inserted } = await db
      .from("finance_mercury_transactions")
      .select("id")
      .eq("mercury_txn_id", txnId)
      .single();

    if (inserted) {
      await attemptDepositMatch((inserted as { id: string }).id);
    }
  }
}

async function handleBalanceUpdated(
  data: Record<string, unknown>
) {
  const db = createUntypedAdminClient();
  const accountId = data.accountId as string;
  const availableBalance = (data.availableBalance as number) ?? 0;
  const currentBalance = (data.currentBalance as number) ?? 0;

  // Upsert account balance
  const { data: existing } = await db
    .from("finance_mercury_accounts")
    .select("id")
    .eq("mercury_account_id", accountId)
    .maybeSingle();

  if (existing) {
    await db
      .from("finance_mercury_accounts")
      .update({
        available_balance: availableBalance,
        current_balance: currentBalance,
        last_snapshot_at: new Date().toISOString(),
      })
      .eq("mercury_account_id", accountId);
  } else {
    await db.from("finance_mercury_accounts").insert({
      mercury_account_id: accountId,
      name: (data.name as string) ?? "Unknown",
      account_number_last4:
        (data.accountNumber as string)?.slice(-4) ?? null,
      kind: (data.type as string) ?? "checking",
      available_balance: availableBalance,
      current_balance: currentBalance,
    });
  }

  await updateSyncStatus("mercury_accounts", "success", 1);
}

// ─── Main Handler ──────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const secret = process.env.MERCURY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[mercury-webhook] Missing MERCURY_WEBHOOK_SECRET");
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 }
    );
  }

  const signature = request.headers.get("mercury-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing signature" },
      { status: 400 }
    );
  }

  const body = await request.text();

  if (!verifyMercurySignature(body, signature, secret)) {
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  const event = JSON.parse(body);
  const eventType = event.type as string;

  try {
    if (eventType === "transaction.created" || eventType === "transaction.updated") {
      await handleTransactionCreated(event.data);
    } else if (eventType.endsWith(".balance.updated")) {
      await handleBalanceUpdated(event.data);
    } else {
      console.info(`[mercury-webhook] Unhandled event type: ${eventType}`);
    }
  } catch (err) {
    console.error(`[mercury-webhook] Error processing ${eventType}:`, err);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
