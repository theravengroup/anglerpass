import { createAdminClient } from "@/lib/supabase/admin";
import { createUntypedAdmin } from "@/lib/supabase/untyped";
import { toDateString } from "@/lib/utils";
import {
  generateICalFeed,
  toICalDate,
  toICalDateEnd,
  toICalStatus,
} from "@/lib/ical";

/**
 * GET: iCal feed for a club — includes bookings across all properties
 * associated with the club (via club_property_access and created_by_club_id).
 * Authenticated via token query param.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return new Response("Missing token", { status: 401 });
    }

    const db = createUntypedAdmin();
    const admin = createAdminClient();

    // Verify token and get the club_id
    const { data: calendarToken } = await db
      .from("club_calendar_tokens")
      .select("club_id")
      .eq("token", token)
      .maybeSingle();

    if (!calendarToken) {
      return new Response("Invalid token", { status: 403 });
    }

    const clubId = calendarToken.club_id;

    // Fetch club name
    const { data: club } = await admin
      .from("clubs")
      .select("name")
      .eq("id", clubId)
      .maybeSingle();

    const clubName = club?.name ?? "Club";

    // Get all property IDs associated with this club
    // 1. Via club_property_access (explicit association)
    const { data: accessRecords } = await admin
      .from("club_property_access")
      .select("property_id")
      .eq("club_id", clubId);

    // 2. Via created_by_club_id (club-created properties)
    const { data: createdProperties } = await admin
      .from("properties")
      .select("id")
      .eq("created_by_club_id", clubId);

    const propertyIdSet = new Set<string>();
    for (const r of accessRecords ?? []) propertyIdSet.add(r.property_id);
    for (const p of createdProperties ?? []) propertyIdSet.add(p.id);
    const propertyIds = [...propertyIdSet];

    if (!propertyIds.length) {
      const ical = generateICalFeed(`${clubName} — AnglerPass`, []);
      return icsResponse(ical, clubName);
    }

    // Fetch property details
    const { data: properties } = await admin
      .from("properties")
      .select("id, name, location_description")
      .in("id", propertyIds);

    const propertyMap = new Map(
      (properties ?? []).map((p) => [p.id, p])
    );

    const today = toDateString();
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://anglerpass.com";

    // Fetch future bookings
    const { data: bookings } = await admin
      .from("bookings")
      .select(
        "id, property_id, booking_date, duration, party_size, status, created_at, updated_at, profiles!bookings_angler_id_fkey(display_name)"
      )
      .in("property_id", propertyIds)
      .in("status", ["pending", "confirmed"])
      .gte("booking_date", today)
      .order("booking_date", { ascending: true });

    // Fetch blocked/maintenance dates
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
        description: `${statusLabel} booking for ${booking.party_size} angler${booking.party_size > 1 ? "s" : ""}.\\n${durationLabel} at ${propName}.\\nManage: ${siteUrl}/club/properties`,
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

    const ical = generateICalFeed(`${clubName} — AnglerPass`, [
      ...bookingEvents,
      ...blockedEvents,
    ]);

    return icsResponse(ical, clubName);
  } catch (err) {
    console.error("[clubs/calendar.ics] Error:", err);
    return new Response("Internal server error", { status: 500 });
  }
}

function icsResponse(ical: string, name: string) {
  const filename = name.replace(/[^a-zA-Z0-9]/g, "_");
  return new Response(ical, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="${filename}_bookings.ics"`,
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
