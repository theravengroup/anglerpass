import { jsonError, jsonOk, requireAuth } from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { guideAffiliationActionSchema } from "@/lib/validations/guides";
import {
  notifyGuideAffiliationApproved,
  notifyGuideAffiliationRejected,
} from "@/lib/notifications";

// PATCH: Approve or reject a guide affiliation
export async function PATCH(
  request: Request,
  {
    params,
  }: { params: Promise<{ id: string; affiliationId: string }> }
) {
  try {
    const { id: clubId, affiliationId } = await params;

    const auth = await requireAuth();
    if (!auth) {
      return jsonError("Unauthorized", 401);
    }

    const body = await request.json();
    const result = guideAffiliationActionSchema.safeParse(body);

    if (!result.success) {
      return jsonError(
        result.error.issues[0]?.message ?? "Invalid input",
        400
      );
    }

    const admin = createAdminClient();

    // Verify user is the club owner/manager
    const { data: club } = await admin
      .from("clubs")
      .select("id, owner_id, name")
      .eq("id", clubId)
      .single();

    if (!club) {
      return jsonError("Club not found", 404);
    }

    if (club.owner_id !== auth.user.id) {
      const { data: membership } = await admin
        .from("club_memberships")
        .select("role")
        .eq("club_id", clubId)
        .eq("user_id", auth.user.id)
        .eq("status", "active")
        .in("role", ["owner", "admin", "club_admin", "ops_staff", "staff"])
        .maybeSingle();

      if (!membership) {
        return jsonError("Forbidden", 403);
      }
    }

    // Fetch the affiliation
    const { data: affiliation } = await admin
      .from("guide_club_affiliations")
      .select("id, guide_id, club_id, status")
      .eq("id", affiliationId)
      .eq("club_id", clubId)
      .single();

    if (!affiliation) {
      return jsonError("Affiliation not found", 404);
    }

    if (affiliation.status !== "pending") {
      return jsonError(
        `Cannot update an affiliation with status "${affiliation.status}"`,
        400
      );
    }

    const newStatus = result.data.status;

    const { data: updated, error } = await admin
      .from("guide_club_affiliations")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", affiliationId)
      .select(
        "id, guide_id, status, label, updated_at, guide_profiles(id, user_id, display_name)"
      )
      .single();

    if (error) {
      console.error("[clubs/guide-affiliations] Update error:", error);
      return jsonError("Failed to update affiliation", 500);
    }

    // Get guide user_id for notification
    const guideProfile = updated.guide_profiles as unknown as {
      id: string;
      user_id: string;
      display_name: string;
    } | null;

    if (guideProfile) {
      if (newStatus === "active") {
        notifyGuideAffiliationApproved(admin, {
          guideUserId: guideProfile.user_id,
          clubName: club.name,
        }).catch((err) =>
          console.error(
            "[clubs/guide-affiliations] Notification error:",
            err
          )
        );
      } else if (newStatus === "rejected") {
        notifyGuideAffiliationRejected(admin, {
          guideUserId: guideProfile.user_id,
          clubName: club.name,
        }).catch((err) =>
          console.error(
            "[clubs/guide-affiliations] Notification error:",
            err
          )
        );
      }
    }

    return jsonOk({ affiliation: updated });
  } catch (err) {
    console.error("[clubs/guide-affiliations] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}
