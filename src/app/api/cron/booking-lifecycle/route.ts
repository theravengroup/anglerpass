import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError } from "@/lib/api/helpers";
import type { PostgrestError } from "@supabase/supabase-js";
import {
  notifyBookingReminder,
  notifyBookingGateCode,
  notifyBookingThankYou,
} from "@/lib/notifications";

/**
 * POST: Booking lifecycle emails — runs daily via Vercel Cron.
 *
 * Handles three time-based notifications:
 * 1. Pre-trip reminder (24h before) — for bookings happening tomorrow
 * 2. Gate code delivery (morning-of) — for bookings happening today
 * 3. Post-trip thank-you (day after) — for bookings that happened yesterday
 *
 * Protected by CRON_SECRET in the Authorization header.
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return jsonError("Unauthorized", 401);
  }

  const admin = createAdminClient();

  // Calculate date boundaries (using UTC dates — booking_date is stored as date without time)
  const now = new Date();
  const today = toDateString(now);
  const tomorrow = toDateString(addDays(now, 1));
  const yesterday = toDateString(addDays(now, -1));

  const results = {
    reminders: { sent: 0, errors: 0 },
    gateCodes: { sent: 0, errors: 0 },
    thankYous: { sent: 0, errors: 0 },
  };

  // ─── Types for Supabase join queries ───────────────────────────────

  interface BookingWithProperty {
    id: string;
    angler_id: string;
    booking_date: string;
    booking_end_date: string | null;
    booking_group_id: string | null;
    duration: string;
    party_size: number;
    guide_id: string | null;
    properties: { name: string; location_description: string; gate_code: string | null; access_notes: string | null } | null;
    guide_profiles: { display_name: string } | null;
  }

  // ─── 1. Pre-trip reminders (bookings tomorrow) ────────────────────

  try {
    const { data: tomorrowBookings, error } = await admin
      .from("bookings")
      .select(
        "id, angler_id, booking_date, booking_end_date, booking_group_id, duration, party_size, guide_id, properties(name, location_description), guide_profiles(display_name)"
      )
      .eq("booking_date", tomorrow)
      .eq("status", "confirmed")
      .is("booking_group_id", null)
      .order("created_at") as { data: BookingWithProperty[] | null; error: PostgrestError | null };

    if (error) {
      console.error("[cron/booking-lifecycle] Reminder query error:", error);
      results.reminders.errors++;
    } else if (tomorrowBookings) {
      // Also include first-day bookings from multi-day groups
      const { data: multiDayBookings } = await admin
        .from("bookings")
        .select(
          "id, angler_id, booking_date, booking_end_date, booking_group_id, duration, party_size, guide_id, properties(name, location_description), guide_profiles(display_name)"
        )
        .eq("booking_date", tomorrow)
        .eq("status", "confirmed")
        .not("booking_group_id", "is", null) as { data: BookingWithProperty[] | null; error: unknown };

      const multiDayFirst = deduplicateMultiDay(multiDayBookings ?? []);
      const allBookings: BookingWithProperty[] = [...tomorrowBookings, ...multiDayFirst];

      for (const booking of allBookings) {
        try {
          await notifyBookingReminder(admin, {
            anglerId: booking.angler_id,
            propertyName: booking.properties?.name ?? "your property",
            propertyLocation: booking.properties?.location_description ?? "",
            bookingDate: booking.booking_date,
            duration: booking.duration,
            partySize: booking.party_size,
            guideName: booking.guide_profiles?.display_name ?? undefined,
            bookingId: booking.id,
          });
          results.reminders.sent++;
        } catch (err) {
          console.error("[cron/booking-lifecycle] Reminder send error:", err);
          results.reminders.errors++;
        }
      }
    }
  } catch (err) {
    console.error("[cron/booking-lifecycle] Reminder block error:", err);
    results.reminders.errors++;
  }

  // ─── 2. Gate code delivery (bookings today) ───────────────────────

  try {
    const { data: todayBookings, error } = await admin
      .from("bookings")
      .select(
        "id, angler_id, booking_date, booking_group_id, properties(name, location_description, gate_code, access_notes)"
      )
      .eq("booking_date", today)
      .eq("status", "confirmed")
      .is("booking_group_id", null)
      .order("created_at") as { data: BookingWithProperty[] | null; error: PostgrestError | null };

    if (error) {
      console.error("[cron/booking-lifecycle] Gate code query error:", error);
      results.gateCodes.errors++;
    } else if (todayBookings) {
      // Include first-day multi-day bookings
      const { data: multiDayBookings } = await admin
        .from("bookings")
        .select(
          "id, angler_id, booking_date, booking_group_id, properties(name, location_description, gate_code, access_notes)"
        )
        .eq("booking_date", today)
        .eq("status", "confirmed")
        .not("booking_group_id", "is", null) as { data: BookingWithProperty[] | null; error: unknown };

      const multiDayFirst = deduplicateMultiDay(multiDayBookings ?? []);
      const allBookings: BookingWithProperty[] = [...todayBookings, ...multiDayFirst];

      for (const booking of allBookings) {
        try {
          await notifyBookingGateCode(admin, {
            anglerId: booking.angler_id,
            propertyName: booking.properties?.name ?? "your property",
            propertyLocation: booking.properties?.location_description ?? "",
            bookingDate: booking.booking_date,
            gateCode: booking.properties?.gate_code ?? undefined,
            accessNotes: booking.properties?.access_notes ?? undefined,
            bookingId: booking.id,
          });
          results.gateCodes.sent++;
        } catch (err) {
          console.error("[cron/booking-lifecycle] Gate code send error:", err);
          results.gateCodes.errors++;
        }
      }
    }
  } catch (err) {
    console.error("[cron/booking-lifecycle] Gate code block error:", err);
    results.gateCodes.errors++;
  }

  // ─── 3. Post-trip thank-you (bookings yesterday) ──────────────────

  try {
    // Single-day bookings that happened yesterday
    const { data: yesterdayBookings, error } = await admin
      .from("bookings")
      .select(
        "id, angler_id, booking_date, booking_end_date, booking_group_id, guide_id, properties(name, location_description, gate_code, access_notes), guide_profiles(display_name)"
      )
      .eq("status", "confirmed")
      .is("booking_group_id", null)
      .eq("booking_date", yesterday)
      .order("created_at") as { data: BookingWithProperty[] | null; error: PostgrestError | null };

    if (error) {
      console.error("[cron/booking-lifecycle] Thank-you query error:", error);
      results.thankYous.errors++;
    } else if (yesterdayBookings) {
      // Multi-day bookings where the END date was yesterday
      const { data: multiDayEnding } = await admin
        .from("bookings")
        .select(
          "id, angler_id, booking_date, booking_end_date, booking_group_id, guide_id, properties(name, location_description, gate_code, access_notes), guide_profiles(display_name)"
        )
        .eq("status", "confirmed")
        .eq("booking_end_date", yesterday)
        .not("booking_group_id", "is", null) as { data: BookingWithProperty[] | null; error: unknown };

      const multiDayLast = deduplicateMultiDay(multiDayEnding ?? []);
      const allBookings: BookingWithProperty[] = [...yesterdayBookings, ...multiDayLast];

      for (const booking of allBookings) {
        try {
          // Transition to "completed" status
          await admin
            .from("bookings")
            .update({ status: "completed", updated_at: new Date().toISOString() })
            .eq("id", booking.id)
            .eq("status", "confirmed");

          // If multi-day group, complete all bookings in the group
          if (booking.booking_group_id) {
            await admin
              .from("bookings")
              .update({ status: "completed", updated_at: new Date().toISOString() })
              .eq("booking_group_id", booking.booking_group_id)
              .eq("status", "confirmed");
          }

          await notifyBookingThankYou(admin, {
            anglerId: booking.angler_id,
            propertyName: booking.properties?.name ?? "the property",
            bookingDate: booking.booking_date,
            bookingId: booking.id,
            guideName: booking.guide_profiles?.display_name ?? undefined,
          });
          results.thankYous.sent++;
        } catch (err) {
          console.error("[cron/booking-lifecycle] Thank-you send error:", err);
          results.thankYous.errors++;
        }
      }
    }
  } catch (err) {
    console.error("[cron/booking-lifecycle] Thank-you block error:", err);
    results.thankYous.errors++;
  }

  console.log("[cron/booking-lifecycle] Results:", JSON.stringify(results));

  return jsonOk({
    message: "Booking lifecycle emails processed",
    today,
    tomorrow,
    yesterday,
    ...results,
  });
}

// ─── Utilities ──────────────────────────────────────────────────────

function toDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

/** Deduplicate multi-day bookings — keep only one per booking_group_id */
function deduplicateMultiDay<T extends { booking_group_id: string | null }>(
  bookings: T[]
): T[] {
  const seen = new Set<string>();
  return bookings.filter((b) => {
    const groupId = b.booking_group_id;
    if (!groupId || seen.has(groupId)) return false;
    seen.add(groupId);
    return true;
  });
}
