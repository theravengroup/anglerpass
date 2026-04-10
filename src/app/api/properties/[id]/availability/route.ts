import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonOk, jsonError, requireAuth } from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/properties/[id]/availability?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
 *
 * Returns availability entries for a property in the given date range.
 * Includes blocked, maintenance, and booked dates.
 * Dates without entries are implicitly available.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (!auth) return jsonError("Unauthorized", 401);

  const { id: propertyId } = await params;
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");

  const admin = createAdminClient();
  const untypedDb = createAdminClient();

  let query = untypedDb
    .from("property_availability")
    .select("id, date, status, reason, booking_id, created_by, created_at")
    .eq("property_id", propertyId)
    .order("date");

  if (startDate) query = query.gte("date", startDate);
  if (endDate) query = query.lte("date", endDate);

  const { data, error } = await query;

  if (error) {
    console.error("[property-availability] Fetch error:", error);
    return jsonError("Failed to fetch availability", 500);
  }

  // Also fetch confirmed/pending bookings for the range to show booked dates
  let bookingQuery = admin
    .from("bookings")
    .select("id, booking_date, party_size, status, angler_id")
    .eq("property_id", propertyId)
    .in("status", ["pending", "confirmed"]);

  if (startDate) bookingQuery = bookingQuery.gte("booking_date", startDate);
  if (endDate) bookingQuery = bookingQuery.lte("booking_date", endDate);

  const { data: bookings } = await bookingQuery;

  return jsonOk({
    availability: data ?? [],
    bookings: bookings ?? [],
  });
}

/**
 * PUT /api/properties/[id]/availability
 *
 * Bulk set dates as blocked, maintenance, or available.
 * Only property owners and club admins/managers can manage availability.
 */
const bulkAvailabilitySchema = z.object({
  dates: z
    .array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .min(1, "At least one date required")
    .max(365, "Cannot update more than 365 dates at once"),
  status: z.enum(["blocked", "available", "maintenance"]),
  reason: z.string().max(200).optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (!auth) return jsonError("Unauthorized", 401);

  const { id: propertyId } = await params;
  const body = await request.json();
  const parsed = bulkAvailabilitySchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const { dates, status, reason } = parsed.data;
  const admin = createAdminClient();

  // Verify caller owns the property or is club admin
  const { data: property } = await admin
    .from("properties")
    .select("id, owner_id")
    .eq("id", propertyId)
    .single();

  if (!property) return jsonError("Property not found", 404);

  const isOwner = property.owner_id === auth.user.id;

  if (!isOwner) {
    // Check if caller is club admin/manager for this property
    const { data: clubAccess } = await admin
      .from("club_property_access")
      .select("club_id")
      .eq("property_id", propertyId);

    const clubIds = (clubAccess ?? []).map((c) => c.club_id);

    if (clubIds.length > 0) {
      const { data: membership } = await admin
        .from("club_memberships")
        .select("role")
        .eq("user_id", auth.user.id)
        .in("club_id", clubIds)
        .in("role", ["admin", "manager", "owner"])
        .limit(1)
        .maybeSingle();

      if (!membership) {
        return jsonError("Forbidden — only property owners and club admins can manage availability", 403);
      }
    } else {
      return jsonError("Forbidden", 403);
    }
  }

  // Don't overwrite dates that have active bookings
  const { data: bookedDates } = await admin
    .from("bookings")
    .select("booking_date")
    .eq("property_id", propertyId)
    .in("booking_date", dates)
    .in("status", ["pending", "confirmed"]);

  const bookedSet = new Set(
    (bookedDates ?? []).map((b) => b.booking_date)
  );

  if (status === "blocked" || status === "maintenance") {
    // Filter out dates with active bookings
    const safeDates = dates.filter((d) => !bookedSet.has(d));

    if (safeDates.length === 0) {
      return jsonOk({
        message: "All selected dates have active bookings and cannot be blocked.",
        updated: 0,
        skipped_booked: dates.length,
      });
    }

    // Upsert blocked/maintenance records
    const untypedDb = createAdminClient();
    const records = safeDates.map((date) => ({
      property_id: propertyId,
      date,
      status,
      reason: reason ?? null,
      created_by: auth.user.id,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await untypedDb
      .from("property_availability")
      .upsert(records, { onConflict: "property_id,date" });

    if (error) {
      console.error("[property-availability] Upsert error:", error);
      return jsonError("Failed to update availability", 500);
    }

    return jsonOk({
      message: `${safeDates.length} date(s) set to ${status}`,
      updated: safeDates.length,
      skipped_booked: dates.length - safeDates.length,
    });
  }

  // For "available" — delete blocked/maintenance entries (restore default)
  if (status === "available") {
    const untypedDb = createAdminClient();
    const { error } = await untypedDb
      .from("property_availability")
      .delete()
      .eq("property_id", propertyId)
      .in("status", ["blocked", "maintenance"])
      .in("date", dates);

    if (error) {
      console.error("[property-availability] Delete error:", error);
      return jsonError("Failed to update availability", 500);
    }

    return jsonOk({
      message: `${dates.length} date(s) set to available`,
      updated: dates.length,
    });
  }

  return jsonOk({ message: "No changes made", updated: 0 });
}
