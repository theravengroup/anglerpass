/**
 * Booking Cancellation Policy — Graduated Refund Tiers
 *
 * - 100% refund if cancelled more than 7 days before the booking.
 * - 75% refund if cancelled 3–7 days before the booking.
 * - 50% refund if cancelled 24 hours – 3 days before the booking.
 * - No refund if cancelled less than 24 hours before the booking.
 * - $15 late cancellation fee for cancellations within 72 hours.
 * - Members must cancel bookings themselves via the platform.
 */

import {
  GRADUATED_REFUND_TIERS,
  LATE_CANCEL_FEE,
  LATE_CANCEL_WINDOW_HOURS,
  getRefundPercentage,
} from "@/lib/constants/booking-limits";

/**
 * @deprecated Use GRADUATED_REFUND_TIERS from booking-limits.ts
 * Kept for backwards compatibility with existing code that imports these.
 */
export const FULL_REFUND_HOURS = 48;

/** @deprecated Use GRADUATED_REFUND_TIERS from booking-limits.ts */
export const REFUND_TIERS = {
  FULL: { percentage: 100, label: "Full refund" },
  PARTIAL: { percentage: 50, label: "50% refund" },
  NONE: { percentage: 0, label: "No refund" },
} as const;

export interface RefundCalculation {
  /** Refund percentage: 0, 50, 75, or 100 */
  percentage: number;
  /** Dollar amount to refund */
  amount: number;
  /** Human-readable label */
  label: string;
  /** Hours remaining until the booking */
  hoursUntilBooking: number;
  /** Late cancellation fee (flat $15 if within 72 hours) */
  lateCancelFee: number;
}

/**
 * Calculate the refund amount for a booking cancellation.
 *
 * @param bookingDate — The date of the booking (YYYY-MM-DD or Date)
 * @param totalAmount — The total amount charged for the booking
 * @param now — Current time (defaults to now, injectable for testing)
 */
export function calculateRefund(
  bookingDate: string | Date,
  totalAmount: number,
  now: Date = new Date()
): RefundCalculation {
  // Parse the booking date as the start of that day in local time
  const bookingStart =
    typeof bookingDate === "string"
      ? new Date(bookingDate + "T00:00:00")
      : bookingDate;

  const msUntilBooking = bookingStart.getTime() - now.getTime();
  const hoursUntilBooking = msUntilBooking / (1000 * 60 * 60);

  // Find matching refund tier
  const percentage = getRefundPercentage(Math.max(0, hoursUntilBooking));

  // Find label from tiers
  const tier = GRADUATED_REFUND_TIERS.find(
    (t) => hoursUntilBooking >= t.minHours
  );
  const label = tier?.label ?? "No refund";

  // Calculate refund amount
  const amount =
    percentage > 0
      ? Math.round(totalAmount * (percentage / 100) * 100) / 100
      : 0;

  // Late cancel fee applies within 72 hours but only if booking hasn't started
  const lateCancelFee =
    hoursUntilBooking > 0 && hoursUntilBooking < LATE_CANCEL_WINDOW_HOURS
      ? LATE_CANCEL_FEE
      : 0;

  return {
    percentage,
    amount,
    label,
    hoursUntilBooking: Math.max(0, hoursUntilBooking),
    lateCancelFee,
  };
}

/**
 * Human-readable cancellation policy text for display in the UI.
 */
export const CANCELLATION_POLICY_TEXT = [
  "Full refund if cancelled more than 7 days before the reservation date.",
  "75% refund if cancelled 3–7 days before the reservation date.",
  "50% refund if cancelled 24 hours – 3 days before the reservation date.",
  "No refund if cancelled less than 24 hours before the reservation.",
  "$15 late cancellation processing fee for cancellations within 72 hours.",
  "Members must cancel bookings themselves via the platform.",
] as const;
