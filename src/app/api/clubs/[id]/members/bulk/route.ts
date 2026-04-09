import { jsonError, jsonOk, requireAuth} from "@/lib/api/helpers";
import { getResend } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

const MAX_EMAILS = 200;

const bulkInviteSchema = z.object({
  emails: z
    .array(z.email("Invalid email address"))
    .min(1, "At least one email is required")
    .max(MAX_EMAILS, `Maximum ${MAX_EMAILS} emails per request`),
});

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

async function sendMemberInviteEmail(
  email: string,
  clubName: string,
  needsSignup: boolean,
  role: string
) {
  const resend = getResend();
  if (!resend) return;

  try {
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://anglerpass.com";
    const ctaUrl = needsSignup
      ? `${siteUrl}/signup?role=angler`
      : `${siteUrl}/angler`;
    const ctaText = needsSignup
      ? "Create Your Account \u2192"
      : "View Your Membership \u2192";

    const isStaff = role === "staff";
    const roleDescription = isStaff
      ? "as a <strong>staff member</strong>"
      : "as a member";
    const perksLine = isStaff
      ? `<p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">
          As a staff member, you'll help manage the club and enjoy discounted rod fees at club properties.
        </p>`
      : `<p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">
          As a member, you'll be able to view available private waters, book access, and manage your
          reservations — all in one place.
        </p>`;

    const subject = isStaff
      ? `You've been invited to staff ${clubName} on AnglerPass`
      : `You've been invited to join ${clubName} on AnglerPass`;

    await resend.emails.send({
      from: "AnglerPass <hello@anglerpass.com>",
      to: email,
      subject,
      html: `
<div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #1e1e1a;">
  <h2 style="font-size: 24px; font-weight: 500; margin-bottom: 16px;">You're invited to ${clubName}</h2>
  <p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">
    <strong>${clubName}</strong> has invited you to join their club ${roleDescription} on AnglerPass — a platform for
    managing private fly fishing access.
  </p>
  ${perksLine}
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
    console.error("[clubs/members/bulk] Email error:", err);
  }
}

// POST: Bulk invite members by email
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authResult = await requireAuth();

    if (!authResult) return jsonError("Unauthorized", 401);

    const { user } = authResult;

    const admin = createAdminClient();

    // Verify user is club owner or staff
    const clubAuth = await verifyClubManager(admin, id, user.id);
    if (!clubAuth) {
      return jsonError("Forbidden", 403);
    }

    const body = await request.json();
    const result = bulkInviteSchema.safeParse(body);

    if (!result.success) {
      return jsonError(result.error.issues[0]?.message ?? "Invalid input", 400);
    }

    const { emails } = result.data;

    // Deduplicate emails (case-insensitive)
    const uniqueEmails = [...new Set(emails.map((e) => e.toLowerCase()))];

    // Fetch all auth users ONCE
    const { data: authUsers } = await admin.auth.admin.listUsers();
    const usersByEmail = new Map(
      (authUsers?.users ?? [])
        .filter((u) => u.email)
        .map((u) => [u.email!.toLowerCase(), u])
    );

    // Fetch all existing memberships for this club ONCE
    const { data: existingMemberships } = await admin
      .from("club_memberships")
      .select("user_id, invited_email, status")
      .eq("club_id", id);

    const membershipByUserId = new Map(
      (existingMemberships ?? [])
        .filter((m) => m.user_id)
        .map((m) => [m.user_id, m])
    );
    const membershipByEmail = new Map(
      (existingMemberships ?? [])
        .filter((m) => m.invited_email)
        .map((m) => [m.invited_email!.toLowerCase(), m])
    );

    let invited = 0;
    const skippedEmails: string[] = [];

    for (const email of uniqueEmails) {
      const existingUser = usersByEmail.get(email);

      if (existingUser) {
        // Check if already a member by user_id
        if (membershipByUserId.has(existingUser.id)) {
          skippedEmails.push(email);
          continue;
        }

        // Also check by invited_email (edge case)
        if (membershipByEmail.has(email)) {
          skippedEmails.push(email);
          continue;
        }

        // Create membership linked to existing user
        const { error: insertError } = await admin
          .from("club_memberships")
          .insert({
            club_id: id,
            user_id: existingUser.id,
            role: "member",
            status: "pending",
            invited_email: email,
            invited_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error("[clubs/members/bulk] Insert error:", insertError);
          skippedEmails.push(email);
          continue;
        }

        await sendMemberInviteEmail(email, clubAuth.club.name, false, "member");
        invited++;
      } else {
        // No user account — check for existing invite by email
        if (membershipByEmail.has(email)) {
          skippedEmails.push(email);
          continue;
        }

        // Create membership with just the email
        const { error: insertError } = await admin
          .from("club_memberships")
          .insert({
            club_id: id,
            user_id: null,
            role: "member",
            status: "pending",
            invited_email: email,
            invited_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error("[clubs/members/bulk] Insert error:", insertError);
          skippedEmails.push(email);
          continue;
        }

        await sendMemberInviteEmail(email, clubAuth.club.name, true, "member");
        invited++;
      }
    }

    return jsonOk({
      invited,
      skipped: skippedEmails.length,
      skippedEmails,
    });
  } catch (err) {
    console.error("[clubs/members/bulk] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}
