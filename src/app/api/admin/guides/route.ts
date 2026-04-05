import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError, requireAdmin } from "@/lib/api/helpers";
import {
  adminGuideReviewSchema,
  GUIDE_STATUSES,
} from "@/lib/validations/guides";
import {
  notifyGuideProfileApproved,
  notifyGuideProfileRejected,
} from "@/lib/notifications";
import { z } from "zod";

// ─── Query Params Validation ───────────────────────────────────────

const guideListQuerySchema = z.object({
  status: z.enum(GUIDE_STATUSES).optional(),
});

// ─── PATCH Body Validation ─────────────────────────────────────────

const adminGuidePatchSchema = z.object({
  guide_id: z.uuid("guide_id must be a valid UUID"),
  action: adminGuideReviewSchema.shape.action,
  reason: adminGuideReviewSchema.shape.reason,
});

// ─── Guide Profile Update Shape ────────────────────────────────────

interface GuideProfileUpdate {
  updated_at: string;
  status?: string;
  live_at?: string | null;
  verified_by?: string | null;
  rejection_reason?: string | null;
  suspended_reason?: string | null;
  suspension_type?: string | null;
}

// ─── Status Counts ─────────────────────────────────────────────────

type GuideStatusCounts = Record<(typeof GUIDE_STATUSES)[number], number>;

// GET: List all guide profiles with filters
export async function GET(request: Request) {
  try {
    const authResult = await requireAdmin();
    if (!authResult) {
      return jsonError("Unauthorized", 401);
    }

    const { admin } = authResult;

    const { searchParams } = new URL(request.url);
    const queryParse = guideListQuerySchema.safeParse({
      status: searchParams.get("status") || undefined,
    });

    if (!queryParse.success) {
      return jsonError(
        queryParse.error.issues[0]?.message ?? "Invalid query parameters",
        400
      );
    }

    const { status } = queryParse.data;

    let query = admin
      .from("guide_profiles")
      .select(
        "*, profiles!guide_profiles_user_id_fkey(display_name, email:id)"
      )
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data: guides, error } = await query;

    if (error) {
      console.error("[admin/guides] Fetch error:", error);
      return jsonError("Failed to fetch guides", 500);
    }

    // Get counts per status
    const counts: GuideStatusCounts = {
      pending: 0,
      verified: 0,
      live: 0,
      suspended: 0,
      rejected: 0,
      draft: 0,
    };
    for (const g of guides ?? []) {
      const s = g.status as keyof GuideStatusCounts;
      if (s in counts) counts[s]++;
    }

    return jsonOk({
      guides: guides ?? [],
      counts,
    });
  } catch (err) {
    console.error("[admin/guides] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}

// PATCH: Review guide — make_live, reject, suspend, or request_info
export async function PATCH(request: Request) {
  try {
    const authResult = await requireAdmin();
    if (!authResult) {
      return jsonError("Unauthorized", 401);
    }

    const { user, admin } = authResult;

    const body = await request.json();
    const result = adminGuidePatchSchema.safeParse(body);

    if (!result.success) {
      return jsonError(
        result.error.issues[0]?.message ?? "Invalid input",
        400
      );
    }

    const { guide_id, action, reason } = result.data;

    // Fetch guide profile
    const { data: guideProfile } = await admin
      .from("guide_profiles")
      .select("id, user_id, status")
      .eq("id", guide_id)
      .single();

    if (!guideProfile) {
      return jsonError("Guide profile not found", 404);
    }

    const updates: GuideProfileUpdate = {
      updated_at: new Date().toISOString(),
    };

    if (action === "make_live") {
      if (guideProfile.status !== "verified") {
        return jsonError("Only verified guides can be made live", 400);
      }
      updates.status = "live";
      updates.live_at = new Date().toISOString();
      updates.verified_by = user.id;
      updates.rejection_reason = null;
      updates.suspended_reason = null;
      updates.suspension_type = null;
    } else if (action === "reject") {
      if (!reason) {
        return jsonError("Reason is required when rejecting", 400);
      }
      updates.status = "rejected";
      updates.rejection_reason = reason;
    } else if (action === "suspend") {
      updates.status = "suspended";
      updates.suspended_reason = reason || "Suspended by admin";
      updates.suspension_type = "admin";
    } else if (action === "request_info") {
      updates.status = "draft";
      updates.rejection_reason = reason || "Additional information requested";
    }

    const { data: updated, error: updateError } = await admin
      .from("guide_profiles")
      .update(updates)
      .eq("id", guide_id)
      .select()
      .single();

    if (updateError) {
      console.error("[admin/guides] Update error:", updateError);
      return jsonError("Failed to update guide", 500);
    }

    // Log to verification events
    await admin.from("guide_verification_events").insert({
      guide_id,
      event_type: "admin_review",
      old_status: guideProfile.status,
      new_status: updates.status,
      metadata: { action, reason },
      actor_id: user.id,
    });

    // Notify guide
    if (action === "make_live") {
      notifyGuideProfileApproved(admin, {
        guideUserId: guideProfile.user_id,
      }).catch((err) =>
        console.error("[admin/guides] Notification error:", err)
      );
    } else if (action === "reject") {
      notifyGuideProfileRejected(admin, {
        guideUserId: guideProfile.user_id,
        reason: reason ?? "No reason provided",
      }).catch((err) =>
        console.error("[admin/guides] Notification error:", err)
      );
    }

    return jsonOk({ guide: updated });
  } catch (err) {
    console.error("[admin/guides] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}
