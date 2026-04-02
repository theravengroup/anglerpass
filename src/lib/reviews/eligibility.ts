import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  LANDOWNER_FAULTS,
  REVIEW_WINDOW_DAYS,
  REVIEW_EXTENSION_DAYS,
  RANKING_IMMUNITY_THRESHOLD,
} from "@/lib/validations/reviews";

// ─── Types ────────────────────────────────────────────────────────────

interface BookingForReview {
  id: string;
  property_id: string;
  angler_id: string;
  status: string;
  booking_date: string;
  booking_end_date: string | null;
  cancellation_fault: string | null;
}

interface EligibilityResult {
  eligible: boolean;
  error?: string;
  booking?: BookingForReview;
  tripCompleted: boolean;
  reviewWindowExpiresAt: Date;
}

interface WindowCheckResult {
  withinWindow: boolean;
  error?: string;
  effectiveDeadline: Date;
}

// ─── Rule 1: Booking Eligibility ─────────────────────────────────────

/**
 * Checks whether a booking is eligible for review creation.
 *
 * Rules enforced:
 * - Booking must exist
 * - Booking must belong to the requesting angler
 * - Booking must be completed OR cancelled with landowner-fault
 * - One review per booking (checked via unique constraint, but also here)
 */
export async function checkReviewEligibility(
  admin: SupabaseClient,
  bookingId: string,
  anglerUserId: string
): Promise<EligibilityResult> {
  // Fetch the booking
  const { data: booking, error: bookingError } = await admin
    .from("bookings")
    .select(
      "id, property_id, angler_id, status, booking_date, booking_end_date, cancellation_fault"
    )
    .eq("id", bookingId)
    .single();

  if (bookingError || !booking) {
    return {
      eligible: false,
      error: "Booking not found",
      tripCompleted: false,
      reviewWindowExpiresAt: new Date(),
    };
  }

  // Verify angler owns this booking
  if (booking.angler_id !== anglerUserId) {
    return {
      eligible: false,
      error: "You can only review your own bookings",
      tripCompleted: false,
      reviewWindowExpiresAt: new Date(),
    };
  }

  // Rule 1 + Rule 2: Check booking status
  const isCompleted = booking.status === "completed";
  const isCancelled = booking.status === "cancelled";
  const isLandownerFault =
    isCancelled &&
    booking.cancellation_fault !== null &&
    (LANDOWNER_FAULTS as readonly string[]).includes(
      booking.cancellation_fault
    );

  if (!isCompleted && !isLandownerFault) {
    return {
      eligible: false,
      error: isCancelled
        ? "Cancelled bookings are only reviewable when the cancellation was due to a landowner issue"
        : "Only completed bookings can be reviewed",
      tripCompleted: false,
      reviewWindowExpiresAt: new Date(),
    };
  }

  const tripCompleted = isCompleted;

  // Rule 3: Check if review already exists
  const { data: existingReview } = await admin
    .from("trip_reviews")
    .select("id")
    .eq("booking_id", bookingId)
    .maybeSingle();

  if (existingReview) {
    return {
      eligible: false,
      error: "A review already exists for this booking",
      tripCompleted,
      reviewWindowExpiresAt: new Date(),
    };
  }

  // Rule 4: Calculate review window
  const reviewWindowExpiresAt = calculateReviewWindow(booking);

  return {
    eligible: true,
    booking: booking as BookingForReview,
    tripCompleted,
    reviewWindowExpiresAt,
  };
}

// ─── Rule 4: Review Window Calculation ───────────────────────────────

/**
 * Calculates the review window expiration: last fishing day + 21 days.
 * For multi-day bookings, uses booking_end_date. For single-day, uses booking_date.
 */
export function calculateReviewWindow(booking: {
  booking_date: string;
  booking_end_date: string | null;
}): Date {
  const lastFishingDay = booking.booking_end_date ?? booking.booking_date;
  const expiresAt = new Date(lastFishingDay + "T23:59:59Z");
  expiresAt.setDate(expiresAt.getDate() + REVIEW_WINDOW_DAYS);
  return expiresAt;
}

// ─── Rule 5: Extension Logic ─────────────────────────────────────────

/**
 * Processes a review window extension request.
 *
 * Rules enforced:
 * - Only one extension allowed (extension_requested must be false)
 * - Original window must not have expired yet
 * - Sets extension_expires_at = review_window_expires_at + 7 days
 */
export async function requestExtension(
  admin: SupabaseClient,
  reviewId: string,
  anglerUserId: string
): Promise<{ success: boolean; error?: string; newDeadline?: Date }> {
  const { data: review, error } = await admin
    .from("trip_reviews")
    .select(
      "id, angler_user_id, extension_requested, review_window_expires_at, status"
    )
    .eq("id", reviewId)
    .single();

  if (error || !review) {
    return { success: false, error: "Review not found" };
  }

  if (review.angler_user_id !== anglerUserId) {
    return { success: false, error: "You can only extend your own reviews" };
  }

  if (review.status !== "draft") {
    return {
      success: false,
      error: "Extensions are only available for draft reviews",
    };
  }

  if (review.extension_requested) {
    return {
      success: false,
      error: "An extension has already been requested for this review",
    };
  }

  // Check if original window has expired
  const now = new Date();
  const windowExpires = new Date(review.review_window_expires_at);

  if (now > windowExpires) {
    return {
      success: false,
      error:
        "The review window has already expired. Extensions must be requested before the deadline.",
    };
  }

  // Grant extension: +7 days from original window
  const extensionExpires = new Date(windowExpires);
  extensionExpires.setDate(
    extensionExpires.getDate() + REVIEW_EXTENSION_DAYS
  );

  const { error: updateError } = await admin
    .from("trip_reviews")
    .update({
      extension_requested: true,
      extension_expires_at: extensionExpires.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", reviewId);

  if (updateError) {
    return { success: false, error: "Failed to grant extension" };
  }

  return { success: true, newDeadline: extensionExpires };
}

// ─── Rule 6: Active Window Check ─────────────────────────────────────

/**
 * Checks whether the current time is within the active review window.
 * Considers extension if granted.
 */
export function checkActiveWindow(review: {
  review_window_expires_at: string;
  extension_requested: boolean;
  extension_expires_at: string | null;
}): WindowCheckResult {
  const now = new Date();
  const windowExpires = new Date(review.review_window_expires_at);

  // If extension granted, use extension deadline
  const effectiveDeadline =
    review.extension_requested && review.extension_expires_at
      ? new Date(review.extension_expires_at)
      : windowExpires;

  if (now > effectiveDeadline) {
    return {
      withinWindow: false,
      error: "The review window has expired",
      effectiveDeadline,
    };
  }

  return { withinWindow: true, effectiveDeadline };
}

// ─── Rule 11: Ranking Immunity ───────────────────────────────────────

/**
 * Returns true if a property has fewer than 5 published reviews,
 * meaning it should not receive ranking penalties in search.
 */
export async function hasRankingImmunity(
  admin: SupabaseClient,
  propertyId: string
): Promise<boolean> {
  const { count, error } = await admin
    .from("trip_reviews")
    .select("id", { count: "exact", head: true })
    .eq("property_id", propertyId)
    .eq("status", "published");

  if (error) {
    // Default to immunity on error (safe fallback)
    return true;
  }

  return (count ?? 0) < RANKING_IMMUNITY_THRESHOLD;
}
