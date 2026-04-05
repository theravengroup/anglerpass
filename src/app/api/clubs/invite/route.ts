import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, getClientIp } from "@/lib/api/rate-limit";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const inviteSchema = z.object({
  property_id: z.uuid(),
  club_name: z.string().min(1, "Club name is required").max(200),
  admin_email: z.email("Valid email is required"),
});

export async function POST(request: Request) {
  const limited = rateLimit("clubs-invite", getClientIp(request), 10, 60_000);
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
    const result = inviteSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { property_id, club_name, admin_email } = result.data;
    const admin = createAdminClient();

    // Verify the user owns this property
    const { data: property, error: propError } = await admin
      .from("properties")
      .select("id, name, owner_id")
      .eq("id", property_id)
      .single();

    if (propError || !property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    if (property.owner_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
      return NextResponse.json(
        {
          error:
            existing.status === "accepted"
              ? "This club has already accepted the invitation"
              : "An invitation has already been sent to this email for this property",
        },
        { status: 409 }
      );
    }

    // Get inviter's name
    const { data: profile } = await admin
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();

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
      return NextResponse.json(
        { error: "Failed to create invitation" },
        { status: 500 }
      );
    }

    // Send invitation email via Resend
    if (resend) {
      try {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://anglerpass.com";

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
    <a href="${siteUrl}/signup?role=club_admin&invitation=${invitation.token}"
       style="display: inline-block; padding: 14px 32px; background: #3a6b7c; color: #fff; text-decoration: none; border-radius: 6px; font-family: sans-serif; font-size: 14px; font-weight: 500; letter-spacing: 0.3px;">
      Set Up Your Club →
    </a>
  </div>
  <p style="font-size: 14px; line-height: 1.7; color: #9a9a8e;">
    If you have questions, reply to this email or visit <a href="${siteUrl}/clubs" style="color: #3a6b7c;">anglerpass.com/clubs</a>
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

    return NextResponse.json({ invitation }, { status: 201 });
  } catch (err) {
    console.error("[clubs/invite] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET: List invitations for a property
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
    const propertyId = searchParams.get("property_id");

    if (!propertyId) {
      return NextResponse.json(
        { error: "property_id is required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Verify ownership
    const { data: property } = await admin
      .from("properties")
      .select("owner_id")
      .eq("id", propertyId)
      .single();

    if (!property || property.owner_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: invitations, error } = await admin
      .from("club_invitations")
      .select("id, club_name, admin_email, status, created_at")
      .eq("property_id", propertyId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[clubs/invite] Fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch invitations" },
        { status: 500 }
      );
    }

    return NextResponse.json({ invitations });
  } catch (err) {
    console.error("[clubs/invite] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
