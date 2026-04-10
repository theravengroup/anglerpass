import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  DEFAULT_CONCURRENT_CAP,
  CANCELLATION_THRESHOLDS,
  standingFromScore,
  type BookingStanding,
} from "@/lib/constants/booking-limits";
import {
  notifyBookingStandingChanged,
  notifyBookingAbuseFlagged,
} from "@/lib/notifications";
import { AuditAction, auditLog } from "@/lib/permissions/audit";
import { toDateString } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────

export interface StandingRecord {
  standing: BookingStanding;
  concurrent_cap: number;
  cancellation_score: number;
}

export interface ConcurrentCheck {
  allowed: boolean;
  current: number;
  cap: number;
}

export interface PropertyLimitCheck {
  allowed: boolean;
  reason?: string;
}

// ─── Standing ──────────────────────────────────────────────────────

/**
 * Get or create the booking standing for a user.
 * Returns default 'good' standing if no row exists.
 */
export async function getBookingStanding(
  userId: string
): Promise<StandingRecord> {
  const db = createAdminClient();

  const { data } = await db
    .from("booking_standing")
    .select("standing, concurrent_cap, cancellation_score")
    .eq("user_id", userId)
    .maybeSingle();

  if (data) {
    return data as StandingRecord;
  }

  // Auto-create default row
  const { data: created } = await db
    .from("booking_standing")
    .insert({
      user_id: userId,
      standing: "good",
      concurrent_cap: DEFAULT_CONCURRENT_CAP,
      cancellation_score: 0,
    })
    .select("standing, concurrent_cap, cancellation_score")
    .single();

  return (created as StandingRecord) ?? {
    standing: "good",
    concurrent_cap: DEFAULT_CONCURRENT_CAP,
    cancellation_score: 0,
  };
}

// ─── Concurrent Limit ──────────────────────────────────────────────

/**
 * Count active (future confirmed/pending) logical bookings for a user.
 * Multi-day bookings count as one.
 */
export async function getActiveBookingCount(
  userId: string
): Promise<number> {
  const db = createAdminClient();

  // Single-day bookings (no group)
  const { count: singleCount } = await db
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("angler_id", userId)
    .in("status", ["confirmed", "pending"])
    .gte("booking_date", toDateString())
    .is("booking_group_id", null);

  // Multi-day groups: count distinct groups (use primary record)
  const { data: groups } = await db
    .from("bookings")
    .select("booking_group_id")
    .eq("angler_id", userId)
    .in("status", ["confirmed", "pending"])
    .gte("booking_date", toDateString())
    .not("booking_group_id", "is", null);

  // Deduplicate group IDs
  const uniqueGroups = new Set(
    ((groups ?? []) as { booking_group_id: string }[]).map(
      (g) => g.booking_group_id
    )
  );

  return (singleCount ?? 0) + uniqueGroups.size;
}

/**
 * Check if user can create another booking (concurrent limit).
 */
export async function checkConcurrentLimit(
  userId: string
): Promise<ConcurrentCheck> {
  const [standing, current] = await Promise.all([
    getBookingStanding(userId),
    getActiveBookingCount(userId),
  ]);

  return {
    allowed: current < standing.concurrent_cap,
    current,
    cap: standing.concurrent_cap,
  };
}

// ─── Property Limits ───────────────────────────────────────────────

/**
 * Check property-level booking limits:
 * 1. Max bookings per member per month at this property
 * 2. Advance booking window (how far ahead you can book)
 */
