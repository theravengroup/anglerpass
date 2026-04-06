import { jsonError, jsonOk } from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// DELETE: Remove an affiliation (only if pending or active)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return jsonError("Unauthorized", 401);
    }

    const admin = createAdminClient();

    // Verify guide profile
    const { data: profile } = await admin
      .from("guide_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return jsonError("Guide profile not found", 404);
    }

    // Fetch the affiliation
    const { data: affiliation } = await admin
      .from("guide_club_affiliations")
      .select("id, guide_id, status")
      .eq("id", id)
      .single();

    if (!affiliation) {
      return jsonError("Affiliation not found", 404);
    }

    // Must own this affiliation
    if (affiliation.guide_id !== profile.id) {
      return jsonError("Forbidden", 403);
    }

    // Only allow removal if pending or active
    if (affiliation.status !== "pending" && affiliation.status !== "active") {
      return jsonError(
        `Cannot remove an affiliation with status "${affiliation.status}"`,
        400
      );
    }

    const { error } = await admin
      .from("guide_club_affiliations")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[guides/affiliations] Delete error:", error);
      return jsonError("Failed to remove affiliation", 500);
    }

    return jsonOk({ success: true });
  } catch (err) {
    console.error("[guides/affiliations] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}
