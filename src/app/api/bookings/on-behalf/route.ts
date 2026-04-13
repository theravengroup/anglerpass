import { createAdminClient } from "@/lib/supabase/admin";
import { onBehalfBookingSchema } from "@/lib/validations/permissions";
import { calculateFeeBreakdown } from "@/lib/constants/fees";
import {
  notifyBookingCreated,
  notifyBookingConfirmed,
  notifyGuideBookingCreated,
} from "@/lib/notifications";
import { detectCrossClubRouting } from "@/lib/cross-club";
import { authorize, P, auditBookingAction, AuditAction } from "@/lib/permissions";
import { toDateString } from "@/lib/utils";
import { jsonError, jsonCreated, requireAuth, isDuplicateError } from "@/lib/api/helpers";
import { rateLimit, getClientIp } from "@/lib/api/rate-limit";

/**
 * POST /api/bookings/on-behalf
 *
 * Create a booking on behalf of a club member.
 * Requires: booking.create_on_behalf permission in the member's club context.
 *
 * The booking is owned by the angler (angler_id), but created_by_user_id
 * records the staff member who performed the action.
 */
export async function POST(request: Request) {
  const limited = rateLimit("bookings-on-behalf", getClientIp(request), 10, 60_000);
  if (limited) return limited;

  try {
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

    const body = await request.json();
    const result = onBehalfBookingSchema.safeParse(body);

    if (!result.success) {
      return jsonError(result.error.issues[0]?.message ?? "Invalid input", 400);
    }

    const {
      angler_id,
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

    // Verify the membership exists and belongs to the target angler
    const { data: membership, error: memError } = await admin
      .from("club_memberships")
      .select("id, club_id, user_id, status")
      .eq("id", club_membership_id)
      .eq("user_id", angler_id)
      .maybeSingle();

    if (memError || !membership) {
      return jsonError("Invalid club membership for this angler", 400);
    }

    if (membership.status !== "active") {
      return jsonError("The angler's club membership is not active", 400);
    }

    // Authorize: does the acting user have booking.create_on_behalf in this club?
    const authResult = await authorize({
      permission: P.BOOKING_CREATE_ON_BEHALF,
      userId: user.id,
      clubId: membership.club_id,
    });

    if (!authResult.allowed) {
      return jsonError("You do not have permission to create bookings on behalf of members in this club", 403);
    }

    // Verify the property is published
    const { data: property, error: propError } = await admin
      .from("properties")
      .select(
        "id, name, status, half_day_allowed, rate_adult_full_day, rate_adult_half_day, max_rods, max_guests, owner_id, location_description"
      )
      .eq("id", property_id)
      .maybeSingle();

    if (propError || !property) {
      return jsonError("Property not found", 404);
    }

    if (property.status !== "published") {
      return jsonError("This property is not currently accepting bookings", 400);
    }

    if (!property.owner_id) {
      return jsonError("This property has not been claimed by a landowner yet", 400);
    }

    if (duration === "half_day" && !property.half_day_allowed) {
      return jsonError("This property does not offer half-day bookings", 400);
    }

    // Determine access route
    const routing = await detectCrossClubRouting(admin, membership.club_id, property_id);

    if (!routing) {
      return jsonError("This club does not have access to this property", 403);
    }

    // Date range validation
    const startDate = booking_date;
    const endDate = booking_end_date && booking_end_date !== booking_date
      ? booking_end_date
      : booking_date;

    const startDateObj = new Date(startDate + "T00:00:00");
    const endDateObj = new Date(endDate + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDateObj <= today) {
      return jsonError("Booking date must be in the future", 400);
    }

    if (endDateObj < startDateObj) {
      return jsonError("End date cannot be before start date", 400);
    }

    const msPerDay = 24 * 60 * 60 * 1000;
    const numberOfDays =
      Math.round((endDateObj.getTime() - startDateObj.getTime()) / msPerDay) + 1;

    if (numberOfDays > 14) {
      return jsonError("Bookings cannot exceed 14 days", 400);
    }

    const allDates: string[] = [];
    for (let i = 0; i < numberOfDays; i++) {
      const d = new Date(startDateObj.getTime() + i * msPerDay);
      allDates.push(toDateString(d));
    }

    const isMultiDay = numberOfDays > 1;

    // Capacity checks
    const maxRods = property.max_rods;
    const maxGuests = property.max_guests;

    if (maxRods && party_size > maxRods) {
      return jsonError(`This property allows a maximum of ${maxRods} anglers (rods).`, 400);
    }

    const totalPeople = party_size + non_fishing_guests;
    if (maxGuests && totalPeople > maxGuests) {
      return jsonError(`This property allows a maximum of ${maxGuests} total people.`, 400);
    }

    if (maxRods || maxGuests) {
      const { data: existingBookings } = await admin
        .from("bookings")
        .select("booking_date, party_size, non_fishing_guests")
        .eq("property_id", property_id)
        .in("booking_date", allDates)
        .in("status", ["pending", "confirmed"]);

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
          return jsonError(`This property has reached its rod limit for ${date}.`, 409);
        }
        if (maxGuests && existingTotal + totalPeople > maxGuests) {
          return jsonError(`This property has reached its guest capacity for ${date}.`, 409);
        }
      }
    }

    const isCrossClub = routing.isCrossClub;

    // Guide validation (same as regular booking)
    let guideRate = 0;
    let guideUserId: string | null = null;
    let guideName: string | null = null;

    if (guide_id) {
      const { data: guideProfile } = await admin
        .from("guide_profiles")
        .select("id, user_id, display_name, status, rate_full_day, rate_half_day, max_anglers")
        .eq("id", guide_id)
        .maybeSingle();

      if (!guideProfile || guideProfile.status !== "approved") {
        return jsonError("Selected guide is not available", 400);
      }

      const { data: waterApproval } = await admin
        .from("guide_water_approvals")
        .select("id")
        .eq("guide_id", guide_id)
        .eq("property_id", property_id)
        .eq("status", "approved")
        .maybeSingle();

      if (!waterApproval) {
        return jsonError("Selected guide is not approved for this property", 400);
      }

      const { data: blockedDates } = await admin
        .from("guide_availability")
        .select("id, date")
        .eq("guide_id", guide_id)
        .in("date", allDates)
        .in("status", ["blocked", "booked"]);

      if (blockedDates && blockedDates.length > 0) {
        return jsonError(`Selected guide is not available on ${blockedDates[0].date}`, 400);
      }

      if (guideProfile.max_anglers && party_size > guideProfile.max_anglers) {
        return jsonError(`Guide can accommodate up to ${guideProfile.max_anglers} anglers`, 400);
      }

      guideRate =
        duration === "full_day"
          ? (guideProfile.rate_full_day ?? 0)
          : (guideProfile.rate_half_day ?? 0);
      guideUserId = guideProfile.user_id;
      guideName = guideProfile.display_name;
    }

    // Calculate fees
    const ratePerRod =
      duration === "full_day"
        ? (property.rate_adult_full_day ?? 0)
        : (property.rate_adult_half_day ?? 0);

    const fees = calculateFeeBreakdown(ratePerRod, party_size, isCrossClub, guideRate, numberOfDays);

    // Create booking records — key difference: on_behalf_of = true, created_by_user_id = staff
    const bookingGroupId = isMultiDay ? crypto.randomUUID() : null;
    const confirmedAt = new Date().toISOString();

    const sharedFields = {
      property_id,
      angler_id,
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
      created_by_user_id: user.id,
      on_behalf_of: true,
      ...(guide_id
        ? {
            guide_id,
            guide_rate: fees.guideRate,
            guide_service_fee: fees.guideServiceFee,
            guide_payout: fees.guidePayout,
          }
        : {}),
    };

    const insertRows = allDates.map((date, idx) => ({
      ...sharedFields,
      booking_date: date,
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
      if (isDuplicateError(insertError)) {
        return jsonError("A booking already exists for this property on one of the selected dates", 409);
      }
      console.error("[bookings/on-behalf] Insert error:", insertError);
      return jsonError("Failed to create booking", 500);
    }

    const booking = bookings[0];

    // Mark guide availability
    if (guide_id) {
      const guideAvailRows = allDates.map((date, idx) => ({
        guide_id,
        date,
        status: "booked" as const,
        booking_id: bookings[idx].id,
      }));
      await admin.from("guide_availability").upsert(guideAvailRows);
    }

    // Get names for notifications
    const [anglerProfile, staffProfile] = await Promise.all([
      admin.from("profiles").select("display_name").eq("id", angler_id).maybeSingle(),
      admin.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
    ]);

    const anglerName = anglerProfile.data?.display_name ?? "An angler";
    const staffName = staffProfile.data?.display_name ?? "Club staff";

    const dateLabel = isMultiDay
      ? `${startDate} to ${endDate} (${numberOfDays} days)`
      : startDate;

    // Notify landowner
    notifyBookingCreated(admin, {
      landownerId: property.owner_id,
      anglerName: `${anglerName} (booked by ${staffName})`,
      propertyName: property.name,
      bookingDate: dateLabel,
      duration,
      partySize: party_size,
      bookingId: booking.id,
    }).catch((err) => console.error("[bookings/on-behalf] Landowner notification error:", err));

    // Notify angler that a booking was created for them
    notifyBookingConfirmed(admin, {
      anglerId: angler_id,
      propertyName: property.name,
      bookingDate: startDate,
      bookingEndDate: isMultiDay ? endDate : undefined,
      bookingId: booking.id,
      duration,
      partySize: party_size,
      totalAmount: fees.totalAmount,
      guideName: guideName ?? undefined,
      propertyLocation: property.location_description ?? undefined,
    }).catch((err) => console.error("[bookings/on-behalf] Angler notification error:", err));

    // Notify guide if selected
    if (guideUserId && guide_id) {
      notifyGuideBookingCreated(admin, {
        guideUserId,
        anglerName,
        propertyName: property.name,
        bookingDate: dateLabel,
        bookingId: booking.id,
      }).catch((err) => console.error("[bookings/on-behalf] Guide notification error:", err));
    }

    // Audit log
    auditBookingAction({
      actorId: user.id,
      action: AuditAction.BOOKING_CREATED_ON_BEHALF,
      bookingId: booking.id,
      representedUserId: angler_id,
      clubId: membership.club_id,
      newData: {
        angler_id,
        property_id,
        booking_date: startDate,
        booking_end_date: endDate,
        party_size,
        duration,
        total_amount: fees.totalAmount,
        staff_name: staffName,
      },
    }).catch((err) => console.error("[bookings/on-behalf] Audit error:", err));

    return jsonCreated({
        booking,
        booking_days: numberOfDays,
        booking_start_date: startDate,
        booking_end_date: endDate,
        created_by: staffName,
        on_behalf_of: anglerName,
      });
  } catch (err) {
    console.error("[bookings/on-behalf] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}
