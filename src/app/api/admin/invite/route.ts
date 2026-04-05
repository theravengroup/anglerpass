import { z } from "zod";
import { Resend } from "resend";
import { requireAdmin, jsonError, jsonOk } from "@/lib/api/helpers";
import { rateLimit, getClientIp } from "@/lib/api/rate-limit";
import type { Json } from "@/types/supabase";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const inviteSchema = z.object({
  email: z.email("A valid email is required"),
  name: z.string().max(200).optional(),
});

// ─── POST: Invite a new admin team member ──────────────────────────
export async function POST(request: Request) {
  const limited = rateLimit("admin-invite", getClientIp(request), 5, 60_000);
  if (limited) return limited;

  try {
    const auth = await requireAdmin();
    if (!auth) return jsonError("Forbidden", 403);

    const body = await request.json();
    const result = inviteSchema.safeParse(body);

    if (!result.success) {
      return jsonError(
        result.error.issues[0]?.message ?? "Invalid input",
        400
      );
    }

    const { email, name } = result.data;
    const { user, admin } = auth;

    // Get inviter's display name
    const { data: inviterProfile } = await admin
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();

    const inviterName =
      inviterProfile?.display_name ?? user.email ?? "An admin";

    // Check if a user with this email already exists
    const { data: usersData, error: listError } =
      await admin.auth.admin.listUsers();

    if (listError) {
      console.error("[admin/invite] Failed to list users:", listError);
      return jsonError("Failed to check existing users", 500);
    }

    const existingUser = usersData.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {
      // Check if they already have the admin role
      const { data: profile } = await admin
        .from("profiles")
        .select("role, roles")
        .eq("id", existingUser.id)
        .single();

      if (profile?.role === "admin") {
        return jsonError("This person is already an admin", 409);
      }

      // Existing user but not admin — promote them
      const currentRoles: string[] = Array.isArray(profile?.roles)
        ? profile.roles
        : [];
      const updatedRoles = currentRoles.includes("admin")
        ? currentRoles
        : [...currentRoles, "admin"];

      const { error: updateError } = await admin
        .from("profiles")
        .update({ role: "admin", roles: updatedRoles })
        .eq("id", existingUser.id);

      if (updateError) {
        console.error("[admin/invite] Profile update error:", updateError);
        return jsonError("Failed to update user role", 500);
      }

      // Send notification email
      await sendInviteEmail(email, inviterName, true);

      // Audit log
      await admin.from("audit_log").insert({
        actor_id: user.id,
        action: "admin.invited",
        entity_type: "profile",
        entity_id: existingUser.id,
        new_data: {
          email,
          invited_by_name: inviterName,
          promoted_existing: true,
        } as Json,
      });

      return jsonOk({
        message: "User has been promoted to admin",
        promoted: true,
      });
    }

    // User doesn't exist — create a pending invite record in audit_log
    await admin.from("audit_log").insert({
      actor_id: user.id,
      action: "admin.invited",
      entity_type: "invite",
      new_data: { email, invited_by_name: inviterName } as Json,
    });

    // Also create an audit entry under "profile" entity type for tracking
    await admin.from("audit_log").insert({
      actor_id: user.id,
      action: "admin.invited",
      entity_type: "profile",
      new_data: { email, invited_by_name: inviterName } as Json,
    });

    // Send invitation email
    await sendInviteEmail(email, inviterName, false);

    return jsonOk(
      { message: "Invitation sent", invited: true },
      201
    );
  } catch (err) {
    console.error("[admin/invite] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}

// ─── GET: List current admins and recent invitations ───────────────
export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth) return jsonError("Forbidden", 403);

    const { admin } = auth;

    // Fetch all admin profiles
    const { data: adminProfiles, error: profilesError } = await admin
      .from("profiles")
      .select("id, display_name, role, created_at")
      .eq("role", "admin")
      .order("created_at", { ascending: false });

    if (profilesError) {
      console.error("[admin/invite] Profiles fetch error:", profilesError);
      return jsonError("Failed to fetch admin profiles", 500);
    }

    // Enrich with emails from auth
    const { data: usersData, error: usersError } =
      await admin.auth.admin.listUsers();

    if (usersError) {
      console.error("[admin/invite] Users fetch error:", usersError);
      return jsonError("Failed to fetch user emails", 500);
    }

    const emailMap = new Map(
      usersData.users.map((u) => [u.id, u.email ?? null])
    );

    const admins = (adminProfiles ?? []).map((p) => ({
      ...p,
      email: emailMap.get(p.id) ?? null,
    }));

    // Fetch recent admin invitations from audit_log
    const { data: recentInvites, error: invitesError } = await admin
      .from("audit_log")
      .select("id, actor_id, new_data, created_at")
      .eq("action", "admin.invited")
      .order("created_at", { ascending: false })
      .limit(20);

    if (invitesError) {
      console.error("[admin/invite] Invites fetch error:", invitesError);
      return jsonError("Failed to fetch invitations", 500);
    }

    return jsonOk({ admins, recentInvites: recentInvites ?? [] });
  } catch (err) {
    console.error("[admin/invite] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}

// ─── Email Helper ──────────────────────────────────────────────────

async function sendInviteEmail(
  email: string,
  inviterName: string,
  isExistingUser: boolean
) {
  if (!resend) {
    console.warn("[admin/invite] Resend not configured, skipping email");
    return;
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://anglerpass.com";

  const ctaUrl = isExistingUser
    ? `${siteUrl}/dashboard`
    : `${siteUrl}/signup?role=admin`;

  const ctaLabel = isExistingUser
    ? "Go to Dashboard"
    : "Create Your Account";

  const bodyText = isExistingUser
    ? `<p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">
        ${inviterName} has promoted you to a system administrator on AnglerPass.
        You now have access to the admin dashboard where you can manage users,
        review content, and oversee platform operations.
      </p>`
    : `<p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">
        ${inviterName} has invited you to join the AnglerPass team as a system
        administrator. AnglerPass is a platform for managing private fly fishing
        access, connecting landowners, clubs, and anglers.
      </p>
      <p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">
        As an admin, you'll help manage users, review content, and oversee
        day-to-day platform operations. Create your account to get started:
      </p>`;

  try {
    await resend.emails.send({
      from: "AnglerPass <hello@anglerpass.com>",
      to: email,
      subject: "You've been invited to the AnglerPass admin team",
      html: `
<div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #1e1e1a;">
  <h2 style="font-size: 24px; font-weight: 500; margin-bottom: 16px;">
    Welcome to the AnglerPass Admin Team
  </h2>
  ${bodyText}
  <div style="margin: 32px 0;">
    <a href="${ctaUrl}"
       style="display: inline-block; padding: 14px 32px; background: #8b6914; color: #fff; text-decoration: none; border-radius: 6px; font-family: sans-serif; font-size: 14px; font-weight: 500; letter-spacing: 0.3px;">
      ${ctaLabel} &rarr;
    </a>
  </div>
  <p style="font-size: 14px; line-height: 1.7; color: #9a9a8e;">
    If you have questions, reply to this email or reach out to the team.
  </p>
  <p style="font-size: 14px; color: #9a9a8e; margin-top: 32px;">&mdash; The AnglerPass Team</p>
</div>
      `.trim(),
    });
  } catch (emailErr) {
    console.error("[admin/invite] Email send error:", emailErr);
    // Don't fail the request — the invite/promotion is already saved
  }
}
