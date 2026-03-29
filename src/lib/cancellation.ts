/**
 * Booking Cancellation Policy
 *
 * - Full refund (100%) if cancelled more than 48 hours before the booking date.
 * - Half refund (50%) if cancelled within 48 hours but before the day of the booking.
 * - No refund (0%) if cancelled on the day of the booking.
 * - Members must cancel bookings themselves via the platform.
 */

/** Hours before booking that qualifies for a full refund. */
export const FULL_REFUND_HOURS = 48;

/** Refund tiers */
export const REFUND_TIERS = {
  FULL: { percentage: 100, label: "Full refund" },
  PARTIAL: { percentage: 50, label: "50% refund" },
  NONE: { percentage: 0, label: "No refund" },
} as const;

export interface RefundCalculation {
  /** Refund percentage: 0, 50, or 100 */
  percentage: number;
  /** Dollar amount to refund */
  amount: number;
  /** Human-readable label */
  label: string;
  /** Hours remaining until the booking */
  hoursUntilBooking: number;
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

  // Day of the booking (or past): no refund
  if (hoursUntilBooking <= 0) {
    return {
      percentage: REFUND_TIERS.NONE.percentage,
      amount: 0,
      label: REFUND_TIERS.NONE.label,
      hoursUntilBooking: Math.max(0, hoursUntilBooking),
    };
  }

  // Within 48 hours but before the day: 50% refund
  if (hoursUntilBooking < FULL_REFUND_HOURS) {
    const amount = Math.round(totalAmount * 0.5 * 100) / 100;
    return {
      percentage: REFUND_TIERS.PARTIAL.percentage,
      amount,
      label: REFUND_TIERS.PARTIAL.label,
      hoursUntilBooking,
    };
  }

  // More than 48 hours: full refund
  return {
    percentage: REFUND_TIERS.FULL.percentage,
    amount: totalAmount,
    label: REFUND_TIERS.FULL.label,
    hoursUntilBooking,
  };
}

/**
 * Human-readable cancellation policy text for display in the UI.
 */
export const CANCELLATION_POLICY_TEXT = [
  "Full refund if cancelled more than 48 hours before the reservation date.",
  "50% refund if cancelled within 48 hours, but before the day of the reservation.",
  "No refund if cancelled on the day of the reservation.",
  "Members must cancel bookings themselves via the platform.",
] as const;
