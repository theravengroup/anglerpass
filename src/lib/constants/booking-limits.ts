/**
 * Booking abuse prevention constants.
 * Standing tiers, concurrent caps, cancellation thresholds, and refund tiers.
 */

// ─── Standing Tiers ────────────────────────────────────────────────

export type BookingStanding = "good" | "warned" | "restricted" | "suspended";

export const STANDING_CONFIG: Record<
  BookingStanding,
  { label: string; concurrentCap: number; color: string }
> = {
  good: { label: "Good Standing", concurrentCap: 6, color: "forest" },
  warned: { label: "Warned", concurrentCap: 4, color: "amber-600" },
  restricted: { label: "Restricted", concurrentCap: 2, color: "red-500" },
  suspended: { label: "Suspended", concurrentCap: 0, color: "red-700" },
};

export const DEFAULT_CONCURRENT_CAP = 6;
export const STAFF_CONCURRENT_CAP = 10;

// ─── Cancellation Score Thresholds ─────────────────────────────────

export const CANCELLATION_THRESHOLDS = {
  /** Score >= this → "warned" standing */
  WARN: 0.3,
  /** Score >= this → "restricted" standing */
  RESTRICT: 0.5,
  /** Score >= this → "suspended" standing */
  SUSPEND: 0.75,
  /** Minimum bookings in 90 days before scoring kicks in */
  MIN_BOOKINGS: 3,
} as const;

export const CANCELLATION_SCORE_WINDOW_DAYS = 90;

// ─── Graduated Refund Tiers ────────────────────────────────────────

export interface RefundTier {
  minHours: number;
  percentage: number;
  label: string;
}

/** Ordered by minHours descending — first match wins */
export const GRADUATED_REFUND_TIERS: RefundTier[] = [
  { minHours: 168, percentage: 100, label: "More than 7 days before" },
  { minHours: 72, percentage: 75, label: "3–7 days before" },
  { minHours: 24, percentage: 50, label: "24 hours – 3 days before" },
  { minHours: 0, percentage: 0, label: "Less than 24 hours before" },
];

// ─── Late-Cancel Fee ───────────────────────────────────────────────

/** Flat fee charged for cancellations within the late-cancel window */
export const LATE_CANCEL_FEE = 15;

/** Late-cancel window in hours — fee applies if cancelling within this window */
export const LATE_CANCEL_WINDOW_HOURS = 72;

// ─── Helpers ───────────────────────────────────────────────────────

/**
 * Determine standing from a cancellation score.
 * Returns 'good' if score is below warn threshold.
 */
export function standingFromScore(score: number): BookingStanding {
  if (score >= CANCELLATION_THRESHOLDS.SUSPEND) return "suspended";
  if (score >= CANCELLATION_THRESHOLDS.RESTRICT) return "restricted";
  if (score >= CANCELLATION_THRESHOLDS.WARN) return "warned";
  return "good";
}

/**
 * Get the refund percentage for a given number of hours before booking.
 */
export function getRefundPercentage(hoursUntilBooking: number): number {
  for (const tier of GRADUATED_REFUND_TIERS) {
    if (hoursUntilBooking >= tier.minHours) {
      return tier.percentage;
    }
  }
  return 0;
}
