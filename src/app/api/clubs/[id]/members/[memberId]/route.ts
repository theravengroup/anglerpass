import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { clubMemberStatusSchema } from "@/lib/validations/clubs";

// PATCH: Update member status (approve, decline, deactivate)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id, memberId } = await params;
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

    // Verify the membership belongs to this club
    const { data: membership } = await admin
      .from("club_memberships")
      .select("id, status, role")
      .eq("id", memberId)
      .eq("club_id", id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "Membership not found" },
        { status: 404 }
      );
    }

    // Don't allow modifying the club owner's membership
    if (membership.role === "admin") {
      return NextResponse.json(
        { error: "Cannot modify the club owner's membership" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const result = clubMemberStatusSchema.safeParse(body);

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

    // Set joined_at when activating
    if (result.data.status === "active" && membership.status === "pending") {
      updates.joined_at = new Date().toISOString();
    }

    const { data: updated, error: updateError } = await admin
      .from("club_memberships")
      .update(updates)
      .eq("id", memberId)
      .select()
      .single();

    if (updateError) {
      console.error("[clubs/members] Update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update membership" },
        { status: 500 }
      );
    }

    return NextResponse.json({ membership: updated });
  } catch (err) {
    console.error("[clubs/members] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Remove a member
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id, memberId } = await params;
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

    // Verify the membership and prevent removing the owner
    const { data: membership } = await admin
      .from("club_memberships")
      .select("role")
      .eq("id", memberId)
      .eq("club_id", id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "Membership not found" },
        { status: 404 }
      );
    }

    if (membership.role === "admin") {
      return NextResponse.json(
        { error: "Cannot remove the club owner" },
        { status: 400 }
      );
    }

    const { error: deleteError } = await admin
      .from("club_memberships")
      .delete()
      .eq("id", memberId);

    if (deleteError) {
      console.error("[clubs/members] Delete error:", deleteError);
      return NextResponse.json(
        { error: "Failed to remove member" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[clubs/members] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
