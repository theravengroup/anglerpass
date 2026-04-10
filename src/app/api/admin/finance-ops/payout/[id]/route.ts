import { requireAuth, jsonOk, jsonError } from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest } from "next/server";

/**
 * GET /api/admin/finance-ops/payout/[id]
 *
 * Payout drill-down: returns full payout details, all balance transactions,
 * and linked bookings for a specific Stripe payout.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (!auth) return jsonError("Unauthorized", 401);

  const { id: payoutId } = await params;
  const db = createAdminClient();
  const typedAdmin = createAdminClient();

  // Fetch payout
  const { data: payout, error: payoutError } = await db
    .from("finance_stripe_payouts")
    .select("*")
    .eq("id", payoutId)
    .single();

  if (payoutError || !payout) {
    return jsonError("Payout not found", 404);
  }

  const p = payout as { stripe_payout_id: string; matched_mercury_txn_id: string | null };

  // Fetch balance transactions for this payout
  const { data: balanceTxns } = await db
    .from("finance_stripe_balance_txns")
    .select("*")
    .eq("stripe_payout_id", p.stripe_payout_id)
    .order("created_at", { ascending: false });

  // Fetch linked bookings
  const bookingIds = ((balanceTxns ?? []) as Array<{ booking_id: string | null }>)
    .map((bt) => bt.booking_id)
    .filter((id): id is string => id !== null);

  let bookings: Array<Record<string, unknown>> = [];
  if (bookingIds.length > 0) {
    const uniqueIds = [...new Set(bookingIds)];
    const { data } = await typedAdmin
      .from("bookings")
      .select(
        "id, booking_date, party_size, amount_cents, payment_status, angler_id, property_id"
      )
      .in("id", uniqueIds);
    bookings = (data ?? []) as Array<Record<string, unknown>>;
  }

  // Fetch matched Mercury transaction if any
  let mercuryTxn = null;
  if (p.matched_mercury_txn_id) {
    const { data } = await db
      .from("finance_mercury_transactions")
      .select("*")
      .eq("id", p.matched_mercury_txn_id)
      .single();
    mercuryTxn = data;
  }

  // Aggregate balance txn breakdown
  const txns = (balanceTxns ?? []) as Array<{
    type: string;
    amount: number;
    fee: number;
    net: number;
  }>;

  const breakdown = {
    charges: txns
      .filter((t) => t.type === "charge")
      .reduce((sum, t) => sum + t.amount, 0),
    fees: txns
      .filter((t) => t.type === "charge")
      .reduce((sum, t) => sum + t.fee, 0),
    refunds: txns
      .filter((t) => t.type === "refund")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0),
    transfers: txns
      .filter((t) => t.type === "transfer")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0),
    adjustments: txns
      .filter((t) => !["charge", "refund", "transfer", "payout"].includes(t.type))
      .reduce((sum, t) => sum + t.net, 0),
  };

  return jsonOk({
    payout,
    balance_transactions: balanceTxns ?? [],
    bookings,
    mercury_transaction: mercuryTxn,
    breakdown,
  });
}
