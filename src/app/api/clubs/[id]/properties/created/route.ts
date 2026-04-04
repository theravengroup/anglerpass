import { createAdminClient } from "@/lib/supabase/admin";
import {
  jsonOk,
  jsonError,
  requireAuth,
  requireClubRole,
} from "@/lib/api/helpers";

/**
 * GET /api/clubs/[id]/properties/created
 * List properties created by this club on behalf of landowners.
 * Includes invitation status for unclaimed properties.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clubId } = await params;

  const auth = await requireAuth();
  if (!auth) return jsonError("Unauthorized", 401);

  const role = await requireClubRole(auth.user.id, clubId, "club.manage_properties");
  if (!role?.allowed) return jsonError("Forbidden", 403);

  const admin = createAdminClient();

  // Fetch properties created by this club
  const { data: properties, error } = await admin
    .from("properties")
    .select("id, name, location_description, water_type, photos, status, owner_id")
    .eq("created_by_club_id", clubId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[clubs/properties/created] Fetch error:", error);
    return jsonError("Failed to fetch properties", 500);
  }

  // Fetch pending invitations for unclaimed properties
  const unclaimedIds = (properties ?? [])
    .filter((p) => !p.owner_id)
    .map((p) => p.id);

  let invitationMap: Record<
    string,
    {
      id: string;
      status: string;
      landowner_email: string;
      reminder_count: number;
    }
  > = {};

  if (unclaimedIds.length > 0) {
    const { data: invitations } = await admin
      .from("property_claim_invitations")
      .select("id, property_id, status, landowner_email, reminder_count")
      .in("property_id", unclaimedIds)
      .eq("status", "pending");

    for (const inv of invitations ?? []) {
      invitationMap[inv.property_id] = {
        id: inv.id,
        status: inv.status,
        landowner_email: inv.landowner_email,
        reminder_count: inv.reminder_count,
      };
    }
  }

  // Merge invitation data into properties
  const enriched = (properties ?? []).map((p) => ({
    ...p,
    invitation: invitationMap[p.id] ?? null,
  }));

  return jsonOk({ properties: enriched });
}
