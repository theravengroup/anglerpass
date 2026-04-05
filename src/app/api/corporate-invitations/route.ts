import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { corporateInviteSchema } from "@/lib/validations/clubs";
import { rateLimit, getClientIp } from "@/lib/api/rate-limit";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://anglerpass.com";

// ─── GET: Fetch invitations for a corporate member ─────────────────

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const membershipId = searchParams.get("membership_id");

    if (!membershipId) {
      return NextResponse.json(
        { error: "membership_id is required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Verify the user owns this corporate membership
    const { data: membershipCheck } = await admin
      .from("club_memberships")
      .select("id, user_id, status")
      .eq("id", membershipId)
      .eq("user_id", user.id)
      .eq("membership_type", "corporate")
      .maybeSingle();

    if (!membershipCheck) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch invitations
    const { data: invitations, error } = await admin
      .from("corporate_invitations")
      .select("id, email, status, invited_at, accepted_at")
      .eq("corporate_member_id", membershipId)
      .order("invited_at", { ascending: false });

    if (error) {
      console.error("[corporate-invitations] Fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch invitations" },
        { status: 500 }
      );
    }

    return NextResponse.json({ invitations: invitations ?? [] });
  } catch (err) {
    console.error("[corporate-invitations] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ─── POST: Send invitations ────────────────────────────────────────

export async function POST(request: Request) {
  const limited = rateLimit("corporate-invite", getClientIp(request), 10, 60_000);
  if (limited) return limited;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = corporateInviteSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { emails } = result.data;
    const clubId = body.club_id as string;
    const membershipId = body.membership_id as string;

    if (!clubId || !membershipId) {
      return NextResponse.json(
        { error: "club_id and membership_id are required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Verify the user is an active corporate member
    const { data: membership } = await admin
      .from("club_memberships")
      .select("id, user_id, membership_type, status, company_name, club_id")
      .eq("id", membershipId)
      .eq("user_id", user.id)
      .eq("membership_type", "corporate")
      .eq("status", "active")
      .maybeSingle();

    if (!membership) {
      return NextResponse.json(
        { error: "You must be an active corporate member to send invitations" },
        { status: 403 }
      );
    }

    if (membership.club_id !== clubId) {
      return NextResponse.json(
        { error: "Club ID mismatch" },
        { status: 400 }
      );
    }

    // Fetch club info for email
    const { data: club } = await admin
      .from("clubs")
      .select("name, annual_dues")
      .eq("id", clubId)
      .single();

    const clubName = club?.name ?? "the club";
    const annualDues = club?.annual_dues ?? null;

    // Get sponsor display name
    const { data: profile } = await admin
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();

    const sponsorName = profile?.display_name ?? user.email ?? "Your sponsor";
    const companyName = membership.company_name ?? "your company";

    // Fetch existing invitations + members for this club
    const { data: existingInvitations } = await admin
      .from("corporate_invitations")
      .select("email, status")
      .eq("club_id", clubId);

    const { data: existingMembers } = await admin
      .from("club_memberships")
      .select("invited_email, user_id")
      .eq("club_id", clubId)
      .eq("status", "active");

    const pendingEmails = new Set(
      (existingInvitations ?? [])
        .filter((inv) => inv.status === "pending")
        .map((inv) => inv.email.toLowerCase())
    );

    // Get existing member emails via auth
    const memberEmails = new Set<string>();
    for (const m of existingMembers ?? []) {
      if (m.invited_email) {
        memberEmails.add(m.invited_email.toLowerCase());
      }
      if (m.user_id) {
        const { data: authUser } = await admin.auth.admin.getUserById(
          m.user_id
        );
        if (authUser?.user?.email) {
          memberEmails.add(authUser.user.email.toLowerCase());
        }
      }
    }

    let sent = 0;
    const skipped: { email: string; reason: string }[] = [];

    for (const email of emails) {
      const normalizedEmail = email.toLowerCase();

      // Check if already a member
      if (memberEmails.has(normalizedEmail)) {
        skipped.push({ email, reason: "Already a club member" });
        continue;
      }

      // Check if already has pending invitation
      if (pendingEmails.has(normalizedEmail)) {
        skipped.push({ email, reason: "Invitation already pending" });
        continue;
      }

      // Create invitation
      const { data: invitation, error: insertError } = await admin
        .from("corporate_invitations")
        .insert({
          club_id: clubId,
          corporate_member_id: membershipId,
          email,
          status: "pending",
        })
        .select("id, token")
        .single();

      if (insertError || !invitation) {
        console.error("[corporate-invitations] Insert error:", insertError);
        skipped.push({ email, reason: "Failed to create invitation" });
        continue;
      }

      // Send email
      await sendCorporateInviteEmail({
        to: email,
        clubId,
        clubName,
        sponsorName,
        companyName,
        annualDues,
        token: invitation.token,
      });

      sent++;
      pendingEmails.add(normalizedEmail);
    }

    return NextResponse.json({ sent, skipped });
  } catch (err) {
    console.error("[corporate-invitations] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ─── Email Helper ──────────────────────────────────────────────────

async function sendCorporateInviteEmail(opts: {
  to: string;
  clubId: string;
  clubName: string;
  sponsorName: string;
  companyName: string;
  annualDues: number | null;
  token: string;
}) {
  if (!resend) return;

  const joinUrl = `${SITE_URL}/join/${opts.clubId}/invite/${opts.token}`;
  const duesLine =
    opts.annualDues !== null
      ? `<p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">
          Annual dues: <strong>$${Number(opts.annualDues).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}/year</strong>.
          Your initiation fee has been covered by ${escapeHtml(opts.companyName)}&rsquo;s corporate membership.
        </p>`
      : "";

  try {
    await resend.emails.send({
      from: "AnglerPass <hello@anglerpass.com>",
      to: opts.to,
      subject: `You're invited to join ${opts.clubName} on AnglerPass`,
      html: `
<div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #1e1e1a;">
  <h2 style="font-size: 24px; font-weight: 500; margin-bottom: 16px;">You're invited to ${escapeHtml(opts.clubName)}</h2>
  <p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">
    <strong>${escapeHtml(opts.sponsorName)}</strong> from <strong>${escapeHtml(opts.companyName)}</strong> has invited you to join
    <strong>${escapeHtml(opts.clubName)}</strong> on AnglerPass &mdash; a platform for managing private fly fishing access.
  </p>
  <p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">
    As a corporate employee member, you'll be able to view available private waters, book access,
    and manage your reservations &mdash; all in one place.
  </p>
  ${duesLine}
  <div style="margin: 32px 0;">
    <a href="${joinUrl}"
       style="display: inline-block; padding: 14px 32px; background: #8b6914; color: #fff; text-decoration: none; border-radius: 6px; font-family: sans-serif; font-size: 14px; font-weight: 500; letter-spacing: 0.3px;">
      Accept Invitation &rarr;
    </a>
  </div>
  <p style="font-size: 14px; line-height: 1.7; color: #9a9a8e;">
    If you have questions, reply to this email or visit <a href="${SITE_URL}" style="color: #3a6b7c;">anglerpass.com</a>.
  </p>
  <p style="font-size: 14px; color: #9a9a8e; margin-top: 32px;">&mdash; The AnglerPass Team</p>
</div>
      `.trim(),
    });
  } catch (err) {
    console.error("[corporate-invitations] Email error:", err);
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
