import { requireAuth, jsonError } from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateBookingIcs } from "@/lib/ical";

/**
 * GET: Download a .ics file for a specific booking.
 * Only the angler who made the booking can download it.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth();
    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;
    const admin = createAdminClient();

    const { data: booking, error } = await admin
      .from("bookings")
      .select(
        "id, angler_id, property_id, booking_date, booking_start_date, booking_end_date, duration, party_size, status, guide_profiles(display_name), properties(name, location_description)"
      )
      .eq("id", id)
      .maybeSingle();

    if (error || !booking) {
      return jsonError("Booking not found", 404);
    }

    if (booking.angler_id !== user.id) {
      return jsonError("Forbidden", 403);
    }

    const property = booking.properties as {
      name: string;
      location_description: string | null;
    } | null;
    const guide = booking.guide_profiles as {
      display_name: string | null;
    } | null;

    const startDate = booking.booking_start_date ?? booking.booking_date;
    const endDate = booking.booking_end_date ?? booking.booking_date;

    const ics = generateBookingIcs({
      bookingId: booking.id,
      propertyName: property?.name ?? "Property",
      location: property?.location_description ?? undefined,
      startDate,
      endDate: endDate !== startDate ? endDate : undefined,
      duration: booking.duration,
      partySize: booking.party_size,
      guideName: guide?.display_name ?? undefined,
      status: booking.status,
    });

    const filename = (property?.name ?? "booking").replace(
      /[^a-zA-Z0-9]/g,
      "_"
    );

    return new Response(ics, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}_booking.ics"`,
      },
    });
  } catch (err) {
    console.error("[bookings/calendar.ics] Error:", err);
    return new Response("Internal server error", { status: 500 });
  }
}
