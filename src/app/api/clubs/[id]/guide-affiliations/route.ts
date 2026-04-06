import { jsonError, jsonOk, requireAuth } from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";

// GET: List guide affiliations for a club (club manager view)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clubId } = await params;

    const auth = await requireAuth();
    if (!auth) {
      return jsonError("Unauthorized", 401);
    }

    const admin = createAdminClient();

    // Verify user is the club owner/manager
    const { data: club } = await admin
      .from("clubs")
      .select("id, owner_id")
      .eq("id", clubId)
      .single();

    if (!club) {
      return jsonError("Club not found", 404);
    }

    if (club.owner_id !== auth.user.id) {
      // Also check if user has a staff role in the club
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

    const { data: affiliations, error } = await admin
      .from("guide_club_affiliations")
      .select(
        "id, guide_id, status, label, created_at, updated_at, guide_profiles(id, user_id, display_name, profile_photo_url, base_location, rating_avg, rating_count, trips_completed)"
      )
      .eq("club_id", clubId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[clubs/guide-affiliations] Fetch error:", error);
      return jsonError("Failed to fetch guide affiliations", 500);
    }

    return jsonOk({ affiliations: affiliations ?? [] });
  } catch (err) {
    console.error("[clubs/guide-affiliations] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}
