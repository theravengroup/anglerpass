import "server-only";

/**
 * Connect Transfer Verification
 *
 * Verifies that Stripe Connect transfers match booking payout records.
 * Detects transfers that don't have matching bookings, or bookings
 * that were paid out but have no transfer records.
 */

import { stripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createUntypedAdminClient } from "@/lib/supabase/untyped-admin";
import { createException } from "./reconciliation";

interface TransferVerificationResult {
  transfers_checked: number;
  bookings_verified: number;
  mismatches: number;
  missing_transfers: number;
}

/**
 * Verify Connect transfers for a date range match booking payouts.
 * Creates exceptions for any discrepancies found.
 */
export async function verifyConnectTransfers(
  startDate: Date,
  endDate: Date
): Promise<TransferVerificationResult> {
  const typedAdmin = createAdminClient();
  const untypedAdmin = createUntypedAdminClient();

  const result: TransferVerificationResult = {
    transfers_checked: 0,
    bookings_verified: 0,
    mismatches: 0,
    missing_transfers: 0,
  };

  // 1. Fetch all Stripe transfers in the date range
  const transfers: Array<{
    id: string;
    amount: number;
    metadata: Record<string, string>;
    created: number;
    destination: string;
  }> = [];

  for await (const transfer of stripe.transfers.list({
    created: {
      gte: Math.floor(startDate.getTime() / 1000),
      lte: Math.floor(endDate.getTime() / 1000),
    },
    limit: 100,
  })) {
    transfers.push({
      id: transfer.id,
      amount: transfer.amount,
      metadata: (transfer.metadata ?? {}) as Record<string, string>,
      created: transfer.created,
      destination: typeof transfer.destination === "string"
        ? transfer.destination
        : transfer.destination?.id ?? "",
    });
  }

  result.transfers_checked = transfers.length;

  // Group transfers by booking_id
  const transfersByBooking = new Map<string, typeof transfers>();
  for (const t of transfers) {
    const bookingId = t.metadata.booking_id;
    if (!bookingId) continue;
    const existing = transfersByBooking.get(bookingId) ?? [];
    existing.push(t);
    transfersByBooking.set(bookingId, existing);
  }

  // 2. Verify each booking's transfers
  const bookingIds = [...transfersByBooking.keys()];
  if (bookingIds.length > 0) {
    const { data: bookings } = await typedAdmin
      .from("bookings")
      .select("id, amount_cents, payment_status")
      .in("id", bookingIds);

    for (const booking of bookings ?? []) {
      result.bookings_verified++;
      const bookingTransfers = transfersByBooking.get(booking.id) ?? [];
      const totalTransferredCents = bookingTransfers.reduce(
        (sum, t) => sum + t.amount,
        0
      );

      // Total transferred should be <= total charged (platform keeps its fee)
      if (totalTransferredCents > (booking.amount_cents ?? 0)) {
        await createException({
          type: "amount_mismatch",
          severity: "warning",
          description: `Booking ${booking.id}: transferred $${(totalTransferredCents / 100).toFixed(2)} exceeds charged $${((booking.amount_cents ?? 0) / 100).toFixed(2)}.`,
          expected_amount: (booking.amount_cents ?? 0) / 100,
          actual_amount: totalTransferredCents / 100,
        });
        result.mismatches++;
      }
    }
  }

  // 3. Find bookings with succeeded payments that have NO transfers
  const startIso = startDate.toISOString();
  const endIso = endDate.toISOString();

  const { data: paidBookings } = await typedAdmin
    .from("bookings")
    .select("id, amount_cents, paid_at")
    .eq("payment_status", "succeeded")
    .gte("paid_at", startIso)
    .lte("paid_at", endIso);

  for (const booking of paidBookings ?? []) {
    if (!transfersByBooking.has(booking.id)) {
      // Check if there might be a transfer we didn't find (transfer_group search)
      let foundViaGroup = false;
      try {
        const groupTransfers = await stripe.transfers.list({
          transfer_group: `booking_${booking.id}`,
          limit: 1,
        });
        if (groupTransfers.data.length > 0) {
          foundViaGroup = true;
        }
      } catch {
        // If this fails, just proceed with exception
      }

      if (!foundViaGroup) {
        // Check if exception already exists
        const { data: existing } = await untypedAdmin
          .from("finance_reconciliation_exceptions")
          .select("id")
          .eq("type", "missing_transfer")
          .eq("description", `Booking ${booking.id}`)
          .eq("status", "open")
          .maybeSingle();

        if (!existing) {
          await createException({
            type: "missing_transfer",
            severity: "warning",
            description: `Booking ${booking.id}: payment succeeded ($${((booking.amount_cents ?? 0) / 100).toFixed(2)}) but no Connect transfers found.`,
            expected_amount: (booking.amount_cents ?? 0) / 100,
          });
          result.missing_transfers++;
        }
      }
    }
  }

  return result;
}
