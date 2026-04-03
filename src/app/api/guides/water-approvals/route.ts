import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { guideWaterApprovalSchema } from "@/lib/validations/guides";
import { notifyGuideWaterApprovalRequested } from "@/lib/notifications";

// GET: List guide's water approval statuses
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    const { data: profile } = await admin
      .from("guide_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "Guide profile not found" },
        { status: 404 }
      );
    }

    const { data: approvals, error } = await admin
      .from("guide_water_approvals")
      .select(
        "id, property_id, club_id, status, requested_at, reviewed_at, decline_reason, properties(name, location_description), clubs(name)"
      )
      .eq("guide_id", profile.id)
      .order("requested_at", { ascending: false });

    if (error) {
      console.error("[guides/water-approvals] Fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch approvals" },
        { status: 500 }
      );
    }

    return NextResponse.json({ approvals: approvals ?? [] });
  } catch (err) {
    console.error("[guides/water-approvals] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Request approval for a property
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = guideWaterApprovalSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Verify guide profile exists and is approved
    const { data: profile } = await admin
      .from("guide_profiles")
      .select("id, display_name, status")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "Guide profile not found" },
        { status: 404 }
      );
    }

    if (profile.status !== "live") {
      return NextResponse.json(
        { error: "Your guide profile must be live before requesting water access" },
        { status: 400 }
      );
    }

    const { property_id, club_id } = result.data;

    // Check existing approval
    const { data: existing } = await admin
      .from("guide_water_approvals")
      .select("id, status")
      .eq("guide_id", profile.id)
      .eq("property_id", property_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: `You already have a ${existing.status} request for this property` },
        { status: 409 }
      );
    }

    // Create approval request
    const { data: approval, error } = await admin
      .from("guide_water_approvals")
      .insert({
        guide_id: profile.id,
        property_id,
        club_id,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("[guides/water-approvals] Insert error:", error);
      return NextResponse.json(
        { error: "Failed to create approval request" },
        { status: 500 }
      );
    }

    // Notify club admin
    const { data: club } = await admin
      .from("clubs")
      .select("owner_id, name")
      .eq("id", club_id)
      .single();

    const { data: property } = await admin
      .from("properties")
      .select("name")
      .eq("id", property_id)
      .single();

    if (club) {
      notifyGuideWaterApprovalRequested(admin, {
        clubAdminId: club.owner_id,
        guideName: profile.display_name,
        propertyName: property?.name ?? "a property",
      }).catch((err) =>
        console.error("[guides/water-approvals] Notification error:", err)
      );
    }

    return NextResponse.json({ approval }, { status: 201 });
  } catch (err) {
    console.error("[guides/water-approvals] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
