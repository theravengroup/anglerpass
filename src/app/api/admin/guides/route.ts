import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { adminGuideReviewSchema } from "@/lib/validations/guides";
import {
  notifyGuideProfileApproved,
  notifyGuideProfileRejected,
} from "@/lib/notifications";

// GET: List all guide profiles with filters
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // Verify admin
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

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
      return NextResponse.json(
        { error: "Failed to fetch guides" },
        { status: 500 }
      );
    }

    // Get counts per status
    const counts = {
      pending: 0,
      verified: 0,
      live: 0,
      suspended: 0,
      rejected: 0,
      draft: 0,
    };
    for (const g of guides ?? []) {
      const s = g.status as keyof typeof counts;
      if (s in counts) counts[s]++;
    }

    return NextResponse.json({
      guides: guides ?? [],
      counts,
    });
  } catch (err) {
    console.error("[admin/guides] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH: Review guide — make_live, reject, suspend, or request_info
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // Verify admin
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { guide_id, ...actionBody } = body;

    if (!guide_id) {
      return NextResponse.json(
        { error: "guide_id is required" },
        { status: 400 }
      );
    }

    const result = adminGuideReviewSchema.safeParse(actionBody);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    // Fetch guide profile
    const { data: guideProfile } = await admin
      .from("guide_profiles")
      .select("id, user_id, status")
      .eq("id", guide_id)
      .single();

    if (!guideProfile) {
      return NextResponse.json(
        { error: "Guide profile not found" },
        { status: 404 }
      );
    }

     
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (result.data.action === "make_live") {
      if (guideProfile.status !== "verified") {
        return NextResponse.json(
          { error: "Only verified guides can be made live" },
          { status: 400 }
        );
      }
      updates.status = "live";
      updates.live_at = new Date().toISOString();
      updates.verified_by = user.id;
      updates.rejection_reason = null;
      updates.suspended_reason = null;
      updates.suspension_type = null;
    } else if (result.data.action === "reject") {
      if (!result.data.reason) {
        return NextResponse.json(
          { error: "Reason is required when rejecting" },
          { status: 400 }
        );
      }
      updates.status = "rejected";
      updates.rejection_reason = result.data.reason;
    } else if (result.data.action === "suspend") {
      updates.status = "suspended";
      updates.suspended_reason = result.data.reason || "Suspended by admin";
      updates.suspension_type = "admin";
    } else if (result.data.action === "request_info") {
      updates.status = "draft";
      updates.rejection_reason = result.data.reason || "Additional information requested";
    }

    const { data: updated, error: updateError } = await admin
      .from("guide_profiles")
      .update(updates)
      .eq("id", guide_id)
      .select()
      .single();

    if (updateError) {
      console.error("[admin/guides] Update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update guide" },
        { status: 500 }
      );
    }

    // Log to verification events
    await admin.from("guide_verification_events").insert({
      guide_id,
      event_type: "admin_review",
      old_status: guideProfile.status,
      new_status: updates.status,
      metadata: { action: result.data.action, reason: result.data.reason },
      actor_id: user.id,
    });

    // Notify guide
    if (result.data.action === "make_live") {
      notifyGuideProfileApproved(admin, {
        guideUserId: guideProfile.user_id,
      }).catch((err) =>
        console.error("[admin/guides] Notification error:", err)
      );
    } else if (result.data.action === "reject") {
      notifyGuideProfileRejected(admin, {
        guideUserId: guideProfile.user_id,
        reason: result.data.reason ?? "No reason provided",
      }).catch((err) =>
        console.error("[admin/guides] Notification error:", err)
      );
    }

    return NextResponse.json({ guide: updated });
  } catch (err) {
    console.error("[admin/guides] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
