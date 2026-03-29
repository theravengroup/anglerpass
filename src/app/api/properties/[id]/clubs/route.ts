import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// GET: List club associations for a property (for landowner view)
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

    // Verify ownership
    const { data: property } = await admin
      .from("properties")
      .select("owner_id")
      .eq("id", id)
      .single();

    if (!property || property.owner_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch club_property_access records with club details
    const { data: associations, error } = await admin
      .from("club_property_access")
      .select("id, status, approved_at, created_at, clubs(id, name, location)")
      .eq("property_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[properties/clubs] Fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch associations" },
        { status: 500 }
      );
    }

    return NextResponse.json({ associations: associations ?? [] });
  } catch (err) {
    console.error("[properties/clubs] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
