import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireClubManager, jsonOk, jsonError } from "@/lib/api/helpers";
import { agreementActionSchema } from "@/lib/validations/clubs";

// PATCH: Accept or revoke a cross-club agreement
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; agreementId: string }> }
) {
  try {
    const { id: clubId, agreementId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return jsonError("Unauthorized", 401);
    }

    const admin = createAdminClient();

    // Only club owner can accept/revoke (not staff)
    const club = await requireClubManager(admin, clubId, user.id);
    if (!club) {
      return jsonError("Only the club owner can manage agreements", 403);
    }

    const body = await request.json();
    const result = agreementActionSchema.safeParse(body);

    if (!result.success) {
      return jsonError(
        result.error.issues[0]?.message ?? "Invalid input",
        400
      );
    }

    const { action } = result.data;

    // Fetch the agreement
    const { data: agreement } = await admin
      .from("cross_club_agreements")
      .select("*")
      .eq("id", agreementId)
      .single();

    if (!agreement) {
      return jsonError("Agreement not found", 404);
    }

    // Verify this club is part of the agreement
    if (agreement.club_a_id !== clubId && agreement.club_b_id !== clubId) {
      return jsonError("Agreement not found", 404);
    }

    if (action === "accept") {
      // Only pending agreements can be accepted
      if (agreement.status !== "pending") {
        return jsonError("Only pending agreements can be accepted", 400);
      }

      // The proposer cannot accept their own agreement
      if (agreement.proposed_by === user.id) {
        return jsonError(
          "You cannot accept an agreement you proposed. The partner club must accept.",
          400
        );
      }

      const { data: updated, error } = await admin
        .from("cross_club_agreements")
        .update({
          status: "active",
          accepted_by: user.id,
          accepted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", agreementId)
        .select()
        .single();

      if (error) {
        console.error("[agreements] Accept error:", error);
        return jsonError("Failed to accept agreement", 500);
      }

      return jsonOk({ agreement: updated });
    }

    if (action === "revoke") {
      // Can revoke pending or active agreements
      if (!["pending", "active"].includes(agreement.status)) {
        return jsonError("This agreement has already been revoked", 400);
      }

      const { data: updated, error } = await admin
        .from("cross_club_agreements")
        .update({
          status: "revoked",
          revoked_by: user.id,
          revoked_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", agreementId)
        .select()
        .single();

      if (error) {
        console.error("[agreements] Revoke error:", error);
        return jsonError("Failed to revoke agreement", 500);
      }

      return jsonOk({ agreement: updated });
    }

    return jsonError("Invalid action", 400);
  } catch (err) {
    console.error("[agreements] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}
