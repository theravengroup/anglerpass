import { jsonOk, jsonError, requireAuth, handleStripeError } from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createTransfer } from "@/lib/stripe/server";
import { payoutSchema } from "@/lib/validations/stripe";
import { requireEnabled } from "@/lib/feature-flags";
import { captureApiError } from "@/lib/observability";

/**
 * POST /api/stripe/payout
 *
 * Distributes funds from a captured booking payment using the booking's
 * payout snapshot (written at booking-creation time). This means future
 * reclassifications never retroactively change a pending booking's math.
 *
 * Recipients:
 * - Landowner: landowner_payout (rod_fee_split only — 0 in lease mode)
 * - Managing club: club_commission (club's split of the rod fee)
 * - Referring club: home_club_referral ($10/rod/day, cross-club only)
 * - Guide: guide_payout
 * - AnglerPass keeps: platform_fee + cross-club AP share + guide service fee
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

    // Fetch full booking data — including the payout snapshot that was
    // frozen at booking-creation time.
    const { data: booking } = await admin
      .from("bookings")
      .select(`
        id,
        property_id,
        angler_id,
        payment_status,
        stripe_payment_intent_id,
        amount_cents,
        platform_fee,
        party_size,
        duration,
        booking_date,
        booking_end_date,
        guide_id,
        club_membership_id,
        payout_distributed_at,
        is_cross_club,
        base_rate,
        total_amount,
        landowner_payout,
        club_commission,
        home_club_referral,
        guide_payout,
        guide_service_fee,
        cross_club_fee,
        referring_club_id,
        managing_club_id,
        pricing_mode,
        property_classification
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
      .select("id, owner_id")
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

    // Use the booking's payout snapshot — these columns were written at
    // booking-creation time from calculateFeeBreakdown() and are the source
    // of truth for what to transfer.
    const landownerPayout = booking.landowner_payout ?? 0;
    const clubCommission = booking.club_commission ?? 0;
    const homeClubReferral = booking.home_club_referral ?? 0;
    const guidePayout = booking.guide_payout ?? 0;
    const guideServiceFee = booking.guide_service_fee ?? 0;
    const platformFee = booking.platform_fee ?? 0;
    const crossClubFee = booking.cross_club_fee ?? 0;
    const totalAmount = booking.total_amount ?? 0;
    const isCrossClub = booking.is_cross_club ?? false;

    // AnglerPass revenue = platform fee + AP's share of cross-club fee
    // (crossClubFee − homeClubReferral) + guide service fee
    const anglerpassRevenue =
      platformFee + (crossClubFee - homeClubReferral) + guideServiceFee;

    const managingClubId = booking.managing_club_id;
    const referringClubId = booking.referring_club_id;

    const transferGroup = `booking_${bookingId}`;
    const transfers: Array<{ recipient: string; amount: number; accountId: string }> = [];

    // 1. Landowner payout (0 in lease mode — lease is paid upfront via ACH)
    if (landownerPayout > 0 && property.owner_id) {
      const { data: ownerProfile } = await admin
        .from("profiles")
        .select("stripe_connect_account_id")
        .eq("id", property.owner_id)
        .maybeSingle();

      if (ownerProfile?.stripe_connect_account_id) {
        const amountCents = Math.round(landownerPayout * 100);
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
          amount: landownerPayout,
          accountId: ownerProfile.stripe_connect_account_id,
        });
      }
    }

    // 2. Managing club commission (club's share of the rod fee)
    if (clubCommission > 0 && managingClubId) {
      const { data: club } = await admin
        .from("clubs")
        .select("stripe_connect_account_id")
        .eq("id", managingClubId)
        .maybeSingle();

      if (club?.stripe_connect_account_id) {
        const amountCents = Math.round(clubCommission * 100);
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
          amount: clubCommission,
          accountId: club.stripe_connect_account_id,
        });
      }
    }

    // 3. Referring club referral (cross-club only, $10/rod/day)
    if (isCrossClub && homeClubReferral > 0 && referringClubId) {
      const { data: homeClub } = await admin
        .from("clubs")
        .select("stripe_connect_account_id")
        .eq("id", referringClubId)
        .maybeSingle();

      if (homeClub?.stripe_connect_account_id) {
        const amountCents = Math.round(homeClubReferral * 100);
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
          amount: homeClubReferral,
          accountId: homeClub.stripe_connect_account_id,
        });
      }
    }

    // 4. Guide payout
    if (guidePayout > 0 && booking.guide_id) {
      const { data: guideProfile } = await admin
        .from("guide_profiles")
        .select("stripe_connect_account_id")
        .eq("user_id", booking.guide_id)
        .maybeSingle();

      if (guideProfile?.stripe_connect_account_id) {
        const amountCents = Math.round(guidePayout * 100);
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
          amount: guidePayout,
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
        total_amount: totalAmount,
        anglerpass_revenue: anglerpassRevenue,
        transfers: transfers.map((t) => ({
          recipient: t.recipient,
          amount: t.amount,
        })),
      },
    });

    return jsonOk({
      bookingId,
      feeBreakdown: {
        totalAmount,
        landownerPayout,
        clubCommission,
        homeClubReferral,
        guidePayout,
        anglerpassRevenue,
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
