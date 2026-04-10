import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth, jsonCreated, jsonError } from "@/lib/api/helpers";
import { corporateJoinSchema } from "@/lib/validations/clubs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (!auth) {
      return jsonError("Unauthorized", 401);
    }

    const { id: clubId } = await params;
    const body = await request.json();
    const parsed = corporateJoinSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
    }

    const { company_name, job_title } = parsed.data;
    const admin = createAdminClient();

    // Check club exists and has corporate memberships enabled
    const { data: club } = await admin
      .from("clubs")
      .select(
        "id, name, corporate_memberships_enabled, membership_application_required"
      )
      .eq("id", clubId)
      .maybeSingle();

    if (!club) {
      return jsonError("Club not found", 404);
    }

    if (!club.corporate_memberships_enabled) {
      return jsonError(
        "This club does not offer corporate memberships",
        400
      );
    }

    // Check if user already has an active or pending membership
    const { data: allMemberships } = await admin
      .from("club_memberships")
      .select("id, club_id, status")
      .eq("user_id", auth.user.id)
      .in("status", ["active", "pending"]);

    const activeClub = (allMemberships ?? []).find(
      (m) => m.status === "active"
    );
    const pendingClub = (allMemberships ?? []).find(
      (m) => m.status === "pending"
    );

    if (activeClub && activeClub.club_id !== clubId) {
      return jsonError(
        "You already have a home club. Through the Cross-Club Network, you can fish at partner clubs without needing to join them.",
        409
      );
    }

    if (pendingClub && pendingClub.club_id !== clubId) {
      return jsonError(
        "You already have a pending club request. Please wait for it to be approved or contact the club to withdraw it first.",
        409
      );
    }

    // Check if already a member of THIS club
    const { data: existing } = await admin
      .from("club_memberships")
      .select("id, status")
      .eq("club_id", clubId)
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (existing) {
      if (existing.status === "active") {
        return jsonError("You are already a member of this club", 409);
      }
      if (existing.status === "pending") {
        return jsonError("Your request to join is already pending", 409);
      }

      // If declined or inactive, update to pending corporate membership
      const { data: updatedMembership, error: updateError } = await admin
        .from("club_memberships")
        .update({
          status: "pending",
          dues_status: "pending",
          membership_type: "corporate",
          company_name,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .maybeSingle();

      if (updateError) {
        console.error("[corporate-join] Update error:", updateError);
        return jsonError("Failed to submit corporate join request", 500);
      }

      return jsonCreated({ membership: updatedMembership });
    }

    // Create new corporate membership (pending until payment completes)
    const { data: membership, error: insertError } = await admin
      .from("club_memberships")
      .insert({
        club_id: clubId,
        user_id: auth.user.id,
        role: "member",
        status: "pending",
        dues_status: "pending",
        membership_type: "corporate",
        company_name,
        invited_email: auth.user.email,
      })
      .select()
      .single();

    if (insertError) {
      console.error("[corporate-join] Insert error:", insertError);
      return jsonError("Failed to submit corporate join request", 500);
    }

    return jsonCreated({ membership });
  } catch (err) {
    console.error("[corporate-join] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}
