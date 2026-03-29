import { NextResponse } from "next/server";
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

    // Verify the access record belongs to this club
    const { data: access } = await admin
      .from("club_property_access")
      .select("id, status")
      .eq("id", accessId)
      .eq("club_id", id)
      .single();

    if (!access) {
      return NextResponse.json(
        { error: "Property association not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const result = clubPropertyAccessSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: "Failed to update property association" },
        { status: 500 }
      );
    }

    return NextResponse.json({ access: updated });
  } catch (err) {
    console.error("[clubs/properties] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
