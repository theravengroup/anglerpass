import { createAdminClient } from "@/lib/supabase/admin";
import { toDateString } from "@/lib/utils";
import {
  generateICalFeed,
  toICalDate,
  toICalDateEnd,
  toICalStatus,
} from "@/lib/ical";

// GET: Generate iCal feed for a property (authenticated via token query param)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return new Response("Missing token", { status: 401 });
    }

    const admin = createAdminClient();

    // Verify token
    const { data: calendarToken } = await admin
      .from("calendar_tokens")
      .select("property_id")
      .eq("property_id", id)
      .eq("token", token)
      .single();

    if (!calendarToken) {
      return new Response("Invalid token", { status: 403 });
    }

    // Fetch property name
    const { data: property } = await admin
      .from("properties")
      .select("name, location_description")
      .eq("id", id)
      .single();

    if (!property) {
      return new Response("Property not found", { status: 404 });
    }

    // Fetch future bookings (pending + confirmed only)
    const today = toDateString();
    const { data: bookings } = await admin
      .from("bookings")
      .select(
        "id, booking_date, duration, party_size, status, created_at, updated_at, profiles!bookings_angler_id_fkey(display_name)"
      )
      .eq("property_id", id)
      .in("status", ["pending", "confirmed"])
      .gte("booking_date", today)
      .order("booking_date", { ascending: true });

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://anglerpass.com";

    // Fetch blocked/maintenance dates for the next 6 months
    const untypedDb = createAdminClient();
    const sixMonthsOut = new Date();
    sixMonthsOut.setMonth(sixMonthsOut.getMonth() + 6);
    const { data: blockedDates } = await untypedDb
      .from("property_availability")
      .select("id, date, status, reason")
      .eq("property_id", id)
      .in("status", ["blocked", "maintenance"])
      .gte("date", today)
      .lte("date", toDateString(sixMonthsOut))
      .order("date");

    // Build blocked date events
    const blockedEvents = ((blockedDates ?? []) as Array<{ id: string; date: string; status: string; reason: string | null }>).map((blocked) => {
      const label =
        blocked.status === "maintenance" ? "Maintenance" : "Unavailable";
      return {
        uid: `blocked-${blocked.id}@anglerpass.com`,
        summary: `${label}${blocked.reason ? ` — ${blocked.reason}` : ""}`,
        description: `Property is ${label.toLowerCase()} on this date.`,
        dtstart: toICalDate(blocked.date),
        dtend: toICalDateEnd(blocked.date),
        location: property.location_description ?? undefined,
        status: "CANCELLED" as const,
        created: today + "T00:00:00Z",
        lastModified: today + "T00:00:00Z",
      };
    });

    const events = (bookings ?? []).map((booking) => {
      const anglerName =
        (booking.profiles as { display_name: string | null } | null)
          ?.display_name ?? "Angler";
      const durationLabel =
        booking.duration === "half_day" ? "Half Day" : "Full Day";
      const statusLabel =
        booking.status === "confirmed" ? "Confirmed" : "Pending";

      return {
        uid: `booking-${booking.id}@anglerpass.com`,
        summary: `${anglerName} — ${durationLabel} (${statusLabel})`,
        description: `${statusLabel} booking for ${booking.party_size} angler${booking.party_size > 1 ? "s" : ""}.\\n${durationLabel} at ${property.name}.\\nManage: ${siteUrl}/landowner/bookings`,
        dtstart: toICalDate(booking.booking_date),
        dtend: toICalDateEnd(booking.booking_date),
        location: property.location_description ?? undefined,
        status: toICalStatus(booking.status),
        created: booking.created_at,
        lastModified: booking.updated_at,
      };
    });

    const ical = generateICalFeed(
      `${property.name} — AnglerPass Bookings`,
      [...events, ...blockedEvents]
    );

    return new Response(ical, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `inline; filename="${property.name.replace(/[^a-zA-Z0-9]/g, "_")}_bookings.ics"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (err) {
    console.error("[calendar.ics] Error:", err);
    return new Response("Internal server error", { status: 500 });
  }
}
