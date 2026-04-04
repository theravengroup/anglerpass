import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError } from "@/lib/api/helpers";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://anglerpass.com";

// Nudge schedule: 3, 7, 14 days after invitation
const NUDGE_SCHEDULE_DAYS = [3, 7, 14];

/**
 * POST: Send automated nudge emails to landowners who haven't claimed their properties.
 *
 * Runs daily via Vercel Cron. Sends reminders at 3, 7, and 14 days after invitation.
 * Protected by CRON_SECRET in the Authorization header.
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return jsonError("Unauthorized", 401);
  }

  const admin = createAdminClient();

  // Fetch all pending invitations
  const { data: invitations, error } = await admin
    .from("property_claim_invitations")
    .select("id, property_id, club_id, token, landowner_email, reminder_count, created_at, last_reminded_at")
    .eq("status", "pending");

  if (error) {
    console.error("[nudge-landowners] Fetch error:", error);
    return jsonError("Failed to fetch invitations", 500);
  }

  if (!invitations?.length) {
    return jsonOk({ nudged: 0 });
  }

  const now = Date.now();
  let nudgedCount = 0;

  for (const inv of invitations) {
    const createdAt = new Date(inv.created_at).getTime();
    const daysSinceCreated = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));

    // Determine which nudge we should be at based on elapsed time
    const expectedReminders = NUDGE_SCHEDULE_DAYS.filter(
      (d) => daysSinceCreated >= d
    ).length;

    // Only send if we haven't sent this nudge yet
    if (inv.reminder_count >= expectedReminders) continue;

    // Get property and club names for the email
    const [{ data: property }, { data: club }] = await Promise.all([
      admin.from("properties").select("name").eq("id", inv.property_id).single(),
      admin.from("clubs").select("name").eq("id", inv.club_id).single(),
    ]);

    const propertyName = property?.name ?? "Your property";
    const clubName = club?.name ?? "Your club";
    const claimUrl = `${SITE_URL}/claim/${inv.token}`;

    // Send nudge email
    if (resend) {
      try {
        await resend.emails.send({
          from: "AnglerPass <hello@anglerpass.com>",
          to: inv.landowner_email,
          subject: `Reminder: Claim "${propertyName}" on AnglerPass`,
          html: `
<div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #1e1e1a;">
  <h2 style="font-size: 22px; font-weight: 500; margin-bottom: 16px;">
    Your property is still waiting
  </h2>
  <p style="font-size: 15px; line-height: 1.7; color: #5a5a52;">
    <strong>${clubName}</strong> set up <strong>${propertyName}</strong> on AnglerPass
    ${daysSinceCreated} days ago and is waiting for you to claim it. Once you claim ownership
    and complete Stripe Connect onboarding, bookings can begin flowing to your property.
  </p>
  <p style="font-size: 15px; line-height: 1.7; color: #5a5a52;">
    It only takes a few minutes to get set up.
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
        console.error("[nudge-landowners] Email error:", emailErr);
        continue;
      }
    }

    // Update reminder count
    await admin
      .from("property_claim_invitations")
      .update({
        reminder_count: expectedReminders,
        last_reminded_at: new Date().toISOString(),
      })
      .eq("id", inv.id);

    nudgedCount++;
  }

  return jsonOk({ nudged: nudgedCount });
}
