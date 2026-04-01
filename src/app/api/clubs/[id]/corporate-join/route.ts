import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth, jsonCreated, jsonError } from "@/lib/api/helpers";

const corporateJoinSchema = z.object({
  company_name: z.string().min(1, "Company name is required").max(300),
  job_title: z.string().max(200).optional(),
});

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
    const { data: rawClub } = await admin
      .from("clubs")
      .select(
        "id, name, corporate_memberships_enabled, membership_application_required" as never
      )
      .eq("id", clubId)
      .single();

    const club = rawClub as unknown as {
      id: string;
      name: string;
      corporate_memberships_enabled: boolean;
      membership_application_required: boolean;
    } | null;

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
      (m: { id: string; club_id: string; status: string }) =>
        m.status === "active"
    );
    const pendingClub = (allMemberships ?? []).find(
      (m: { id: string; club_id: string; status: string }) =>
        m.status === "pending"
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
          status: club.membership_application_required ? "pending" : "active",
          membership_type: "corporate",
          company_name,
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", existing.id)
        .select()
        .single();

      if (updateError) {
        console.error("[corporate-join] Update error:", updateError);
        return jsonError("Failed to submit corporate join request", 500);
      }

      return jsonCreated({ membership: updatedMembership });
    }

    // Create new corporate membership
    const status = club.membership_application_required ? "pending" : "active";
    const { data: membership, error: insertError } = await admin
      .from("club_memberships")
      .insert({
        club_id: clubId,
        user_id: auth.user.id,
        role: "member",
        status,
        membership_type: "corporate",
        company_name,
        invited_email: auth.user.email,
        joined_at: status === "active" ? new Date().toISOString() : null,
      } as never)
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
