import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  bookingSchema,
  calculateBookingFees,
} from "@/lib/validations/bookings";

// POST: Create a booking request
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = bookingSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const {
      property_id,
      club_membership_id,
      booking_date,
      duration,
      party_size,
      message,
    } = result.data;

    const admin = createAdminClient();

    // Verify the property is published
    const { data: property, error: propError } = await admin
      .from("properties")
      .select(
        "id, name, status, half_day_allowed, rate_adult_full_day, rate_adult_half_day, capacity"
      )
      .eq("id", property_id)
      .single();

    if (propError || !property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    if (property.status !== "published") {
      return NextResponse.json(
        { error: "This property is not currently accepting bookings" },
        { status: 400 }
      );
    }

    if (duration === "half_day" && !property.half_day_allowed) {
      return NextResponse.json(
        { error: "This property does not offer half-day bookings" },
        { status: 400 }
      );
    }

    // Verify the membership belongs to this user and is active
    const { data: membership, error: memError } = await admin
      .from("club_memberships")
      .select("id, club_id, status")
      .eq("id", club_membership_id)
      .eq("user_id", user.id)
      .single();

    if (memError || !membership) {
      return NextResponse.json(
        { error: "Invalid club membership" },
        { status: 400 }
      );
    }

    if (membership.status !== "active") {
      return NextResponse.json(
        { error: "Your club membership is not active" },
        { status: 400 }
      );
    }

    // Verify the club has access to this property
    const { data: access } = await admin
      .from("club_property_access")
      .select("id, status")
      .eq("club_id", membership.club_id)
      .eq("property_id", property_id)
      .eq("status", "approved")
      .maybeSingle();

    if (!access) {
      return NextResponse.json(
        {
          error:
            "Your club does not have access to this property",
        },
        { status: 403 }
      );
    }

    // Check booking date is in the future
    const bookingDateObj = new Date(booking_date + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (bookingDateObj < today) {
      return NextResponse.json(
        { error: "Booking date must be in the future" },
        { status: 400 }
      );
    }

    // Check capacity (existing confirmed/pending bookings for that date)
    if (property.capacity) {
      const { count } = await admin
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("property_id", property_id)
        .eq("booking_date", booking_date)
        .in("status", ["pending", "confirmed"]);

      if ((count ?? 0) + party_size > property.capacity) {
        return NextResponse.json(
          {
            error:
              "This property has reached capacity for the selected date",
          },
          { status: 409 }
        );
      }
    }

    // Calculate fees
    const baseRate =
      duration === "full_day"
        ? (property.rate_adult_full_day ?? 0) * party_size
        : (property.rate_adult_half_day ?? 0) * party_size;

    const { platformFee, totalAmount } = calculateBookingFees(baseRate);

    // Create the booking
    const { data: booking, error: insertError } = await admin
      .from("bookings")
      .insert({
        property_id,
        angler_id: user.id,
        club_membership_id,
        booking_date,
        duration,
        party_size,
        base_rate: baseRate,
        platform_fee: platformFee,
        total_amount: totalAmount,
        message: message || null,
        status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      // Check for unique constraint violation (double booking)
      if (insertError.code === "23505") {
        return NextResponse.json(
          {
            error:
              "A booking already exists for this property on the selected date",
          },
          { status: 409 }
        );
      }
      console.error("[bookings] Insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to create booking" },
        { status: 500 }
      );
    }

    return NextResponse.json({ booking }, { status: 201 });
  } catch (err) {
    console.error("[bookings] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET: List bookings for the current user
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role"); // "angler" or "landowner"
    const propertyId = searchParams.get("property_id");

    const admin = createAdminClient();

    if (role === "landowner" || propertyId) {
      // Landowner view: bookings for their properties
      let query = admin
        .from("bookings")
        .select(
          "*, properties!inner(id, name, owner_id), profiles!bookings_angler_id_fkey(display_name)"
        )
        .eq("properties.owner_id", user.id)
        .order("booking_date", { ascending: true });

      if (propertyId) {
        query = query.eq("property_id", propertyId);
      }

      const { data: bookings, error } = await query;

      if (error) {
        console.error("[bookings] Landowner fetch error:", error);
        return NextResponse.json(
          { error: "Failed to fetch bookings" },
          { status: 500 }
        );
      }

      return NextResponse.json({ bookings: bookings ?? [] });
    }

    // Angler view: their own bookings
    const { data: bookings, error } = await admin
      .from("bookings")
      .select(
        "*, properties(id, name, location_description, photos, water_type)"
      )
      .eq("angler_id", user.id)
      .order("booking_date", { ascending: true });

    if (error) {
      console.error("[bookings] Angler fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch bookings" },
        { status: 500 }
      );
    }

    return NextResponse.json({ bookings: bookings ?? [] });
  } catch (err) {
    console.error("[bookings] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
