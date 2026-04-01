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
      .from("guide_profiles" as never)
      .select(
        "*, profiles!guide_profiles_user_id_fkey(display_name, email:id)"
      )
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data: guides, error } = await query as { data: Record<string, unknown>[] | null; error: { message: string } | null };

    if (error) {
      console.error("[admin/guides] Fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch guides" },
        { status: 500 }
      );
    }

    // Get counts per status
    const counts = {
      pending_review: 0,
      approved: 0,
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

// PATCH: Approve, reject, or suspend a guide
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
    const { data: guideProfile } = await (admin
      .from("guide_profiles" as never)
      .select("id, user_id, status")
      .eq("id" as never, guide_id)
      .single()) as unknown as { data: { id: string; user_id: string; status: string } | null };

    if (!guideProfile) {
      return NextResponse.json(
        { error: "Guide profile not found" },
        { status: 404 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (result.data.action === "approve") {
      updates.status = "approved";
      updates.approved_at = new Date().toISOString();
      updates.approved_by = user.id;
      updates.rejection_reason = null;
      updates.suspended_reason = null;
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
    }

    const { data: updated, error: updateError } = await (admin
      .from("guide_profiles" as never)
      .update(updates as never)
      .eq("id" as never, guide_id)
      .select()
      .single()) as unknown as { data: Record<string, unknown> | null; error: { message: string } | null };

    if (updateError) {
      console.error("[admin/guides] Update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update guide" },
        { status: 500 }
      );
    }

    // Notify guide
    if (result.data.action === "approve") {
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
