import { jsonCreated, jsonError, jsonOk } from "@/lib/api/helpers";
import { getResend } from "@/lib/email";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, getClientIp } from "@/lib/api/rate-limit";

const inviteSchema = z.object({
  club_name: z.string().min(1, "Club name is required").max(200),
  admin_email: z.email("Valid email is required"),
  admin_name: z.string().max(200).optional(),
});

export async function POST(request: Request) {
  const limited = rateLimit("angler-invite-club", getClientIp(request), 5, 60_000);
  if (limited) return limited;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return jsonError("Unauthorized", 401);
    }

    const body = await request.json();
    const result = inviteSchema.safeParse(body);

    if (!result.success) {
      return jsonError(result.error.issues[0]?.message ?? "Invalid input", 400);
    }

    const { club_name, admin_email, admin_name } = result.data;
    const admin = createAdminClient();

    // Check for duplicate invitation (same angler + same email)
    const { data: existing } = await admin
      .from("angler_club_invitations")
      .select("id, status")
      .eq("angler_id", user.id)
      .eq("admin_email", admin_email)
      .in("status", ["sent", "accepted"])
      .maybeSingle();

    if (existing) {
      return jsonError(existing.status === "accepted"
              ? "This club has already joined AnglerPass"
              : "You've already sent an invitation to this email", 409);
    }

    // Get angler's name
    const { data: profile } = await admin
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();

    const anglerName = profile?.display_name ?? "One of your members";

    // Create the invitation
    const { data: invitation, error: insertError } = await admin
      .from("angler_club_invitations")
      .insert({
        angler_id: user.id,
        club_name,
        admin_email,
        admin_name: admin_name || null,
      })
      .select()
      .single();

    if (insertError || !invitation) {
      console.error("[anglers/invite-club] Insert error:", insertError);
      return jsonError("Failed to create invitation", 500);
    }

    // Send invitation email via Resend
    const resend = getResend();
    if (resend) {
      try {
        const siteUrl =
          process.env.NEXT_PUBLIC_SITE_URL ?? "https://anglerpass.com";

        await resend.emails.send({
          from: "AnglerPass <hello@anglerpass.com>",
          to: admin_email,
          subject: `${anglerName} wants ${club_name} on AnglerPass`,
          html: `
<div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #1e1e1a;">
  <h2 style="font-size: 24px; font-weight: 500; margin-bottom: 16px;">
    ${anglerName} just joined AnglerPass
  </h2>
  <p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">
    ${admin_name ? `Hi ${admin_name},` : "Hi,"}
  </p>
  <p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">
    ${anglerName}, a member of <strong>${club_name}</strong>, recently signed up for AnglerPass and is
    hoping you'll bring the club on board. Here's what they had to say:
  </p>
  <div style="margin: 24px 0; padding: 20px 24px; background: #f7f5ef; border-radius: 8px; border-left: 3px solid #3a6b7c;">
    <p style="font-size: 15px; line-height: 1.7; color: #5a5a52; margin: 0; font-style: italic;">
      "I just joined AnglerPass to check it out, and it's awesome. I'm really hoping you join as a club
      so I can activate my membership &mdash; have you guys looked at the platform? It's fantastic, and I think
      it would really streamline the club's operations and give us all a better system and access to more water!"
    </p>
  </div>
  <p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">
    AnglerPass is a platform built specifically for private fly fishing. Clubs get modern member management,
    scheduling, reservation coordination, and access to the Cross-Club Network &mdash; connecting your members
    to private water across multiple properties and clubs.
  </p>
  <p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">
    When you set up ${club_name} on AnglerPass, ${anglerName} will be automatically activated as a member.
    No extra steps needed.
  </p>
  <div style="margin: 32px 0;">
    <a href="${siteUrl}/signup?role=club_admin&invitation=${invitation.token}&source=angler"
       style="display: inline-block; padding: 14px 32px; background: #3a6b7c; color: #fff; text-decoration: none; border-radius: 6px; font-family: sans-serif; font-size: 14px; font-weight: 500; letter-spacing: 0.3px;">
      Set Up ${club_name} on AnglerPass &rarr;
    </a>
  </div>
  <p style="font-size: 14px; line-height: 1.7; color: #9a9a8e;">
    Want to learn more before signing up? Visit
    <a href="${siteUrl}/clubs" style="color: #3a6b7c;">anglerpass.com/clubs</a>
    to see what the platform offers, or check out our
    <a href="${siteUrl}/pricing" style="color: #3a6b7c;">pricing</a>.
    All plans include a 30-day free trial.
  </p>
  <p style="font-size: 14px; color: #9a9a8e; margin-top: 32px;">— The AnglerPass Team</p>
</div>
          `.trim(),
        });

        // Also notify the AnglerPass team
        await resend.emails.send({
          from: "AnglerPass Leads <hello@anglerpass.com>",
          to: "hello@anglerpass.com",
          subject: `Angler club invitation: ${club_name} (${admin_email})`,
          html: `
<div style="font-family: sans-serif; max-width: 560px; color: #1e1e1a;">
  <h3 style="margin-bottom: 12px;">New Angler → Club Invitation</h3>
  <table style="font-size: 14px; line-height: 1.8;">
    <tr><td style="padding-right: 16px; color: #888;"><strong>Club</strong></td><td>${club_name}</td></tr>
    <tr><td style="padding-right: 16px; color: #888;"><strong>Admin Email</strong></td><td><a href="mailto:${admin_email}">${admin_email}</a></td></tr>
    ${admin_name ? `<tr><td style="padding-right: 16px; color: #888;"><strong>Admin Name</strong></td><td>${admin_name}</td></tr>` : ""}
    <tr><td style="padding-right: 16px; color: #888;"><strong>Invited By</strong></td><td>${anglerName} (${user.email})</td></tr>
  </table>
  <p style="font-size: 13px; color: #888; margin-top: 16px;">This is a viral growth lead — an angler signed up and invited their club.</p>
</div>
          `.trim(),
        });
      } catch (emailErr) {
        console.error("[anglers/invite-club] Email send error:", emailErr);
        // Don't fail the request — invitation is saved
      }
    }

    return jsonCreated({ invitation });
  } catch (err) {
    console.error("[anglers/invite-club] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}

// GET: List the angler's club invitations
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return jsonError("Unauthorized", 401);
    }

    const admin = createAdminClient();

    const { data: invitations, error } = await admin
      .from("angler_club_invitations")
      .select("id, club_name, admin_email, admin_name, status, created_at")
      .eq("angler_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[anglers/invite-club] Fetch error:", error);
      return jsonError("Failed to fetch invitations", 500);
    }

    return jsonOk({ invitations });
  } catch (err) {
    console.error("[anglers/invite-club] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}
