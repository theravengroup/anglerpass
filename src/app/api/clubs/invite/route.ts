import { jsonCreated, jsonError, jsonOk, requireAuth } from "@/lib/api/helpers";
import { SITE_URL } from "@/lib/constants";
import { getResend } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit, getClientIp } from "@/lib/api/rate-limit";
import { clubInviteSchema } from "@/lib/validations/clubs";

export async function POST(request: Request) {
  const limited = rateLimit("clubs-invite", getClientIp(request), 10, 60_000);
  if (limited) return limited;

  try {
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

    const body = await request.json();
    const result = clubInviteSchema.safeParse(body);

    if (!result.success) {
      return jsonError(result.error.issues[0]?.message ?? "Invalid input", 400);
    }

    const { property_id, club_name, admin_email } = result.data;
    const admin = createAdminClient();

    // Verify the user owns this property
    const { data: property, error: propError } = await admin
      .from("properties")
      .select("id, name, owner_id")
      .eq("id", property_id)
      .maybeSingle();

    if (propError || !property) {
      return jsonError("Property not found", 404);
    }

    if (property.owner_id !== user.id) {
      return jsonError("Forbidden", 403);
    }

    // Check for duplicate invitation (same property + same email)
    const { data: existing } = await admin
      .from("club_invitations")
      .select("id, status")
      .eq("property_id", property_id)
      .eq("admin_email", admin_email)
      .in("status", ["sent", "accepted"])
      .maybeSingle();

    if (existing) {
      return jsonError(existing.status === "accepted"
              ? "This club has already accepted the invitation"
              : "An invitation has already been sent to this email for this property", 409);
    }

    // Get inviter's name
    const { data: profile } = await admin
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();

    const inviterName = profile?.display_name ?? user.email ?? "A landowner";

    // Create the invitation
    const { data: invitation, error: insertError } = await admin
      .from("club_invitations")
      .insert({
        property_id,
        invited_by: user.id,
        club_name,
        admin_email,
      })
      .select()
      .single();

    if (insertError) {
      console.error("[clubs/invite] Insert error:", insertError);
      return jsonError("Failed to create invitation", 500);
    }

    // Send invitation email via Resend
    const resend = getResend();
    if (resend) {
      try {
        await resend.emails.send({
          from: "AnglerPass <hello@anglerpass.com>",
          to: admin_email,
          subject: `${inviterName} invited ${club_name} to join AnglerPass`,
          html: `
<div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #1e1e1a;">
  <h2 style="font-size: 24px; font-weight: 500; margin-bottom: 16px;">Your club has been invited to AnglerPass</h2>
  <p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">
    ${inviterName} has registered <strong>${property.name}</strong> on AnglerPass and wants to associate it with
    <strong>${club_name}</strong>.
  </p>
  <p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">
    AnglerPass is a platform for managing private fly fishing access. Clubs serve as the trust layer —
    vetting anglers, managing memberships, and coordinating access to private waters. As a club on AnglerPass,
    you get best-in-class member management software purpose-built for fly fishing.
  </p>
  <p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">
    To get started, create your club's account on AnglerPass:
  </p>
  <div style="margin: 32px 0;">
    <a href="${SITE_URL}/signup?role=club_admin&invitation=${invitation.token}"
       style="display: inline-block; padding: 14px 32px; background: #3a6b7c; color: #fff; text-decoration: none; border-radius: 6px; font-family: sans-serif; font-size: 14px; font-weight: 500; letter-spacing: 0.3px;">
      Set Up Your Club →
    </a>
  </div>
  <p style="font-size: 14px; line-height: 1.7; color: #9a9a8e;">
    If you have questions, reply to this email or visit <a href="${SITE_URL}/clubs" style="color: #3a6b7c;">anglerpass.com/clubs</a>
    to learn more about what the platform offers for clubs.
  </p>
  <p style="font-size: 14px; color: #9a9a8e; margin-top: 32px;">— The AnglerPass Team</p>
</div>
          `.trim(),
        });

        // Also notify the AnglerPass team
        await resend.emails.send({
          from: "AnglerPass Leads <hello@anglerpass.com>",
          to: "hello@anglerpass.com",
          subject: `Club invitation sent: ${club_name} (${admin_email})`,
          html: `
<div style="font-family: sans-serif; max-width: 560px; color: #1e1e1a;">
  <h3 style="margin-bottom: 12px;">New Club Invitation</h3>
  <table style="font-size: 14px; line-height: 1.8;">
    <tr><td style="padding-right: 16px; color: #888;"><strong>Club</strong></td><td>${club_name}</td></tr>
    <tr><td style="padding-right: 16px; color: #888;"><strong>Admin Email</strong></td><td><a href="mailto:${admin_email}">${admin_email}</a></td></tr>
    <tr><td style="padding-right: 16px; color: #888;"><strong>Property</strong></td><td>${property.name}</td></tr>
    <tr><td style="padding-right: 16px; color: #888;"><strong>Invited By</strong></td><td>${inviterName} (${user.email})</td></tr>
  </table>
</div>
          `.trim(),
        });
      } catch (emailErr) {
        console.error("[clubs/invite] Email send error:", emailErr);
        // Don't fail the request — invitation is saved
      }
    }

    return jsonCreated({ invitation });
  } catch (err) {
    console.error("[clubs/invite] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}

// GET: List invitations for a property
export async function GET(request: Request) {
  try {
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("property_id");

    if (!propertyId) {
      return jsonError("property_id is required", 400);
    }

    const admin = createAdminClient();

    // Verify ownership
    const { data: property } = await admin
      .from("properties")
      .select("owner_id")
      .eq("id", propertyId)
      .maybeSingle();

    if (!property || property.owner_id !== user.id) {
      return jsonError("Forbidden", 403);
    }

    const { data: invitations, error } = await admin
      .from("club_invitations")
      .select("id, club_name, admin_email, status, created_at")
      .eq("property_id", propertyId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[clubs/invite] Fetch error:", error);
      return jsonError("Failed to fetch invitations", 500);
    }

    return jsonOk({ invitations });
  } catch (err) {
    console.error("[clubs/invite] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}
