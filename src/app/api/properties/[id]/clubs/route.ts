import { jsonError, jsonOk, requireAuth} from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";

// GET: List club associations for a property (for landowner view)
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

    // Verify ownership
    const { data: property } = await admin
      .from("properties")
      .select("owner_id")
      .eq("id", id)
      .maybeSingle();

    if (!property || property.owner_id !== user.id) {
      return jsonError("Forbidden", 403);
    }

    // Fetch club_property_access records with club details
    const { data: associations, error } = await admin
      .from("club_property_access")
      .select("id, status, approved_at, created_at, clubs(id, name, location)")
      .eq("property_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[properties/clubs] Fetch error:", error);
      return jsonError("Failed to fetch associations", 500);
    }

    return jsonOk({ associations: associations ?? [] });
  } catch (err) {
    console.error("[properties/clubs] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}
