import { createAdminClient } from "@/lib/supabase/admin";
import {
  jsonOk,
  jsonError,
  requireAuth,
  requireClubManager,
} from "@/lib/api/helpers";
import { corporateSettingsSchema } from "@/lib/validations/clubs";

// GET: Fetch corporate membership settings for a club
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth();
    if (!auth) return jsonError("Unauthorized", 401);

    const admin = createAdminClient();
    const club = await requireClubManager(admin, id, auth.user.id);
    if (!club) return jsonError("Forbidden", 403);

    return jsonOk({
      corporate_memberships_enabled: club.corporate_memberships_enabled ?? false,
      corporate_initiation_fee: club.corporate_initiation_fee ?? null,
    });
  } catch (err) {
    console.error("[corporate-settings] GET error:", err);
    return jsonError("Internal server error", 500);
  }
}

// PATCH: Update corporate membership settings
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth();
    if (!auth) return jsonError("Unauthorized", 401);

    const admin = createAdminClient();
    const clubCheck = await requireClubManager(admin, id, auth.user.id);
    if (!clubCheck) return jsonError("Forbidden", 403);

    const body = await request.json();
    const result = corporateSettingsSchema.safeParse(body);

    if (!result.success) {
      return jsonError(
        result.error.issues[0]?.message ?? "Invalid input",
        400
      );
    }

    const { corporate_memberships_enabled, corporate_initiation_fee } =
      result.data;

    // When disabling corporate memberships, clear the fee
    const updates = {
      corporate_memberships_enabled,
      corporate_initiation_fee: corporate_memberships_enabled
        ? corporate_initiation_fee
        : null,
      updated_at: new Date().toISOString(),
    };

    const { data: updated, error: updateError } = await admin
      .from("clubs")
      .update(updates)
      .eq("id", id)
      .select(
        "corporate_memberships_enabled, corporate_initiation_fee"
      )
      .maybeSingle();

    if (updateError) {
      console.error("[corporate-settings] Update error:", updateError);
      return jsonError("Failed to update corporate settings", 500);
    }

    return jsonOk(updated);
  } catch (err) {
    console.error("[corporate-settings] PATCH error:", err);
    return jsonError("Internal server error", 500);
  }
}
