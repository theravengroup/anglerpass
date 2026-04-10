import { jsonError, jsonOk, requireAuth} from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateFeeBreakdown } from "@/lib/constants/fees";
import { notifyProposalReceived } from "@/lib/notifications";

// GET: Fetch full proposal detail
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const auth = await requireAuth();


    if (!auth) return jsonError("Unauthorized", 401);


    const { user } = auth;

    const admin = createAdminClient();

    // Fetch the proposal with property and guide details
    const { data: proposal, error } = await admin
      .from("guide_trip_proposals")
      .select(
        `
        *,
        properties(
          id, name, rate_adult_full_day, rate_adult_half_day,
          location_description, water_type, photos
        ),
        guide_profiles(
          user_id, display_name, bio, profile_photo_url,
          rating_avg, rating_count, techniques, species
        )
      `
      )
      .eq("id", id)
      .maybeSingle();

    if (error || !proposal) {
      return jsonError("Proposal not found", 404);
    }

    // Auth check: user must be the guide or an invitee
    const isGuide = proposal.guide_profiles?.user_id === user.id;

    let isInvitee = false;
    if (!isGuide) {
      const { data: invitee } = await admin
        .from("guide_trip_proposal_invitees")
        .select("id")
        .eq("proposal_id", id)
        .eq("angler_id", user.id)
        .maybeSingle();

      isInvitee = !!invitee;
    }

    if (!isGuide && !isInvitee) {
      return jsonError("You do not have access to this proposal", 403);
    }

    // Fetch invitees with profile display names
    const { data: invitees } = await admin
      .from("guide_trip_proposal_invitees")
      .select("*, profiles(display_name)")
      .eq("proposal_id", id)
      .order("created_at", { ascending: true });

    // Calculate fee breakdown
    const ratePerRod = proposal.properties?.rate_adult_full_day ?? 0;
    const rodCount = proposal.max_anglers ?? 1;
    const totalGuideRate =
      (proposal.guide_fee_per_angler ?? 0) * rodCount;

    // For cross-club detection we would need to know the angler's club.
    // For the guide view, return the base (non-cross-club) breakdown.
    // For angler view, we check if the angler has direct access or cross-club.
    let isCrossClub = false;

    if (isInvitee && proposal.club_id) {
      // Check if the angler has an active membership in the proposal's club
      const { data: directMembership } = await admin
        .from("club_memberships")
        .select("id")
        .eq("user_id", user.id)
        .eq("club_id", proposal.club_id)
        .eq("status", "active")
        .maybeSingle();

      if (!directMembership) {
        // Angler is not a direct member of this club -- cross-club
        isCrossClub = true;
      }
    }

    const fees = calculateFeeBreakdown(
      ratePerRod,
      rodCount,
      isCrossClub,
      totalGuideRate
    );

    return jsonOk({
      proposal: {
        ...proposal,
        invitees: invitees ?? [],
        fees,
      },
    });
  } catch (err) {
    console.error("[proposals] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}

// PATCH: Update proposal (guide only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const auth = await requireAuth();


    if (!auth) return jsonError("Unauthorized", 401);


    const { user } = auth;

    const admin = createAdminClient();

    // Verify user is the guide who owns this proposal
    const { data: guideProfile } = await admin
      .from("guide_profiles")
      .select("id, display_name")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!guideProfile) {
      return jsonError("Guide profile not found", 404);
    }

    const { data: proposal, error: fetchError } = await admin
      .from("guide_trip_proposals")
      .select("*")
      .eq("id", id)
      .eq("guide_id", guideProfile.id)
      .maybeSingle();

    if (fetchError || !proposal) {
      return jsonError("Proposal not found or you do not own it", 404);
    }

    const body = await request.json();
    const action = body.action;

    // ── Send action ──────────────────────────────────────────────
    if (action === "send") {
      if (proposal.status !== "draft") {
        return jsonError("Only draft proposals can be sent", 400);
      }

      // Validate required fields exist on the proposal
      if (
        !proposal.property_id ||
        !proposal.proposed_date ||
        !proposal.start_time ||
        !proposal.duration_hours ||
        !proposal.max_anglers ||
        proposal.guide_fee_per_angler == null
      ) {
        return jsonError(
          "Complete all required fields before sending: property, date, time, duration, max anglers, and fee",
          400
        );
      }

      // Validate proposed_date is in the future
      const proposedDateObj = new Date(proposal.proposed_date + "T00:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (proposedDateObj <= today) {
        return jsonError("Proposed date must be in the future", 400);
      }

      // Check we have at least one invitee
      const { data: existingInvitees } = await admin
        .from("guide_trip_proposal_invitees")
        .select("id, angler_id")
        .eq("proposal_id", id);

      // Insert new invitees from body if provided
      const newInviteeIds: string[] = body.invitee_ids ?? [];
      const existingAnglerIds = new Set(
        (existingInvitees ?? []).map((inv) => inv.angler_id)
      );
      const toInsert = newInviteeIds.filter(
        (aid) => !existingAnglerIds.has(aid)
      );

      if (toInsert.length > 0) {
        const inviteeRows = toInsert.map((anglerId) => ({
          proposal_id: id,
          angler_id: anglerId,
          status: "pending" as const,
        }));

        const { error: inviteeError } = await admin
          .from("guide_trip_proposal_invitees")
          .insert(inviteeRows);

        if (inviteeError) {
          console.error("[proposals] Invitee insert error:", inviteeError);
          return jsonError("Failed to add invitees", 500);
        }
      }

      // Re-fetch all invitees to verify at least one exists
      const { data: allInvitees } = await admin
        .from("guide_trip_proposal_invitees")
        .select("id, angler_id")
        .eq("proposal_id", id);

      if (!allInvitees || allInvitees.length === 0) {
        return jsonError("At least one invitee is required to send a proposal", 400);
      }

      // Set expiration to 72 hours from now
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 72);

      const { data: updated, error: updateError } = await admin
        .from("guide_trip_proposals")
        .update({
          status: "sent",
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .maybeSingle();

      if (updateError) {
        console.error("[proposals] Send update error:", updateError);
        return jsonError("Failed to send proposal", 500);
      }

      // Fetch property name for notifications
      const { data: property } = await admin
        .from("properties")
        .select("name")
        .eq("id", proposal.property_id)
        .maybeSingle();

      const propertyName = property?.name ?? "a property";

      // Notify all invitees
      for (const inv of allInvitees) {
        notifyProposalReceived(admin, {
          anglerId: inv.angler_id,
          guideName: guideProfile.display_name,
          propertyName,
          proposedDate: proposal.proposed_date,
          proposalId: id,
        }).catch((err) =>
          console.error("[proposals] Notification error:", err)
        );
      }

      return jsonOk({ proposal: updated });
    }

    // ── Cancel action ────────────────────────────────────────────
    if (action === "cancel") {
      if (proposal.status === "cancelled") {
        return jsonError("Proposal is already cancelled", 400);
      }

      const { data: updated, error: updateError } = await admin
        .from("guide_trip_proposals")
        .update({
          status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .maybeSingle();

      if (updateError) {
        console.error("[proposals] Cancel update error:", updateError);
        return jsonError("Failed to cancel proposal", 500);
      }

      return jsonOk({ proposal: updated });
    }

    return jsonError("Invalid action. Use 'send' or 'cancel'.", 400);
  } catch (err) {
    console.error("[proposals] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}
