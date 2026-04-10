import { jsonError, jsonOk, requireAuth} from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";

// GET: List property associations for a club
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

    const admin = createAdminClient();

    // Verify user is club owner
    const { data: club } = await admin
      .from("clubs")
      .select("owner_id")
      .eq("id", id)
      .maybeSingle();

    if (!club || club.owner_id !== user.id) {
      return jsonError("Forbidden", 403);
    }

    // Fetch property access records with property details
    const { data: access, error } = await admin
      .from("club_property_access")
      .select(
        "id, status, approved_at, created_at, properties(id, name, location_description, water_type, photos, status)"
      )
      .eq("club_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[clubs/properties] Fetch error:", error);
      return jsonError("Failed to fetch properties", 500);
    }

    return jsonOk({ properties: access ?? [] });
  } catch (err) {
    console.error("[clubs/properties] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}
