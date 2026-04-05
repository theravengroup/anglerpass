import { jsonError, jsonOk } from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { proposalResponseSchema } from "@/lib/validations/proposals";
import { calculateFeeBreakdown } from "@/lib/constants/fees";
import {
  notifyProposalAccepted,
  notifyProposalDeclined,
} from "@/lib/notifications";

// POST: Angler responds to a proposal invitation
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: proposalId } = await params;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return jsonError("Unauthorized", 401);
    }

    const body = await request.json();
    const result = proposalResponseSchema.safeParse(body);

    if (!result.success) {
      return jsonError(result.error.issues[0]?.message ?? "Invalid input", 400);
    }

    const { response } = result.data;

    const admin = createAdminClient();

    // Verify the invitee record exists and is pending
    const { data: invitee, error: inviteeError } = await admin
      .from("guide_trip_proposal_invitees")
      .select("*")
      .eq("proposal_id", proposalId)
      .eq("angler_id", user.id)
      .single();

    if (inviteeError || !invitee) {
      return jsonError("You are not invited to this proposal", 404);
    }

    if (invitee.status !== "pending") {
      return jsonError(`You have already ${invitee.status} this proposal`, 400);
    }

    // Fetch the proposal and verify it is still active
    const { data: proposal, error: proposalError } = await admin
      .from("guide_trip_proposals")
      .select(
        `
        *,
        properties(
          id, name, rate_adult_full_day, owner_id, max_rods, max_guests
        ),
        guide_profiles(id, user_id, display_name, rate_full_day)
      `
      )
      .eq("id", proposalId)
      .single();

    if (proposalError || !proposal) {
      return jsonError("Proposal not found", 404);
    }

    if (proposal.status !== "sent") {
      return jsonError("This proposal is no longer active", 400);
    }

    // Check expiration
    if (proposal.expires_at) {
      const expiresAt = new Date(proposal.expires_at);
      if (expiresAt < new Date()) {
        // Mark as expired
        await admin
          .from("guide_trip_proposals")
          .update({ status: "expired", updated_at: new Date().toISOString() })
          .eq("id", proposalId);

        return jsonError("This proposal has expired", 400);
      }
    }

    const now = new Date().toISOString();

    // ── Accepted ─────────────────────────────────────────────────
    if (response === "accepted") {
      // Update invitee status
      const { error: updateInviteeErr } = await admin
        .from("guide_trip_proposal_invitees")
        .update({ status: "accepted", responded_at: now })
        .eq("id", invitee.id);

      if (updateInviteeErr) {
        console.error("[proposals] Invitee update error:", updateInviteeErr);
        return jsonError("Failed to update response", 500);
      }

      // Check if at least one invitee has accepted (including this one)
      const { data: allInvitees } = await admin
        .from("guide_trip_proposal_invitees")
        .select("id, status")
        .eq("proposal_id", proposalId);

      const hasAccepted = (allInvitees ?? []).some(
        (inv) => inv.status === "accepted"
      );

      if (hasAccepted && proposal.status === "sent") {
        // Update proposal status to accepted
        await admin
          .from("guide_trip_proposals")
          .update({ status: "accepted", updated_at: now })
          .eq("id", proposalId);
      }

      // ── Create a confirmed booking ──────────────────────────
      const property = proposal.properties;
      const guideProfile = proposal.guide_profiles;

      if (!property || !guideProfile) {
        return jsonError("Proposal is missing property or guide data", 500);
      }

      // Find the angler's active club membership for this property's club
      let clubMembershipId: string | null = null;
      let isCrossClub = false;

      if (proposal.club_id) {
        const { data: membership } = await admin
          .from("club_memberships")
          .select("id")
          .eq("user_id", user.id)
          .eq("club_id", proposal.club_id)
          .eq("status", "active")
          .maybeSingle();

        if (membership) {
          clubMembershipId = membership.id;
        } else {
          // Cross-club: find any active membership for this angler
          const { data: anyMembership } = await admin
            .from("club_memberships")
            .select("id")
            .eq("user_id", user.id)
            .eq("status", "active")
            .limit(1)
            .maybeSingle();

          if (anyMembership) {
            clubMembershipId = anyMembership.id;
            isCrossClub = true;
          }
        }
      }

      if (!clubMembershipId) {
        return jsonError(
          "No active club membership found. You need a club membership to accept a proposal.",
          400
        );
      }

      // Calculate fees
      const ratePerRod = property.rate_adult_full_day ?? 0;
      const rodCount = proposal.max_anglers ?? 1;
      const totalGuideRate =
        (proposal.guide_fee_per_angler ?? 0) * rodCount;

      const fees = calculateFeeBreakdown(
        ratePerRod,
        rodCount,
        isCrossClub,
        totalGuideRate
      );

      // Insert booking (matching existing booking creation pattern)
      const confirmedAt = new Date().toISOString();

      const { data: booking, error: bookingError } = await admin
        .from("bookings")
        .insert({
          property_id: property.id,
          angler_id: user.id,
          club_membership_id: clubMembershipId,
          booking_date: proposal.proposed_date,
          booking_start_date: proposal.proposed_date,
          booking_end_date: proposal.proposed_date,
          duration: "full_day",
          party_size: rodCount,
          non_fishing_guests: 0,
          is_cross_club: isCrossClub,
          message: proposal.notes || null,
          status: "confirmed",
          confirmed_at: confirmedAt,
          booking_days: 1,
          booking_group_id: null,
          created_by_user_id: user.id,
          on_behalf_of: false,
          guide_id: guideProfile.id,
          guide_rate: fees.guideRate,
          guide_service_fee: fees.guideServiceFee,
          guide_payout: fees.guidePayout,
          base_rate: fees.baseRate,
          platform_fee: fees.platformFee,
          cross_club_fee: fees.crossClubFee,
          home_club_referral: fees.homeClubReferral,
          club_commission: fees.clubCommission,
          landowner_payout: fees.landownerPayout,
          total_amount: fees.totalAmount,
        })
        .select()
        .single();

      if (bookingError) {
        console.error("[proposals] Booking creation error:", bookingError);
        return jsonError("Failed to create booking from proposal", 500);
      }

      // TODO: Stripe — create PaymentIntent for proposal acceptance

      // Fetch angler name for notification
      const { data: anglerProfile } = await admin
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single();

      const anglerName = anglerProfile?.display_name ?? "An angler";

      // Notify guide
      notifyProposalAccepted(admin, {
        guideUserId: guideProfile.user_id,
        anglerName,
        propertyName: property.name,
        proposalId,
      }).catch((err) =>
        console.error("[proposals] Notification error:", err)
      );

      return jsonOk({
        invitee: { ...invitee, status: "accepted", responded_at: now },
        booking,
      });
    }

    // ── Declined ─────────────────────────────────────────────────
    if (response === "declined") {
      // Update invitee status
      const { error: updateInviteeErr } = await admin
        .from("guide_trip_proposal_invitees")
        .update({ status: "declined", responded_at: now })
        .eq("id", invitee.id);

      if (updateInviteeErr) {
        console.error("[proposals] Invitee update error:", updateInviteeErr);
        return jsonError("Failed to update response", 500);
      }

      // Check if ALL invitees have now declined
      const { data: allInvitees } = await admin
        .from("guide_trip_proposal_invitees")
        .select("id, status")
        .eq("proposal_id", proposalId);

      const allDeclined = (allInvitees ?? []).every(
        (inv) => inv.status === "declined"
      );

      if (allDeclined) {
        await admin
          .from("guide_trip_proposals")
          .update({ status: "declined", updated_at: now })
          .eq("id", proposalId);
      }

      // Fetch angler name for notification
      const { data: anglerProfile } = await admin
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single();

      const anglerName = anglerProfile?.display_name ?? "An angler";

      // Notify guide
      const guideProfile = proposal.guide_profiles;
      if (guideProfile) {
        notifyProposalDeclined(admin, {
          guideUserId: guideProfile.user_id,
          anglerName,
          propertyName: proposal.properties?.name ?? "a property",
          proposalId,
        }).catch((err) =>
          console.error("[proposals] Notification error:", err)
        );
      }

      return jsonOk({
        invitee: { ...invitee, status: "declined", responded_at: now },
      });
    }

    return jsonError("Invalid response", 400);
  } catch (err) {
    console.error("[proposals] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}
