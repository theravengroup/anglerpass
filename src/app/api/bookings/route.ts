import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { bookingSchema } from "@/lib/validations/bookings";
import { calculateFeeBreakdown } from "@/lib/constants/fees";
import { notifyBookingCreated, notifyBookingConfirmed, notifyGuideBookingCreated } from "@/lib/notifications";
import { detectCrossClubRouting } from "@/lib/cross-club";

/**
 * For multi-day bookings, only return the primary record (booking_date = booking_start_date).
 * Single-day bookings (no booking_group_id) pass through unchanged.
 */
function deduplicateMultiDayBookings<T extends { booking_group_id: string | null; booking_date: string; booking_start_date: string | null }>(
  bookings: T[]
): T[] {
  const seen = new Set<string>();
  return bookings.filter((b) => {
    if (!b.booking_group_id) return true;
    if (seen.has(b.booking_group_id)) return false;
    // Only keep the primary record (first day)
    if (b.booking_start_date && b.booking_date !== b.booking_start_date) return false;
    seen.add(b.booking_group_id);
    return true;
  });
}

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
      booking_end_date,
      duration,
      party_size,
      non_fishing_guests,
      message,
      guide_id,
    } = result.data;

    const admin = createAdminClient();

    // Verify the property is published
    const { data: property, error: propError } = await admin
      .from("properties")
      .select(
        "id, name, status, half_day_allowed, rate_adult_full_day, rate_adult_half_day, max_rods, max_guests, owner_id"
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

    // ── Date range validation ─────────────────────────────────────
    const startDate = booking_date;
    const endDate = booking_end_date && booking_end_date !== booking_date
      ? booking_end_date
      : booking_date;

    const startDateObj = new Date(startDate + "T00:00:00");
    const endDateObj = new Date(endDate + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDateObj <= today) {
      return NextResponse.json(
        { error: "Booking date must be in the future" },
        { status: 400 }
      );
    }

    if (endDateObj < startDateObj) {
      return NextResponse.json(
        { error: "End date cannot be before start date" },
        { status: 400 }
      );
    }

    // Calculate number of days (inclusive)
    const msPerDay = 24 * 60 * 60 * 1000;
    const numberOfDays = Math.round(
      (endDateObj.getTime() - startDateObj.getTime()) / msPerDay
    ) + 1;

    if (numberOfDays > 14) {
      return NextResponse.json(
        { error: "Bookings cannot exceed 14 days" },
        { status: 400 }
      );
    }

    // Build array of all dates in the range
    const allDates: string[] = [];
    for (let i = 0; i < numberOfDays; i++) {
      const d = new Date(startDateObj.getTime() + i * msPerDay);
      allDates.push(d.toISOString().split("T")[0]);
    }

    const isMultiDay = numberOfDays > 1;

    // Check rod limit (max_rods) and total guest limit (max_guests)
    const maxRods = property.max_rods;
    const maxGuests = property.max_guests;

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

    // Check existing bookings don't exceed capacity for ALL dates in range
    if (maxRods || maxGuests) {
      const { data: existingBookings } = await admin
        .from("bookings")
        .select("booking_date, party_size, non_fishing_guests")
        .eq("property_id", property_id)
        .in("booking_date", allDates)
        .in("status", ["pending", "confirmed"]);

      // Check each date individually
      for (const date of allDates) {
        const dayBookings = (existingBookings ?? []).filter(
          (b) => b.booking_date === date
        );
        const existingRods = dayBookings.reduce(
          (sum, b) => sum + (b.party_size ?? 0),
          0
        );
        const existingTotal = dayBookings.reduce(
          (sum, b) => sum + (b.party_size ?? 0) + (b.non_fishing_guests ?? 0),
          0
        );

        if (maxRods && existingRods + party_size > maxRods) {
          return NextResponse.json(
            {
              error: `This property has reached its rod limit for ${date}.`,
            },
            { status: 409 }
          );
        }

        if (maxGuests && existingTotal + totalPeople > maxGuests) {
          return NextResponse.json(
            {
              error: `This property has reached its guest capacity for ${date}.`,
            },
            { status: 409 }
          );
        }
      }
    }

    const isCrossClub = routing.isCrossClub;

    // ── Guide validation (optional add-on) ──────────────────────
    let guideRate = 0;
    let guideUserId: string | null = null;
    let guideName: string | null = null;

    if (guide_id) {
      // Verify guide exists and is approved
      const { data: guideProfile } = await admin
        .from("guide_profiles")
        .select("id, user_id, display_name, status, rate_full_day, rate_half_day, max_anglers")
        .eq("id", guide_id)
        .single();

      if (!guideProfile || guideProfile.status !== "approved") {
        return NextResponse.json(
          { error: "Selected guide is not available" },
          { status: 400 }
        );
      }

      // Verify guide has water approval for this property
      const { data: waterApproval } = await admin
        .from("guide_water_approvals")
        .select("id")
        .eq("guide_id", guide_id)
        .eq("property_id", property_id)
        .eq("status", "approved")
        .single();

      if (!waterApproval) {
        return NextResponse.json(
          { error: "Selected guide is not approved for this property" },
          { status: 400 }
        );
      }

      // Verify guide is available on ALL dates in the range
      const { data: blockedDates } = await admin
        .from("guide_availability")
        .select("id, date")
        .eq("guide_id", guide_id)
        .in("date", allDates)
        .in("status", ["blocked", "booked"]);

      if (blockedDates && blockedDates.length > 0) {
        const unavailableDate = blockedDates[0].date;
        return NextResponse.json(
          { error: `Selected guide is not available on ${unavailableDate}` },
          { status: 400 }
        );
      }

      // Check party size fits guide capacity
      if (guideProfile.max_anglers && party_size > guideProfile.max_anglers) {
        return NextResponse.json(
          { error: `Guide can accommodate up to ${guideProfile.max_anglers} anglers` },
          { status: 400 }
        );
      }

      guideRate =
        duration === "full_day"
          ? (guideProfile.rate_full_day ?? 0)
          : (guideProfile.rate_half_day ?? 0);
      guideUserId = guideProfile.user_id;
      guideName = guideProfile.display_name;
    }

    // Calculate full fee breakdown
    const ratePerRod =
      duration === "full_day"
        ? (property.rate_adult_full_day ?? 0)
        : (property.rate_adult_half_day ?? 0);

    const fees = calculateFeeBreakdown(ratePerRod, party_size, isCrossClub, guideRate, numberOfDays);

    // ── Create booking record(s) ──────────────────────────────────
    const bookingGroupId = isMultiDay ? crypto.randomUUID() : null;
    const confirmedAt = new Date().toISOString();

    const sharedFields = {
      property_id,
      angler_id: user.id,
      club_membership_id,
      duration,
      party_size,
      non_fishing_guests,
      is_cross_club: isCrossClub,
      message: message || null,
      status: "confirmed" as const,
      confirmed_at: confirmedAt,
      booking_days: numberOfDays,
      booking_start_date: startDate,
      booking_end_date: endDate,
      booking_group_id: bookingGroupId,
      ...(guide_id
        ? {
            guide_id,
            guide_rate: fees.guideRate,
            guide_service_fee: fees.guideServiceFee,
            guide_payout: fees.guidePayout,
          }
        : {}),
    };

    // Build insert rows: one per day
    const insertRows = allDates.map((date, idx) => ({
      ...sharedFields,
      booking_date: date,
      // Store full totals on the primary record (first day), zero on others
      base_rate: idx === 0 ? fees.baseRate : 0,
      platform_fee: idx === 0 ? fees.platformFee : 0,
      cross_club_fee: idx === 0 ? fees.crossClubFee : 0,
      home_club_referral: idx === 0 ? fees.homeClubReferral : 0,
      club_commission: idx === 0 ? fees.clubCommission : 0,
      landowner_payout: idx === 0 ? fees.landownerPayout : 0,
      total_amount: idx === 0 ? fees.totalAmount : 0,
    }));

    const { data: bookings, error: insertError } = await admin
      .from("bookings")
      .insert(insertRows)
      .select()
      .order("booking_date", { ascending: true });

    if (insertError) {
      // Check for unique constraint violation (double booking)
      if (insertError.code === "23505") {
        return NextResponse.json(
          {
            error:
              "A booking already exists for this property on one of the selected dates",
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

    // Primary booking is the first day's record
    const booking = bookings[0];

    // Mark guide availability as booked for ALL dates
    if (guide_id) {
      const guideAvailRows = allDates.map((date, idx) => ({
        guide_id,
        date,
        status: "booked" as const,
        booking_id: bookings[idx].id,
      }));
      await admin.from("guide_availability").upsert(guideAvailRows);
    }

    // Notify landowner (informational — booking is already confirmed)
    const { data: anglerProfile } = await admin
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();

    const anglerName = anglerProfile?.display_name ?? "An angler";

    const dateLabel = isMultiDay
      ? `${startDate} to ${endDate} (${numberOfDays} days)`
      : startDate;

    notifyBookingCreated(admin, {
      landownerId: property.owner_id,
      anglerName,
      propertyName: property.name,
      bookingDate: dateLabel,
      duration,
      partySize: party_size,
      bookingId: booking.id,
    }).catch((err) => console.error("[bookings] Notification error:", err));

    // Notify angler of instant confirmation
    notifyBookingConfirmed(admin, {
      anglerId: user.id,
      propertyName: property.name,
      bookingDate: dateLabel,
      bookingId: booking.id,
      guideName: guideName ?? undefined,
    }).catch((err) => console.error("[bookings] Confirmation notification error:", err));

    // Notify guide of new booking (if guide was selected)
    if (guideUserId && guide_id) {
      notifyGuideBookingCreated(admin, {
        guideUserId,
        anglerName,
        propertyName: property.name,
        bookingDate: dateLabel,
        bookingId: booking.id,
      }).catch((err) => console.error("[bookings] Guide notification error:", err));
    }

    return NextResponse.json({
      booking,
      booking_days: numberOfDays,
      booking_start_date: startDate,
      booking_end_date: endDate,
    }, { status: 201 });
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

      const { data: rawBookings, error } = await query;

      if (error) {
        console.error("[bookings] Landowner fetch error:", error);
        return NextResponse.json(
          { error: "Failed to fetch bookings" },
          { status: 500 }
        );
      }

      const bookings = deduplicateMultiDayBookings(rawBookings ?? []);
      return NextResponse.json({ bookings });
    }

    // Angler view: their own bookings
    const { data: rawBookings, error } = await admin
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

    const bookings = deduplicateMultiDayBookings(rawBookings ?? []);
    return NextResponse.json({ bookings });
  } catch (err) {
    console.error("[bookings] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