export async function checkPropertyLimit(
  userId: string,
  propertyId: string,
  bookingDate: string
): Promise<PropertyLimitCheck> {
  const typedAdmin = createAdminClient();
  const db = createAdminClient();

  // Fetch property limits
  const { data: property } = await db
    .from("properties")
    .select("max_bookings_per_member_per_month, advance_booking_days, name")
    .eq("id", propertyId)
    .single();

  if (!property) return { allowed: true };

  const prop = property as {
    max_bookings_per_member_per_month: number | null;
    advance_booking_days: number | null;
    name: string;
  };

  // Check advance booking window
  if (prop.advance_booking_days !== null) {
    const today = new Date();
    const booking = new Date(bookingDate + "T00:00:00");
    const diffDays = Math.ceil(
      (booking.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays > prop.advance_booking_days) {
      return {
        allowed: false,
        reason: `${prop.name} only allows bookings up to ${prop.advance_booking_days} days in advance.`,
      };
    }
  }

  // Check monthly limit
  if (prop.max_bookings_per_member_per_month !== null) {
    const bookingMonth = bookingDate.substring(0, 7); // YYYY-MM
    const monthStart = `${bookingMonth}-01`;
    const nextMonth = new Date(
      parseInt(bookingMonth.split("-")[0]),
      parseInt(bookingMonth.split("-")[1]),
      1
    );
    const monthEnd = toDateString(nextMonth);

    // Count user's bookings at this property in the calendar month
    const { count } = await db
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("angler_id", userId)
      .eq("property_id", propertyId)
      .in("status", ["confirmed", "pending"])
      .gte("booking_date", monthStart)
      .lt("booking_date", monthEnd);

    if ((count ?? 0) >= prop.max_bookings_per_member_per_month) {
      return {
        allowed: false,
        reason: `You've reached the maximum of ${prop.max_bookings_per_member_per_month} bookings per month at ${prop.name}.`,
      };
    }
  }

  return { allowed: true };
}

// ─── Cancellation Score & Standing Update ──────────────────────────

/**
 * Get the 90-day cancellation score for a user via SQL function.
 */
export async function getCancellationScore(
  userId: string
): Promise<number> {
  const db = createAdminClient();
  const { data } = await db.rpc("calculate_cancellation_score", {
    p_user_id: userId,
  });
  return typeof data === "number" ? data : 0;
}

/**
 * Recalculate and update a user's booking standing.
 * Called after every cancellation.
 * Returns whether the standing changed.
 */
export async function updateStanding(
  userId: string
): Promise<{ changed: boolean; oldStanding: string; newStanding: string }> {
  const db = createAdminClient();
  const typedAdmin = createAdminClient();

  // Get current standing
  const current = await getBookingStanding(userId);
  const oldStanding = current.standing;

  // Calculate new score
  const score = await getCancellationScore(userId);
  const newStanding = standingFromScore(score);
  const newCap =
    newStanding === oldStanding
      ? current.concurrent_cap
      : (await import("@/lib/constants/booking-limits")).STANDING_CONFIG[
          newStanding
        ].concurrentCap;

  // Update the record
  await db
    .from("booking_standing")
    .update({
      cancellation_score: score,
      cancellation_score_updated_at: new Date().toISOString(),
      standing: newStanding,
      concurrent_cap: newCap,
    })
    .eq("user_id", userId);

  const changed = oldStanding !== newStanding;

  if (changed) {
    // Notify the user
    await notifyBookingStandingChanged(typedAdmin, {
      userId,
      oldStanding,
      newStanding,
    });

    // If standing worsened, alert admins
    if (
      newStanding === "warned" ||
      newStanding === "restricted" ||
      newStanding === "suspended"
    ) {
      // Get user name for admin notification
      const { data: profile } = await typedAdmin
        .from("profiles")
        .select("display_name")
        .eq("id", userId)
        .single();

      // Notify platform admins
      const { data: admins } = await typedAdmin
        .from("profiles")
        .select("id")
        .eq("role", "admin")
        .limit(5);

      for (const admin of admins ?? []) {
        await notifyBookingAbuseFlagged(typedAdmin, {
          adminUserId: admin.id,
          anglerName: profile?.display_name ?? "Unknown",
          anglerId: userId,
          score,
          standing: newStanding,
        });
      }
    }

    // Audit log
    await auditLog({
      actor_id: userId,
      action: AuditAction.BOOKING_STANDING_CHANGED,
      entity_type: "booking_standing",
      entity_id: userId,
      old_data: { standing: oldStanding },
      new_data: { standing: newStanding, score },
      reason: `Cancellation score: ${Math.round(score * 100)}%`,
    });
  }

  return { changed, oldStanding, newStanding };
}
