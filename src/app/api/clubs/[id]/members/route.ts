import { jsonCreated, jsonError, jsonOk, requireAuth} from "@/lib/api/helpers";
import { getResend } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";
import { clubMemberInviteSchema } from "@/lib/validations/clubs";
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
    .maybeSingle();

  if (!club) return null;

  // Owner always has access
  if (club.owner_id === userId) return { club, isOwner: true };

  // Check if user is active staff
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

// GET: List club members
export async function GET(
  _request: Request,
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

    // Fetch members with profile info
    const { data: members, error } = await admin
      .from("club_memberships")
      .select("id, user_id, role, status, invited_email, invited_at, joined_at, created_at, membership_type, company_name, profiles!club_memberships_user_id_fkey(display_name)")
      .eq("club_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[clubs/members] Fetch error:", error);
      return jsonError("Failed to fetch members", 500);
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
          display_name: member.profiles?.display_name ?? null,
          invited_at: member.invited_at,
          joined_at: member.joined_at,
          created_at: member.created_at,
          membership_type: member.membership_type ?? "individual",
          company_name: member.company_name ?? null,
          origin: member.invited_at ? "invited" : "applied",
        };
      })
    );

    return jsonOk({ members: enrichedMembers });
  } catch (err) {
    console.error("[clubs/members] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}

// POST: Invite a member by email
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
    const result = clubMemberInviteSchema.safeParse(body);

    // Staff can only invite members, not other staff
    if (!clubAuth.isOwner && result.success && result.data.role === "staff") {
      return jsonError("Only the club owner can invite staff members", 403);
    }

    if (!result.success) {
      return jsonError(result.error.issues[0]?.message ?? "Invalid input", 400);
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
        return jsonError(msg, 409);
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
        return jsonError("Failed to create membership", 500);
      }

      await sendMemberInviteEmail(email, clubAuth.club.name, false, role);

      return jsonCreated({ membership });
    }

    // Check for existing invite by email (no user account yet)
    const { data: existingInvite } = await admin
      .from("club_memberships")
      .select("id, status")
      .eq("club_id", id)
      .eq("invited_email", email)
      .maybeSingle();

    if (existingInvite) {
      return jsonError("An invitation has already been sent to this email", 409);
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
      return jsonError("Failed to create membership", 500);
    }

    await sendMemberInviteEmail(email, clubAuth.club.name, true, role);

    return jsonCreated({ membership });
  } catch (err) {
    console.error("[clubs/members] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
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
      ? "Create Your Account →"
      : "View Your Membership →";

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
    console.error("[clubs/members] Email error:", err);
  }
}
