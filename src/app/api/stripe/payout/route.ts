import { jsonOk, jsonError, requireAuth, handleStripeError } from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createTransfer } from "@/lib/stripe/server";
import { calculateFeeBreakdown } from "@/lib/constants/fees";
import { payoutSchema } from "@/lib/validations/stripe";
import { requireEnabled } from "@/lib/feature-flags";
import { captureApiError } from "@/lib/observability";

/**
 * POST /api/stripe/payout
 *
 * Distributes funds from a captured booking payment to all parties:
 * - Landowner: rod fees minus club commission
 * - Club: $5/rod commission
 * - Home club: $5/rod referral (cross-club only)
 * - Guide: full guide rate
 * - AnglerPass keeps: platform fee + AP cross-club share + guide service fee
 *
 * Only admins or the property owner can trigger payouts.
 */
export async function POST(request: Request) {
  const killed = await requireEnabled("stripe.payout");
  if (killed) return killed;

  const auth = await requireAuth();
  if (!auth) return jsonError("Unauthorized", 401);

  try {
    const body = await request.json();
    const parsed = payoutSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError("Invalid request body", 400);
    }

    const { bookingId } = parsed.data;
    const admin = createAdminClient();

    // Fetch full booking data
    const { data: booking } = await admin
      .from("bookings")
      .select(`
        id,
        property_id,
        angler_id,
        payment_status,
        stripe_payment_intent_id,
        amount_cents,
        party_size,
        duration,
        booking_date,
        booking_end_date,
        guide_id,
        club_membership_id,
        payout_distributed_at
      `)
      .eq("id", bookingId)
      .maybeSingle();

    if (!booking) {
      return jsonError("Booking not found", 404);
    }

    if (booking.payment_status !== "succeeded") {
      return jsonError("Payment must be captured before payout", 409);
    }

    // Idempotency guard — if a prior call already distributed this payout,
    // short-circuit instead of double-paying every recipient. Stripe-level
    // idempotency_keys below provide a second layer of safety against
    // partial-failure retries, but this check avoids the round-trip entirely.
    if (booking.payout_distributed_at) {
      return jsonError("Payout has already been distributed for this booking", 409);
    }

    // Verify permissions (admin or property owner)
    const { data: property } = await admin
      .from("properties")
      .select("id, owner_id, rate_adult_full_day, rate_adult_half_day")
      .eq("id", booking.property_id)
      .maybeSingle();

    if (!property) {
      return jsonError("Property not found", 404);
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", auth.user.id)
      .maybeSingle();

    const isOwner = property.owner_id === auth.user.id;
    const isAdmin = profile?.role === "admin";

    if (!isOwner && !isAdmin) {
      return jsonError("Forbidden", 403);
    }

    // Find the club associated with this property (via club_property_access)
    const { data: clubProperty } = await admin
      .from("club_property_access")
      .select("club_id")
      .eq("property_id", booking.property_id)
      .limit(1)
      .maybeSingle();

    const propertyClubId = clubProperty?.club_id ?? null;

    // Calculate the fee breakdown
    const ratePerRod = booking.duration === "half_day"
      ? (property.rate_adult_half_day ?? 0)
      : (property.rate_adult_full_day ?? 0);

    // Determine if cross-club
    let isCrossClub = false;
    if (booking.club_membership_id && propertyClubId) {
      const { data: membership } = await admin
        .from("club_memberships")
        .select("club_id")
        .eq("id", booking.club_membership_id)
        .maybeSingle();

      if (membership && membership.club_id !== propertyClubId) {
        isCrossClub = true;
      }
    }

    // Get guide rate if applicable
    let guideRate = 0;
    if (booking.guide_id) {
      const { data: guideProfile } = await admin
        .from("guide_profiles")
        .select("rate_full_day, rate_half_day")
        .eq("user_id", booking.guide_id)
        .maybeSingle();

      if (guideProfile) {
        guideRate = booking.duration === "half_day"
          ? (guideProfile.rate_half_day ?? 0)
          : (guideProfile.rate_full_day ?? 0);
      }
    }

    const startDate = new Date(booking.booking_date + "T00:00:00");
    const endDate = booking.booking_end_date
      ? new Date(booking.booking_end_date + "T00:00:00")
      : startDate;
    const numberOfDays = Math.max(1, Math.round(
      (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)
    ) + 1);

    const fees = calculateFeeBreakdown(
      ratePerRod,
      booking.party_size,
      isCrossClub,
      guideRate,
      numberOfDays
    );

    const transferGroup = `booking_${bookingId}`;
    const transfers: Array<{ recipient: string; amount: number; accountId: string }> = [];

    // 1. Landowner payout
    if (fees.landownerPayout > 0 && property.owner_id) {
      const { data: ownerProfile } = await admin
        .from("profiles")
        .select("stripe_connect_account_id")
        .eq("id", property.owner_id)
        .maybeSingle();

      if (ownerProfile?.stripe_connect_account_id) {
        const amountCents = Math.round(fees.landownerPayout * 100);
        await createTransfer(
          {
            amountCents,
            destinationAccountId: ownerProfile.stripe_connect_account_id,
            transferGroup,
            metadata: {
              booking_id: bookingId,
              type: "landowner_payout",
            },
          },
          { idempotencyKey: `payout:${bookingId}:landowner` }
        );
        transfers.push({
          recipient: "landowner",
          amount: fees.landownerPayout,
          accountId: ownerProfile.stripe_connect_account_id,
        });
      }
    }

    // 2. Club commission
    if (fees.clubCommission > 0 && propertyClubId) {
      const { data: club } = await admin
        .from("clubs")
        .select("stripe_connect_account_id")
        .eq("id", propertyClubId)
        .maybeSingle();

      if (club?.stripe_connect_account_id) {
        const amountCents = Math.round(fees.clubCommission * 100);
        await createTransfer(
          {
            amountCents,
            destinationAccountId: club.stripe_connect_account_id,
            transferGroup,
            metadata: {
              booking_id: bookingId,
              type: "club_commission",
            },
          },
          { idempotencyKey: `payout:${bookingId}:club` }
        );
        transfers.push({
          recipient: "club",
          amount: fees.clubCommission,
          accountId: club.stripe_connect_account_id,
        });
      }
    }

    // 3. Home club referral (cross-club only)
    if (isCrossClub && fees.homeClubReferral > 0 && booking.club_membership_id) {
      const { data: membership } = await admin
        .from("club_memberships")
        .select("club_id")
        .eq("id", booking.club_membership_id)
        .maybeSingle();

      if (membership?.club_id) {
        const { data: homeClub } = await admin
          .from("clubs")
          .select("stripe_connect_account_id")
          .eq("id", membership.club_id)
          .maybeSingle();

        if (homeClub?.stripe_connect_account_id) {
          const amountCents = Math.round(fees.homeClubReferral * 100);
          await createTransfer(
            {
              amountCents,
              destinationAccountId: homeClub.stripe_connect_account_id,
              transferGroup,
              metadata: {
                booking_id: bookingId,
                type: "home_club_referral",
              },
            },
            { idempotencyKey: `payout:${bookingId}:home_club` }
          );
          transfers.push({
            recipient: "home_club",
            amount: fees.homeClubReferral,
            accountId: homeClub.stripe_connect_account_id,
          });
        }
      }
    }

    // 4. Guide payout
    if (fees.guidePayout > 0 && booking.guide_id) {
      const { data: guideProfile } = await admin
        .from("guide_profiles")
        .select("stripe_connect_account_id")
        .eq("user_id", booking.guide_id)
        .maybeSingle();

      if (guideProfile?.stripe_connect_account_id) {
        const amountCents = Math.round(fees.guidePayout * 100);
        await createTransfer(
          {
            amountCents,
            destinationAccountId: guideProfile.stripe_connect_account_id,
            transferGroup,
            metadata: {
              booking_id: bookingId,
              type: "guide_payout",
            },
          },
          { idempotencyKey: `payout:${bookingId}:guide` }
        );
        transfers.push({
          recipient: "guide",
          amount: fees.guidePayout,
          accountId: guideProfile.stripe_connect_account_id,
        });
      }
    }

    // Mark payout as distributed (idempotency guard for future retries).
    await admin
      .from("bookings")
      .update({ payout_distributed_at: new Date().toISOString() })
      .eq("id", bookingId);

    // Audit log
    await admin.from("audit_log").insert({
      action: "booking.payout_distributed",
      entity_type: "booking",
      entity_id: bookingId,
      actor_id: auth.user.id,
      new_data: {
        total_amount: fees.totalAmount,
        anglerpass_revenue: fees.anglerpassRevenue,
        transfers: transfers.map((t) => ({
          recipient: t.recipient,
          amount: t.amount,
        })),
      },
    });

    return jsonOk({
      bookingId,
      feeBreakdown: {
        totalAmount: fees.totalAmount,
        landownerPayout: fees.landownerPayout,
        clubCommission: fees.clubCommission,
        homeClubReferral: fees.homeClubReferral,
        guidePayout: fees.guidePayout,
        anglerpassRevenue: fees.anglerpassRevenue,
      },
      transfers: transfers.map((t) => ({
        recipient: t.recipient,
        amount: t.amount,
      })),
    });
  } catch (err) {
    const breakerResponse = handleStripeError(err);
    if (breakerResponse) return breakerResponse;
    captureApiError(err, {
      route: "stripe/payout",
      userId: auth.user.id,
    });
    return jsonError("Failed to distribute payout", 500);
  }
}
