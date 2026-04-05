import { jsonError, jsonOk } from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { clubPropertyAccessSchema } from "@/lib/validations/clubs";

// PATCH: Approve or decline a property association
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; accessId: string }> }
) {
  try {
    const { id, accessId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return jsonError("Unauthorized", 401);
    }

    const admin = createAdminClient();

    // Verify user is club owner
    const { data: club } = await admin
      .from("clubs")
      .select("owner_id")
      .eq("id", id)
      .single();

    if (!club || club.owner_id !== user.id) {
      return jsonError("Forbidden", 403);
    }

    // Verify the access record belongs to this club
    const { data: access } = await admin
      .from("club_property_access")
      .select("id, status")
      .eq("id", accessId)
      .eq("club_id", id)
      .single();

    if (!access) {
      return jsonError("Property association not found", 404);
    }

    const body = await request.json();
    const result = clubPropertyAccessSchema.safeParse(body);

    if (!result.success) {
      return jsonError(result.error.issues[0]?.message ?? "Invalid input", 400);
    }

    const updates: Record<string, unknown> = {
      status: result.data.status,
      updated_at: new Date().toISOString(),
    };

    if (result.data.status === "approved") {
      updates.approved_at = new Date().toISOString();
    }

    const { data: updated, error: updateError } = await admin
      .from("club_property_access")
      .update(updates)
      .eq("id", accessId)
      .select()
      .single();

    if (updateError) {
      console.error("[clubs/properties] Update error:", updateError);
      return jsonError("Failed to update property association", 500);
    }

    return jsonOk({ access: updated });
  } catch (err) {
    console.error("[clubs/properties] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}
