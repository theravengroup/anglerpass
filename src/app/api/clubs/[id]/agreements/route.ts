import { createAdminClient } from "@/lib/supabase/admin";
import { requireClubManager, jsonOk, jsonCreated, jsonError, requireAuth} from "@/lib/api/helpers";
import { proposeAgreementSchema } from "@/lib/validations/clubs";

// GET: List all cross-club agreements for a club
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clubId } = await params;
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

    const admin = createAdminClient();

    // Verify user is club owner or staff
    const club = await requireClubManager(admin, clubId, user.id);
    if (!club) {
      // Also allow staff (requireClubManager only checks owner)
      const { data: staffMembership } = await admin
        .from("club_memberships")
        .select("id")
        .eq("club_id", clubId)
        .eq("user_id", user.id)
        .in("role", ["staff", "admin"])
        .eq("status", "active")
        .maybeSingle();

      if (!staffMembership) {
        return jsonError("Forbidden", 403);
      }
    }

    // Fetch agreements where this club is either club_a or club_b
    const { data: agreements, error } = await admin
      .from("cross_club_agreements")
      .select("*")
      .or(`club_a_id.eq.${clubId},club_b_id.eq.${clubId}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[agreements] Query error:", error);
      return jsonError("Failed to load agreements", 500);
    }

    if (!agreements?.length) {
      return jsonOk({ agreements: [] });
    }

    // Collect partner club IDs
    const partnerClubIds = agreements.map((a) =>
      a.club_a_id === clubId ? a.club_b_id : a.club_a_id
    );

    // Fetch partner club details
    const { data: partnerClubs } = await admin
      .from("clubs")
      .select("id, name, subscription_tier, location")
      .in("id", partnerClubIds);

    const clubMap = new Map(
      (partnerClubs ?? []).map((c) => [c.id, c])
    );

    // Build response
    const enriched = agreements.map((a) => {
      const partnerId = a.club_a_id === clubId ? a.club_b_id : a.club_a_id;
      const partner = clubMap.get(partnerId);

      return {
        id: a.id,
        partnerClub: {
          id: partnerId,
          name: partner?.name ?? "Unknown Club",
          tier: partner?.subscription_tier ?? "starter",
          location: partner?.location ?? null,
        },
        status: a.status,
        proposedAt: a.proposed_at,
        acceptedAt: a.accepted_at,
        revokedAt: a.revoked_at,
        isProposer: a.proposed_by === user.id,
      };
    });

    return jsonOk({ agreements: enriched });
  } catch (err) {
    console.error("[agreements] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}

// POST: Propose a new cross-club agreement
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clubId } = await params;
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

    const admin = createAdminClient();

    // Only club owner can propose (not staff)
    const club = await requireClubManager(admin, clubId, user.id);
    if (!club) {
      return jsonError("Only the club owner can propose agreements", 403);
    }

    const body = await request.json();
    const result = proposeAgreementSchema.safeParse(body);

    if (!result.success) {
      return jsonError(
        result.error.issues[0]?.message ?? "Invalid input",
        400
      );
    }

    const { partner_club_id } = result.data;

    if (partner_club_id === clubId) {
      return jsonError("Cannot create an agreement with your own club", 400);
    }

    // Check partner club exists
    const { data: partnerClub } = await admin
      .from("clubs")
      .select("id, subscription_tier")
      .eq("id", partner_club_id)
      .maybeSingle();

    if (!partnerClub) {
      return jsonError("Partner club not found", 404);
    }

    // Verify both clubs are Standard or Pro tier
    if (!["standard", "pro"].includes(club.subscription_tier)) {
      return jsonError(
        "Your club must be on Standard or Pro tier to create cross-club agreements",
        400
      );
    }

    if (!["standard", "pro"].includes(partnerClub.subscription_tier)) {
      return jsonError(
        "The partner club must be on Standard or Pro tier for cross-club agreements",
        400
      );
    }

    // Ensure club_a is the smaller UUID (to match unique constraint)
    const [clubAId, clubBId] =
      clubId < partner_club_id
        ? [clubId, partner_club_id]
        : [partner_club_id, clubId];

    // Check for existing active or pending agreement
    const { data: existing } = await admin
      .from("cross_club_agreements")
      .select("id, status")
      .eq("club_a_id", clubAId)
      .eq("club_b_id", clubBId)
      .in("status", ["pending", "active"])
      .maybeSingle();

    if (existing) {
      const label =
        existing.status === "active"
          ? "An active agreement already exists with this club"
          : "A pending agreement already exists with this club";
      return jsonError(label, 409);
    }

    // Create the agreement
    const { data: agreement, error } = await admin
      .from("cross_club_agreements")
      .insert({
        club_a_id: clubAId,
        club_b_id: clubBId,
        proposed_by: user.id,
        proposed_at: new Date().toISOString(),
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("[agreements] Insert error:", error);
      return jsonError("Failed to propose agreement", 500);
    }

    return jsonCreated({ agreement });
  } catch (err) {
    console.error("[agreements] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}
