import { createAdminClient } from "@/lib/supabase/admin";
import { createUntypedAdmin } from "@/lib/supabase/untyped";
import { rateLimit, getClientIp } from "@/lib/api/rate-limit";
import { toDateString } from "@/lib/utils";
import {
  generateICalFeed,
  toICalDate,
  toICalDateEnd,
  toICalStatus,
} from "@/lib/ical";

/**
 * GET: Aggregate iCal feed for a landowner — includes bookings and blocked
 * dates across ALL properties they own. Authenticated via token query param.
 * Auto-updates when properties are added or removed.
 */
export async function GET(request: Request) {
  const limited = rateLimit("calendar-ics", getClientIp(request), 60, 60_000);
  if (limited) return limited;

  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return new Response("Missing token", { status: 401 });
    }

    const db = createUntypedAdmin();
    const admin = createAdminClient();

    // Verify token and get the landowner's user_id
    const { data: calendarToken } = await db
      .from("landowner_calendar_tokens")
      .select("user_id")
      .eq("token", token)
      .maybeSingle();

    if (!calendarToken) {
      return new Response("Invalid token", { status: 403 });
    }

    const userId = calendarToken.user_id;

    // Fetch all properties owned by this landowner
    const { data: properties } = await admin
      .from("properties")
      .select("id, name, location_description")
      .eq("owner_id", userId);

    if (!properties?.length) {
      const ical = generateICalFeed("AnglerPass — All Properties", []);
      return icsResponse(ical, "all_properties_bookings");
    }

    const propertyIds = properties.map((p) => p.id);
    const propertyMap = new Map(properties.map((p) => [p.id, p]));

    const today = toDateString();
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://anglerpass.com";

    // Fetch future bookings across all properties
    const { data: bookings } = await admin
      .from("bookings")
      .select(
        "id, property_id, booking_date, duration, party_size, status, created_at, updated_at, profiles!bookings_angler_id_fkey(display_name)"
      )
      .in("property_id", propertyIds)
      .in("status", ["pending", "confirmed"])
      .gte("booking_date", today)
      .order("booking_date", { ascending: true });

    // Fetch blocked/maintenance dates for next 6 months
    const sixMonthsOut = new Date();
    sixMonthsOut.setMonth(sixMonthsOut.getMonth() + 6);
    const { data: blockedDates } = await admin
      .from("property_availability")
      .select("id, property_id, date, status, reason")
      .in("property_id", propertyIds)
      .in("status", ["blocked", "maintenance"])
      .gte("date", today)
      .lte("date", toDateString(sixMonthsOut))
      .order("date");

    // Build booking events
    const bookingEvents = (bookings ?? []).map((booking) => {
      const prop = propertyMap.get(booking.property_id);
      const propName = prop?.name ?? "Property";
      const anglerName =
        (booking.profiles as { display_name: string | null } | null)
          ?.display_name ?? "Angler";
      const durationLabel =
        booking.duration === "half_day" ? "Half Day" : "Full Day";
      const statusLabel =
        booking.status === "confirmed" ? "Confirmed" : "Pending";

      return {
        uid: `booking-${booking.id}@anglerpass.com`,
        summary: `[${propName}] ${anglerName} — ${durationLabel} (${statusLabel})`,
        description: `${statusLabel} booking for ${booking.party_size} angler${booking.party_size > 1 ? "s" : ""}.\\n${durationLabel} at ${propName}.\\nManage: ${siteUrl}/landowner/bookings`,
        dtstart: toICalDate(booking.booking_date),
        dtend: toICalDateEnd(booking.booking_date),
        location: prop?.location_description ?? undefined,
        status: toICalStatus(booking.status),
        created: booking.created_at,
        lastModified: booking.updated_at,
      };
    });

    // Build blocked date events
    const blockedEvents = (
      (blockedDates ?? []) as Array<{
        id: string;
        property_id: string;
        date: string;
        status: string;
        reason: string | null;
      }>
    ).map((blocked) => {
      const prop = propertyMap.get(blocked.property_id);
      const propName = prop?.name ?? "Property";
      const label =
        blocked.status === "maintenance" ? "Maintenance" : "Unavailable";

      return {
        uid: `blocked-${blocked.id}@anglerpass.com`,
        summary: `[${propName}] ${label}${blocked.reason ? ` — ${blocked.reason}` : ""}`,
        description: `${propName} is ${label.toLowerCase()} on this date.`,
        dtstart: toICalDate(blocked.date),
        dtend: toICalDateEnd(blocked.date),
        location: prop?.location_description ?? undefined,
        status: "CANCELLED" as const,
        created: today + "T00:00:00Z",
        lastModified: today + "T00:00:00Z",
      };
    });

    const ical = generateICalFeed("AnglerPass — All Properties", [
      ...bookingEvents,
      ...blockedEvents,
    ]);

    return icsResponse(ical, "all_properties_bookings");
  } catch (err) {
    console.error("[landowner/calendar.ics] Error:", err);
    return new Response("Internal server error", { status: 500 });
  }
}

function icsResponse(ical: string, filename: string) {
  return new Response(ical, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="${filename}.ics"`,
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
