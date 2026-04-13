import { jsonError, jsonOk, requireAuth } from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyClubDeactivated } from "@/lib/notifications";

/**
 * PATCH /api/clubs/[id]/activate
 *
 * Toggle a club's is_active status. Accessible by:
 *   - Club owner
 *   - Platform admin
 *
 * Body: { is_active: boolean }
 *
 * Requires at least one property before activating.
 * When deactivating, all affiliated properties are hidden from public pages
 * and all affected landowners are notified.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;
    const admin = createAdminClient();
    const { id } = await params;

    // Fetch the club
    const { data: club, error: clubError } = await admin
      .from("clubs")
      .select("id, owner_id, name, is_active")
      .eq("id", id)
      .maybeSingle();

    if (clubError || !club) {
      return jsonError("Club not found", 404);
    }

    // Check authorization: owner or platform admin
    const isOwner = club.owner_id === user.id;

    if (!isOwner) {
      const { data: profile } = await admin
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.role !== "admin") {
        return jsonError("Forbidden", 403);
      }
    }

    // Parse body
    const body = await request.json();
    const isActive = body.is_active;

    if (typeof isActive !== "boolean") {
      return jsonError("is_active must be a boolean", 400);
    }

    // If activating, require at least one affiliated property
    if (isActive) {
      const { count: accessCount } = await admin
        .from("club_property_access")
        .select("id", { count: "exact", head: true })
        .eq("club_id", id);

      const { count: createdCount } = await admin
        .from("properties")
        .select("id", { count: "exact", head: true })
        .eq("created_by_club_id", id);

      const totalProperties = (accessCount ?? 0) + (createdCount ?? 0);

      if (totalProperties === 0) {
        return jsonError(
          "You must add at least one property before activating your club.",
          400
        );
      }
    }

    // Update the club
    const { data: updated, error: updateError } = await admin
      .from("clubs")
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id, is_active")
      .maybeSingle();

    if (updateError) {
      console.error("[clubs/activate] Update error:", updateError);
      return jsonError("Failed to update club status", 500);
    }

    // Notify landowners when club is deactivated
    if (!isActive) {
      notifyClubDeactivated(admin, {
        clubId: id,
        clubName: club.name,
      }).catch((err) =>
        console.error("[clubs/activate] Notification error:", err)
      );
    }

    return jsonOk({ club: updated });
  } catch (err) {
    console.error("[clubs/activate] Error:", err);
    return jsonError("Internal server error", 500);
  }
}
