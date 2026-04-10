import { getResend } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  jsonOk,
  jsonError,
  requireAuth,
  requireClubRole,
} from "@/lib/api/helpers";
import { SITE_URL } from "@/lib/constants";

/**
 * POST /api/properties/[id]/resend-invitation
 * Resend the claim invitation email to the landowner.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: propertyId } = await params;

  const auth = await requireAuth();
  if (!auth) return jsonError("Unauthorized", 401);

  const admin = createAdminClient();

  // Get the pending invitation
  const { data: invitation } = await admin
    .from("property_claim_invitations")
    .select("id, token, landowner_email, club_id, reminder_count")
    .eq("property_id", propertyId)
    .eq("status", "pending")
    .maybeSingle();

  if (!invitation) {
    return jsonError("No pending invitation found for this property", 404);
  }

  // Verify the user has permission on the club
  const role = await requireClubRole(auth.user.id, invitation.club_id, "club.manage_properties");
  if (!role?.allowed) return jsonError("Forbidden", 403);

  // Get property and club info
  const [{ data: property }, { data: club }] = await Promise.all([
    admin.from("properties").select("name").eq("id", propertyId).maybeSingle(),
    admin.from("clubs").select("name").eq("id", invitation.club_id).maybeSingle(),
  ]);

  const propertyName = property?.name ?? "Your property";
  const clubName = club?.name ?? "Your club";

  // Update reminder count
  await admin
    .from("property_claim_invitations")
    .update({
      reminder_count: invitation.reminder_count + 1,
      last_reminded_at: new Date().toISOString(),
    })
    .eq("id", invitation.id);

  // Send reminder email
  const resend = getResend();
  if (resend) {
    try {
      const claimUrl = `${SITE_URL}/claim/${invitation.token}`;

      await resend.emails.send({
        from: "AnglerPass <hello@anglerpass.com>",
        to: invitation.landowner_email,
        subject: `Reminder: Claim your property "${propertyName}" on AnglerPass`,
        html: `
<div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #1e1e1a;">
  <h2 style="font-size: 22px; font-weight: 500; margin-bottom: 16px;">
    Your property is still waiting
  </h2>
  <p style="font-size: 15px; line-height: 1.7; color: #5a5a52;">
    <strong>${clubName}</strong> created a listing for <strong>${propertyName}</strong> on AnglerPass
    and is waiting for you to claim it. Once you claim ownership and set up Stripe Connect
    for payouts, the property can go live and start accepting bookings.
  </p>
  <div style="margin: 28px 0;">
    <a href="${claimUrl}"
       style="display: inline-block; padding: 12px 28px; background-color: #2d4a3e; color: #ffffff;
              text-decoration: none; border-radius: 6px; font-family: -apple-system, sans-serif;
              font-size: 14px; font-weight: 600;">
      Claim Your Property
    </a>
  </div>
  <p style="font-size: 13px; color: #9a9a8e;">
    If you have questions, reply to this email or contact ${clubName} directly.
  </p>
  <p style="font-size: 14px; color: #9a9a8e; margin-top: 32px;">&mdash; The AnglerPass Team</p>
</div>
        `.trim(),
      });
    } catch (emailErr) {
      console.error("[resend-invitation] Email error:", emailErr);
    }
  }

  return jsonOk({ success: true });
}
