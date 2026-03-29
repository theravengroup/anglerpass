import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { clubMemberInviteSchema } from "@/lib/validations/clubs";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// GET: List club members
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
      .select("owner_id, name")
      .eq("id", id)
      .single();

    if (!club || club.owner_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch members with profile info
    const { data: members, error } = await admin
      .from("club_memberships")
      .select("id, user_id, role, status, invited_email, invited_at, joined_at, created_at, profiles(display_name)")
      .eq("club_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[clubs/members] Fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch members" },
        { status: 500 }
      );
    }

    // Get user emails from auth (admin client needed)
    const enrichedMembers = await Promise.all(
      (members ?? []).map(async (member) => {
        let email = member.invited_email;
        if (member.user_id) {
          const { data: authUser } = await admin.auth.admin.getUserById(
            member.user_id
          );
          email = authUser?.user?.email ?? email;
        }
        return {
          id: member.id,
          user_id: member.user_id,
          role: member.role,
          status: member.status,
          email,
          display_name:
            (member.profiles as { display_name: string | null } | null)
              ?.display_name ?? null,
          invited_at: member.invited_at,
          joined_at: member.joined_at,
          created_at: member.created_at,
        };
      })
    );

    return NextResponse.json({ members: enrichedMembers });
  } catch (err) {
    console.error("[clubs/members] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Invite a member by email
export async function POST(
  request: Request,
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
      .select("owner_id, name")
      .eq("id", id)
      .single();

    if (!club || club.owner_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const result = clubMemberInviteSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { email, role } = result.data;

    // Check for existing membership by email
    // First check if there's a user with this email
    const { data: authUsers } = await admin.auth.admin.listUsers();
    const existingUser = authUsers?.users?.find((u) => u.email === email);

    if (existingUser) {
      // Check if already a member
      const { data: existingMembership } = await admin
        .from("club_memberships")
        .select("id, status")
        .eq("club_id", id)
        .eq("user_id", existingUser.id)
        .maybeSingle();

      if (existingMembership) {
        const msg =
          existingMembership.status === "active"
            ? "This person is already an active member"
            : existingMembership.status === "pending"
              ? "An invitation has already been sent to this person"
              : "This person already has a membership record";
        return NextResponse.json({ error: msg }, { status: 409 });
      }

      // Create membership linked to existing user
      const { data: membership, error: insertError } = await admin
        .from("club_memberships")
        .insert({
          club_id: id,
          user_id: existingUser.id,
          role,
          status: "pending",
          invited_email: email,
          invited_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error("[clubs/members] Insert error:", insertError);
        return NextResponse.json(
          { error: "Failed to create membership" },
          { status: 500 }
        );
      }

      await sendMemberInviteEmail(email, club.name, false);

      return NextResponse.json({ membership }, { status: 201 });
    }

    // Check for existing invite by email (no user account yet)
    const { data: existingInvite } = await admin
      .from("club_memberships")
      .select("id, status")
      .eq("club_id", id)
      .eq("invited_email", email)
      .maybeSingle();

    if (existingInvite) {
      return NextResponse.json(
        { error: "An invitation has already been sent to this email" },
        { status: 409 }
      );
    }

    // Create membership with just the email (no user_id yet)
    const { data: membership, error: insertError } = await admin
      .from("club_memberships")
      .insert({
        club_id: id,
        user_id: null,
        role,
        status: "pending",
        invited_email: email,
        invited_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("[clubs/members] Insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to create membership" },
        { status: 500 }
      );
    }

    await sendMemberInviteEmail(email, club.name, true);

    return NextResponse.json({ membership }, { status: 201 });
  } catch (err) {
    console.error("[clubs/members] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function sendMemberInviteEmail(
  email: string,
  clubName: string,
  needsSignup: boolean
) {
  if (!resend) return;

  try {
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://anglerpass.com";
    const ctaUrl = needsSignup
      ? `${siteUrl}/signup?role=angler`
      : `${siteUrl}/angler`;
    const ctaText = needsSignup
      ? "Create Your Account →"
      : "View Your Membership →";

    await resend.emails.send({
      from: "AnglerPass <hello@anglerpass.com>",
      to: email,
      subject: `You've been invited to join ${clubName} on AnglerPass`,
      html: `
<div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #1e1e1a;">
  <h2 style="font-size: 24px; font-weight: 500; margin-bottom: 16px;">You're invited to ${clubName}</h2>
  <p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">
    <strong>${clubName}</strong> has invited you to join their club on AnglerPass — a platform for
    managing private fly fishing access.
  </p>
  <p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">
    As a member, you'll be able to view available private waters, book access, and manage your
    reservations — all in one place.
  </p>
  <div style="margin: 32px 0;">
    <a href="${ctaUrl}"
       style="display: inline-block; padding: 14px 32px; background: #8b6914; color: #fff; text-decoration: none; border-radius: 6px; font-family: sans-serif; font-size: 14px; font-weight: 500; letter-spacing: 0.3px;">
      ${ctaText}
    </a>
  </div>
  <p style="font-size: 14px; line-height: 1.7; color: #9a9a8e;">
    If you have questions, reply to this email or visit <a href="${siteUrl}" style="color: #3a6b7c;">anglerpass.com</a>.
  </p>
  <p style="font-size: 14px; color: #9a9a8e; margin-top: 32px;">— The AnglerPass Team</p>
</div>
      `.trim(),
    });
  } catch (err) {
    console.error("[clubs/members] Email error:", err);
  }
}
