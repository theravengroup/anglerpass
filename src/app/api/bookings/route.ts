import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { bookingSchema } from "@/lib/validations/bookings";
import { calculateFeeBreakdown } from "@/lib/constants/fees";
import { notifyBookingRequested } from "@/lib/notifications";
import { detectCrossClubRouting } from "@/lib/cross-club";

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
      non_fishing_guests,
      message,
    } = result.data;

    const admin = createAdminClient();

    // Verify the property is published
    // max_rods / max_guests are new columns not yet in generated types
    const { data: property, error: propError } = (await admin
      .from("properties")
      .select(
        "id, name, status, half_day_allowed, rate_adult_full_day, rate_adult_half_day, capacity, max_rods, max_guests, owner_id"
      )
      .eq("id", property_id)
      .single()) as unknown as {
      data: {
        id: string;
        name: string;
        status: string;
        half_day_allowed: boolean;
        rate_adult_full_day: number | null;
        rate_adult_half_day: number | null;
        capacity: number | null;
        max_rods: number | null;
        max_guests: number | null;
        owner_id: string;
      } | null;
      error: { message: string } | null;
    };

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

    // Determine access route: direct (home-club) or cross-club
    const routing = await detectCrossClubRouting(
      admin,
      membership.club_id,
      property_id
    );

    if (!routing) {
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

    // Check rod limit (max_rods) and total guest limit (max_guests)
    const maxRods = property.max_rods ?? property.capacity;
    const maxGuests = property.max_guests ?? property.capacity;

    // Validate party_size against max_rods
    if (maxRods && party_size > maxRods) {
      return NextResponse.json(
        {
          error: `This property allows a maximum of ${maxRods} anglers (rods). You requested ${party_size}.`,
        },
        { status: 400 }
      );
    }

    // Validate total people against max_guests
    const totalPeople = party_size + non_fishing_guests;
    if (maxGuests && totalPeople > maxGuests) {
      return NextResponse.json(
        {
          error: `This property allows a maximum of ${maxGuests} total people. Your party of ${totalPeople} (${party_size} anglers + ${non_fishing_guests} non-fishing guests) exceeds this limit.`,
        },
        { status: 400 }
      );
    }

    // Check existing bookings don't exceed capacity for the date
    if (maxRods || maxGuests) {
      // non_fishing_guests is a new column not yet in generated types
      const { data: existingBookings } = (await admin
        .from("bookings")
        .select("party_size, non_fishing_guests")
        .eq("property_id", property_id)
        .eq("booking_date", booking_date)
        .in("status", ["pending", "confirmed"])) as unknown as {
        data: { party_size: number; non_fishing_guests: number }[] | null;
      };

      const existingRods = (existingBookings ?? []).reduce(
        (sum, b) => sum + (b.party_size ?? 0),
        0
      );
      const existingTotal = (existingBookings ?? []).reduce(
        (sum, b) => sum + (b.party_size ?? 0) + (b.non_fishing_guests ?? 0),
        0
      );

      if (maxRods && existingRods + party_size > maxRods) {
        return NextResponse.json(
          {
            error:
              "This property has reached its rod limit for the selected date.",
          },
          { status: 409 }
        );
      }

      if (maxGuests && existingTotal + totalPeople > maxGuests) {
        return NextResponse.json(
          {
            error:
              "This property has reached its guest capacity for the selected date.",
          },
          { status: 409 }
        );
      }
    }

    const isCrossClub = routing.isCrossClub;

    // Calculate full fee breakdown
    const ratePerRod =
      duration === "full_day"
        ? (property.rate_adult_full_day ?? 0)
        : (property.rate_adult_half_day ?? 0);

    const fees = calculateFeeBreakdown(ratePerRod, party_size, isCrossClub);

    // Create the booking with full fee breakdown
    const { data: booking, error: insertError } = await admin
      .from("bookings")
      .insert({
        property_id,
        angler_id: user.id,
        club_membership_id,
        booking_date,
        duration,
        party_size,
        non_fishing_guests,
        base_rate: fees.baseRate,
        platform_fee: fees.platformFee,
        cross_club_fee: fees.crossClubFee,
        club_commission: fees.clubCommission,
        landowner_payout: fees.landownerPayout,
        total_amount: fees.totalAmount,
        is_cross_club: isCrossClub,
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

    // Notify landowner (fire-and-forget)
    const { data: anglerProfile } = await admin
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();

    notifyBookingRequested(admin, {
      landownerId: property.owner_id,
      anglerName: anglerProfile?.display_name ?? "An angler",
      propertyName: property.name,
      bookingDate: booking_date,
      duration,
      partySize: party_size,
      bookingId: booking.id,
    }).catch((err) => console.error("[bookings] Notification error:", err));

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
