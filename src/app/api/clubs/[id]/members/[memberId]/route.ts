import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { clubMemberStatusSchema } from "@/lib/validations/clubs";
import { notifyMemberApproved } from "@/lib/notifications";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Check if the user is a club owner or active staff member.
 * Returns { club, isOwner } on success, or null if unauthorized.
 */
async function verifyClubManager(
  admin: SupabaseClient,
  clubId: string,
  userId: string
): Promise<{ club: { owner_id: string; name: string }; isOwner: boolean } | null> {
  const { data: club } = await admin
    .from("clubs")
    .select("owner_id, name")
    .eq("id", clubId)
    .single();

  if (!club) return null;

  if (club.owner_id === userId) return { club, isOwner: true };

  const { data: staffMembership } = await admin
    .from("club_memberships")
    .select("id")
    .eq("club_id", clubId)
    .eq("user_id", userId)
    .eq("role", "staff")
    .eq("status", "active")
    .maybeSingle();

  if (staffMembership) return { club, isOwner: false };

  return null;
}

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

    // Verify user is club owner or staff
    const auth = await verifyClubManager(admin, id, user.id);
    if (!auth) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify the membership belongs to this club
    const { data: membership } = await admin
      .from("club_memberships")
      .select("id, user_id, status, role")
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

    // Staff cannot modify other staff members — only the owner can
    if (!auth.isOwner && membership.role === "staff") {
      return NextResponse.json(
        { error: "Only the club owner can manage staff members" },
        { status: 403 }
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

    // Store decline reason in removal_reason field
    if (result.data.status === "declined" && result.data.decline_reason) {
      updates.removal_reason = result.data.decline_reason;
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

    // Notify member if approved
    if (
      result.data.status === "active" &&
      membership.status === "pending" &&
      membership.user_id
    ) {
      notifyMemberApproved(admin, {
        userId: membership.user_id,
        clubName: auth.club.name,
        clubId: id,
      }).catch((err) =>
        console.error("[clubs/members] Notification error:", err)
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

    // Verify user is club owner or staff
    const auth = await verifyClubManager(admin, id, user.id);
    if (!auth) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify the membership and check permissions
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

    // Staff cannot remove other staff — only the owner can
    if (!auth.isOwner && membership.role === "staff") {
      return NextResponse.json(
        { error: "Only the club owner can remove staff members" },
        { status: 403 }
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
