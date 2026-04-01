import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { notify } from "@/lib/notifications";

const bodySchema = z.object({
  token: z.string().min(1, "Token is required"),
});

// ─── Row shapes (columns from migration 00030, not in generated types)

interface InvitationRow {
  id: string;
  email: string;
  status: string;
  club_id: string;
  corporate_member_id: string;
  invited_at: string | null;
}

interface CorporateMembershipRow {
  id: string;
  company_name: string | null;
  user_id: string | null;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clubId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = bodySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { token } = result.data;
    const admin = createAdminClient();

    // Look up invitation by token
    const { data: rawInvitation, error: invErr } = await admin
      .from("corporate_invitations" as never)
      .select("id, email, status, club_id, corporate_member_id" as never)
      .eq("token" as never, token)
      .single();

    if (invErr || !rawInvitation) {
      return NextResponse.json(
        { error: "Invalid invitation token" },
        { status: 404 }
      );
    }

    const invitation = rawInvitation as unknown as InvitationRow;

    // Verify status is pending
    if (invitation.status !== "pending") {
      return NextResponse.json(
        { error: "This invitation has already been used or has expired" },
        { status: 400 }
      );
    }

    // Verify club_id matches
    if (invitation.club_id !== clubId) {
      return NextResponse.json(
        { error: "Club ID mismatch" },
        { status: 400 }
      );
    }

    // Check if user already has a membership in this club
    const { data: existingMembership } = await admin
      .from("club_memberships")
      .select("id, status")
      .eq("club_id", clubId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingMembership) {
      return NextResponse.json(
        { error: "You already have a membership in this club" },
        { status: 409 }
      );
    }

    // Get corporate member info
    const { data: rawCorporateMembership } = await admin
      .from("club_memberships")
      .select("id, company_name, user_id" as never)
      .eq("id", invitation.corporate_member_id)
      .single();

    const corporateMembership =
      rawCorporateMembership as unknown as CorporateMembershipRow | null;

    if (!corporateMembership) {
      return NextResponse.json(
        { error: "Corporate membership not found" },
        { status: 404 }
      );
    }

    // Create the employee membership
    const { data: membership, error: insertErr } = await admin
      .from("club_memberships")
      .insert({
        club_id: clubId,
        user_id: user.id,
        role: "member",
        status: "active",
        membership_type: "corporate_employee",
        company_name: corporateMembership.company_name,
        corporate_sponsor_id: corporateMembership.id,
        invited_email: invitation.email,
        invited_at: invitation.invited_at ?? new Date().toISOString(),
        joined_at: new Date().toISOString(),
      } as never)
      .select()
      .single();

    if (insertErr) {
      console.error("[corporate-employee-join] Insert error:", insertErr);
      return NextResponse.json(
        { error: "Failed to create membership" },
        { status: 500 }
      );
    }

    // Update invitation status
    const { error: updateErr } = await admin
      .from("corporate_invitations" as never)
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
      } as never)
      .eq("id" as never, invitation.id);

    if (updateErr) {
      console.error(
        "[corporate-employee-join] Update invitation error:",
        updateErr
      );
      // Non-fatal: membership was created, just log the error
    }

    // Notify the corporate sponsor
    if (corporateMembership.user_id) {
      const { data: club } = await admin
        .from("clubs")
        .select("name")
        .eq("id", clubId)
        .single();

      const { data: employeeProfile } = await admin
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single();

      const employeeName =
        employeeProfile?.display_name ?? user.email ?? "An employee";
      const clubName = club?.name ?? "your club";

      await notify(admin, {
        userId: corporateMembership.user_id,
        type: "member_approved",
        title: `${employeeName} joined ${clubName}`,
        body: `${employeeName} has accepted your corporate invitation and joined ${clubName} as a corporate employee member.`,
        link: "/angler",
        metadata: {
          club_id: clubId,
          membership_id: (membership as unknown as { id: string }).id,
        },
      });
    }

    return NextResponse.json({ membership });
  } catch (err) {
    console.error("[corporate-employee-join] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
