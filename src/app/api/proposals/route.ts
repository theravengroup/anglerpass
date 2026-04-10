import { jsonCreated, jsonError, jsonOk, requireAuth} from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { toDateString } from "@/lib/utils";
import { createProposalSchema, saveDraftProposalSchema } from "@/lib/validations/proposals";
import { notifyProposalReceived } from "@/lib/notifications";

// GET: List proposals for the current user
export async function GET(request: Request) {
  try {
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");

    const admin = createAdminClient();

    if (role === "guide") {
      // Guide view: proposals they created
      const { data: guideProfile } = await admin
        .from("guide_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!guideProfile) {
        return jsonError("Guide profile not found", 404);
      }

      const { data: proposals, error } = await admin
        .from("guide_trip_proposals")
        .select(
          "*, properties(name), guide_trip_proposal_invitees(id)"
        )
        .eq("guide_id", guideProfile.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[proposals] Guide fetch error:", error);
        return jsonError("Failed to fetch proposals", 500);
      }

      // Map to include invitee count
      const mapped = (proposals ?? []).map((p) => ({
        ...p,
        invitee_count: p.guide_trip_proposal_invitees?.length ?? 0,
        guide_trip_proposal_invitees: undefined,
      }));

      return jsonOk({ proposals: mapped });
    }

    // Angler view: proposals where user is an invitee
    const { data: invitations, error } = await admin
      .from("guide_trip_proposal_invitees")
      .select(
        "*, guide_trip_proposals(*, guide_profiles(display_name), properties(name))"
      )
      .eq("angler_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[proposals] Angler fetch error:", error);
      return jsonError("Failed to fetch proposals", 500);
    }

    // Flatten invitations to proposal-centric view
    const proposals = (invitations ?? []).map((inv) => ({
      ...inv.guide_trip_proposals,
      invitee_status: inv.status,
      invitee_id: inv.id,
    }));

    return jsonOk({ proposals });
  } catch (err) {
    console.error("[proposals] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}

// POST: Create a new proposal (send or draft)
export async function POST(request: Request) {
  try {
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

    const body = await request.json();
    const action = body.action ?? "send";

    const admin = createAdminClient();

    // Verify user is an approved guide
    const { data: guideProfile } = await admin
      .from("guide_profiles")
      .select("id, display_name, status")
      .eq("user_id", user.id)
      .single();

    if (!guideProfile || guideProfile.status !== "approved") {
      return jsonError("You must be an approved guide to create proposals", 403);
    }

    // ── Draft path ───────────────────────────────────────────────
    if (action === "draft") {
      const result = saveDraftProposalSchema.safeParse(body);
      if (!result.success) {
        return jsonError(result.error.issues[0]?.message ?? "Invalid input", 400);
      }

      const data = result.data;

      // If property_id is provided, verify water approval
      let clubId: string | null = null;
      if (data.property_id) {
        const { data: waterApproval } = await admin
          .from("guide_water_approvals")
          .select("id, club_id")
          .eq("guide_id", guideProfile.id)
          .eq("property_id", data.property_id)
          .eq("status", "approved")
          .single();

        if (!waterApproval) {
          return jsonError("You are not approved to guide on this property", 403);
        }
        clubId = waterApproval.club_id;
      }

      if (!data.property_id || !clubId) {
        return jsonError("Property is required to save a draft", 400);
      }

      const { data: proposal, error: insertError } = await admin
        .from("guide_trip_proposals")
        .insert({
          guide_id: guideProfile.id,
          property_id: data.property_id,
          club_id: clubId,
          proposed_date: data.proposed_date || toDateString(),
          start_time: data.start_time || "08:00",
          duration_hours: data.duration_hours ?? 4,
          max_anglers: data.max_anglers ?? 1,
          guide_fee_per_angler: data.guide_fee_per_angler ?? 0,
          notes: data.notes || null,
          status: "draft",
        })
        .select()
        .single();

      if (insertError) {
        console.error("[proposals] Draft insert error:", insertError);
        return jsonError("Failed to save draft", 500);
      }

      // Insert invitees if provided
      if (data.invitee_ids && data.invitee_ids.length > 0) {
        const inviteeRows = data.invitee_ids.map((anglerId) => ({
          proposal_id: proposal.id,
          angler_id: anglerId,
          status: "pending" as const,
        }));

        const { error: inviteeError } = await admin
          .from("guide_trip_proposal_invitees")
          .insert(inviteeRows);

        if (inviteeError) {
          console.error("[proposals] Draft invitee insert error:", inviteeError);
        }
      }

      return jsonCreated({ proposal });
    }

    // ── Send path ────────────────────────────────────────────────
    const result = createProposalSchema.safeParse(body);
    if (!result.success) {
      return jsonError(result.error.issues[0]?.message ?? "Invalid input", 400);
    }

    const data = result.data;

    // Verify water approval and derive club_id
    const { data: waterApproval } = await admin
      .from("guide_water_approvals")
      .select("id, club_id")
      .eq("guide_id", guideProfile.id)
      .eq("property_id", data.property_id)
      .eq("status", "approved")
      .single();

    if (!waterApproval) {
      return jsonError("You are not approved to guide on this property", 403);
    }

    // Validate proposed_date is in the future
    const proposedDateObj = new Date(data.proposed_date + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (proposedDateObj <= today) {
      return jsonError("Proposed date must be in the future", 400);
    }

    // Set expiration to 72 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 72);

    const { data: proposal, error: insertError } = await admin
      .from("guide_trip_proposals")
      .insert({
        guide_id: guideProfile.id,
        property_id: data.property_id,
        club_id: waterApproval.club_id,
        proposed_date: data.proposed_date,
        start_time: data.start_time,
        duration_hours: data.duration_hours,
        max_anglers: data.max_anglers,
        guide_fee_per_angler: data.guide_fee_per_angler,
        notes: data.notes || null,
        status: "sent",
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("[proposals] Insert error:", insertError);
      return jsonError("Failed to create proposal", 500);
    }

    // Insert invitees
    const inviteeRows = data.invitee_ids.map((anglerId) => ({
      proposal_id: proposal.id,
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

    // Fetch property name for notifications
    const { data: property } = await admin
      .from("properties")
      .select("name")
      .eq("id", data.property_id)
      .single();

    const propertyName = property?.name ?? "a property";

    // Notify each invitee
    for (const anglerId of data.invitee_ids) {
      notifyProposalReceived(admin, {
        anglerId,
        guideName: guideProfile.display_name,
        propertyName,
        proposedDate: data.proposed_date,
        proposalId: proposal.id,
      }).catch((err) =>
        console.error("[proposals] Notification error:", err)
      );
    }

    return jsonCreated({ proposal });
  } catch (err) {
    console.error("[proposals] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}
