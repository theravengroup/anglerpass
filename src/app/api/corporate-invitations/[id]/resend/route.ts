import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://anglerpass.com";

export async function POST(
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

    // Fetch the invitation
    const { data: invitation, error: fetchErr } = await admin
      .from("corporate_invitations")
      .select("id, email, token, status, club_id, corporate_member_id")
      .eq("id", id)
      .single();

    if (fetchErr || !invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    // Verify the user owns the corporate membership
    const { data: membership } = await admin
      .from("club_memberships")
      .select("id, user_id, company_name")
      .eq("id", invitation.corporate_member_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (invitation.status !== "pending") {
      return NextResponse.json(
        { error: "Only pending invitations can be resent" },
        { status: 400 }
      );
    }

    // Regenerate token and update invited_at
    const newToken =
      crypto.randomUUID().replace(/-/g, "") +
      crypto.randomUUID().replace(/-/g, "");

    const { error: updateErr } = await admin
      .from("corporate_invitations")
      .update({
        token: newToken,
        invited_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateErr) {
      console.error("[corporate-invitations/resend] Update error:", updateErr);
      return NextResponse.json(
        { error: "Failed to update invitation" },
        { status: 500 }
      );
    }

    // Fetch club info
    const { data: club } = await admin
      .from("clubs")
      .select("name, annual_dues")
      .eq("id", invitation.club_id)
      .single();

    // Get sponsor display name
    const { data: profile } = await admin
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();

    const clubName = club?.name ?? "the club";
    const sponsorName = profile?.display_name ?? user.email ?? "Your sponsor";
    const companyName = membership.company_name ?? "your company";
    const annualDues = club?.annual_dues ?? null;

    // Send email
    if (resend) {
      const joinUrl = `${SITE_URL}/join/${invitation.club_id}/invite/${newToken}`;
      const duesLine =
        annualDues !== null
          ? `<p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">
              Annual dues: <strong>$${Number(annualDues).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}/year</strong>.
              Your initiation fee has been covered by ${escapeHtml(companyName)}&rsquo;s corporate membership.
            </p>`
          : "";

      try {
        await resend.emails.send({
          from: "AnglerPass <hello@anglerpass.com>",
          to: invitation.email,
          subject: `Reminder: You're invited to join ${clubName} on AnglerPass`,
          html: `
<div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #1e1e1a;">
  <h2 style="font-size: 24px; font-weight: 500; margin-bottom: 16px;">Reminder: You're invited to ${escapeHtml(clubName)}</h2>
  <p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">
    <strong>${escapeHtml(sponsorName)}</strong> from <strong>${escapeHtml(companyName)}</strong> has invited you to join
    <strong>${escapeHtml(clubName)}</strong> on AnglerPass &mdash; a platform for managing private fly fishing access.
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
        console.error("[corporate-invitations/resend] Email error:", err);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[corporate-invitations/resend] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
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
