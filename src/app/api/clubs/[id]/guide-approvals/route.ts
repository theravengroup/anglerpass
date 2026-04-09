import { jsonError, jsonOk, requireAuth} from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { clubGuideApprovalSchema } from "@/lib/validations/guides";
import {
  notifyGuideWaterApproved,
  notifyGuideWaterDeclined,
} from "@/lib/notifications";

// GET: List guide approval requests for this club's waters
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clubId } = await params;
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

    const admin = createAdminClient();

    // Verify user is the club owner
    const { data: club } = await admin
      .from("clubs")
      .select("id, owner_id")
      .eq("id", clubId)
      .single();

    if (!club || club.owner_id !== user.id) {
      return jsonError("Forbidden", 403);
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = admin
      .from("guide_water_approvals")
      .select(
        "id, guide_id, property_id, status, requested_at, reviewed_at, decline_reason, guide_profiles(id, display_name, profile_photo_url, techniques, species, rating_avg, rating_count, license_url, insurance_url, first_aid_cert_url), properties(name)"
      )
      .eq("club_id", clubId)
      .order("requested_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data: approvals, error } = await query;

    if (error) {
      console.error("[clubs/guide-approvals] Fetch error:", error);
      return jsonError("Failed to fetch guide approvals", 500);
    }

    return jsonOk({ approvals: approvals ?? [] });
  } catch (err) {
    console.error("[clubs/guide-approvals] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}

// PATCH: Approve or decline a guide request
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clubId } = await params;
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

    const admin = createAdminClient();

    // Verify user is the club owner
    const { data: club } = await admin
      .from("clubs")
      .select("id, name, owner_id")
      .eq("id", clubId)
      .single();

    if (!club || club.owner_id !== user.id) {
      return jsonError("Forbidden", 403);
    }

    const body = await request.json();
    const { approval_id, ...actionBody } = body;

    if (!approval_id) {
      return jsonError("approval_id is required", 400);
    }

    const result = clubGuideApprovalSchema.safeParse(actionBody);

    if (!result.success) {
      return jsonError(result.error.issues[0]?.message ?? "Invalid input", 400);
    }

    // Fetch the approval
    const { data: approval } = await admin
      .from("guide_water_approvals")
      .select(
        "id, guide_id, property_id, status, guide_profiles(user_id, display_name), properties(name)"
      )
      .eq("id", approval_id)
      .eq("club_id", clubId)
      .single();

    if (!approval) {
      return jsonError("Approval not found", 404);
    }

    const newStatus =
      result.data.action === "approve"
        ? "approved"
        : result.data.action === "decline"
          ? "declined"
          : "revoked";

    const { data: updated, error: updateError } = await admin
      .from("guide_water_approvals")
      .update({
        status: newStatus,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        decline_reason: result.data.decline_reason || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", approval_id)
      .select()
      .single();

    if (updateError) {
      console.error("[clubs/guide-approvals] Update error:", updateError);
      return jsonError("Failed to update approval", 500);
    }

    // Notify the guide
    const guideProfile = approval.guide_profiles;
    const property = approval.properties;

    if (guideProfile) {
      if (newStatus === "approved") {
        notifyGuideWaterApproved(admin, {
          guideUserId: guideProfile.user_id,
          propertyName: property?.name ?? "a property",
          clubName: club.name,
        }).catch((err) =>
          console.error("[clubs/guide-approvals] Notification error:", err)
        );
      } else if (newStatus === "declined" || newStatus === "revoked") {
        notifyGuideWaterDeclined(admin, {
          guideUserId: guideProfile.user_id,
          propertyName: property?.name ?? "a property",
          reason: result.data.decline_reason,
        }).catch((err) =>
          console.error("[clubs/guide-approvals] Notification error:", err)
        );
      }
    }

    return jsonOk({ approval: updated });
  } catch (err) {
    console.error("[clubs/guide-approvals] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}
