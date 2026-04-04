import { createAdminClient } from "@/lib/supabase/admin";
import {
  jsonOk,
  jsonCreated,
  jsonError,
  requireAuth,
  requireClubRole,
} from "@/lib/api/helpers";
import { propertySchema } from "@/lib/validations/properties";
import { parseCoordinates } from "@/lib/geo";

/**
 * POST /api/clubs/[id]/properties/create
 * Allows club staff to create a property on behalf of a landowner.
 * The property is created with no owner (owner_id = null) and
 * created_by_club_id set to the club ID.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clubId } = await params;

  const auth = await requireAuth();
  if (!auth) return jsonError("Unauthorized", 401);

  const role = await requireClubRole(auth.user.id, clubId, "club.manage_properties");
  if (!role?.allowed) return jsonError("Forbidden", 403);

  try {
    const body = await request.json();
    const result = propertySchema.safeParse(body);

    if (!result.success) {
      return jsonError(result.error.issues[0]?.message ?? "Invalid input", 400);
    }

    const { water_type, coordinates, ...rest } = result.data;
    const { latitude, longitude } = parseCoordinates(coordinates);

    const admin = createAdminClient();

    const { data, error } = await admin
      .from("properties")
      .insert({
        ...rest,
        coordinates,
        water_type: water_type || null,
        latitude,
        longitude,
        owner_id: null,
        created_by_club_id: clubId,
        status: "draft",
      })
      .select()
      .single();

    if (error) {
      console.error("[clubs/properties/create] Insert error:", error);
      return jsonError("Failed to create property", 500);
    }

    // Automatically create a club_property_access record (approved)
    await admin.from("club_property_access").insert({
      club_id: clubId,
      property_id: data.id,
      requested_by: auth.user.id,
      status: "approved",
      approved_at: new Date().toISOString(),
    });

    return jsonCreated({ property: data });
  } catch (err) {
    console.error("[clubs/properties/create] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}
