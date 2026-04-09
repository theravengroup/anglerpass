import { z } from "zod";
import { getResend } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  jsonOk,
  jsonError,
  requireAuth,
  requireClubRole,
} from "@/lib/api/helpers";
import { rateLimit, getClientIp } from "@/lib/api/rate-limit";
import { SITE_URL } from "@/lib/constants";

const inviteSchema = z.object({
  landowner_email: z.string().email("Valid email is required"),
});

/**
 * POST /api/properties/[id]/invite-landowner
 * Send an invitation to a landowner to claim ownership of a property
 * created by a club on their behalf.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = rateLimit("invite-landowner", getClientIp(request), 5, 60_000);
  if (limited) return limited;

  const { id: propertyId } = await params;

  const auth = await requireAuth();
  if (!auth) return jsonError("Unauthorized", 401);

  const admin = createAdminClient();

  // Verify the property exists and was created by a club
  const { data: property } = await admin
    .from("properties")
    .select("id, name, created_by_club_id, owner_id")
    .eq("id", propertyId)
    .single();

  if (!property) return jsonError("Property not found", 404);
  if (!property.created_by_club_id) {
    return jsonError("This property was not created by a club", 400);
  }
  if (property.owner_id) {
    return jsonError("This property already has an owner", 400);
  }

  // Verify the user has permission on the creating club
  const role = await requireClubRole(
    auth.user.id,
    property.created_by_club_id,
    "club.manage_properties"
  );
  if (!role?.allowed) return jsonError("Forbidden", 403);

  const body = await request.json();
  const result = inviteSchema.safeParse(body);
  if (!result.success) {
    return jsonError(result.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const { landowner_email } = result.data;

  // Check for existing pending invitation
  const { data: existing } = await admin
    .from("property_claim_invitations")
    .select("id, status")
    .eq("property_id", propertyId)
    .eq("status", "pending")
    .single();

  if (existing) {
    return jsonError(
      "An invitation is already pending for this property. Use the resend option instead.",
      409
    );
  }

  // Get club name for the email
  const { data: club } = await admin
    .from("clubs")
    .select("name")
    .eq("id", property.created_by_club_id)
    .single();

  const clubName = club?.name ?? "Your club";

  // Create the invitation
  const { data: invitation, error: insertError } = await admin
    .from("property_claim_invitations")
    .insert({
      property_id: propertyId,
      club_id: property.created_by_club_id,
      landowner_email,
    })
    .select("id, token")
    .single();

  if (insertError) {
    console.error("[invite-landowner] Insert error:", insertError);
    return jsonError("Failed to create invitation", 500);
  }

  // Send invitation email
  const resend = getResend();
  if (resend) {
    try {
      const claimUrl = `${SITE_URL}/claim/${invitation.token}`;

      await resend.emails.send({
        from: "AnglerPass <hello@anglerpass.com>",
        to: landowner_email,
        subject: `${clubName} has set up your property on AnglerPass`,
        html: `
<div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #1e1e1a;">
  <h2 style="font-size: 22px; font-weight: 500; margin-bottom: 16px;">
    Your property is ready to claim
  </h2>
  <p style="font-size: 15px; line-height: 1.7; color: #5a5a52;">
    <strong>${clubName}</strong> has created a listing for <strong>${property.name}</strong> on AnglerPass
    on your behalf. The property details, photos, and pricing are already set up &mdash; you just
    need to claim ownership and complete your onboarding.
  </p>
  <p style="font-size: 15px; line-height: 1.7; color: #5a5a52;">
    <strong>What you need to do:</strong>
  </p>
  <ol style="font-size: 15px; line-height: 1.7; color: #5a5a52; padding-left: 20px;">
    <li>Click the button below to claim your property</li>
    <li>Create your AnglerPass account (or sign in)</li>
    <li>Complete Stripe Connect onboarding to receive payouts</li>
  </ol>
  <p style="font-size: 14px; line-height: 1.7; color: #5a5a52;">
    Once your Stripe account is set up, your property will be eligible to go live and
    start accepting bookings from ${clubName}&rsquo;s members.
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
      console.error("[invite-landowner] Email error:", emailErr);
    }
  }

  return jsonOk({ invitation: { id: invitation.id, token: invitation.token } });
}
