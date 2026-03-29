import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// GET: List property associations for a club
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // Verify user is club owner
    const { data: club } = await admin
      .from("clubs")
      .select("owner_id")
      .eq("id", id)
      .single();

    if (!club || club.owner_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch property access records with property details
    const { data: access, error } = await admin
      .from("club_property_access")
      .select(
        "id, status, approved_at, created_at, properties(id, name, location_description, water_type, photos, status)"
      )
      .eq("club_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[clubs/properties] Fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch properties" },
        { status: 500 }
      );
    }

    return NextResponse.json({ properties: access ?? [] });
  } catch (err) {
    console.error("[clubs/properties] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
