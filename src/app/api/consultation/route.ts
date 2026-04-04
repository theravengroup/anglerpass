import { NextResponse } from "next/server";
import { Resend } from "resend";
import { consultationSchema } from "@/lib/validations/consultation";
import { rateLimit, getClientIp } from "@/lib/api/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function POST(request: Request) {
  const limited = rateLimit("consultation", getClientIp(request), 3, 60_000);
  if (limited) return limited;

  try {
    const body = await request.json();
    const result = consultationSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { name, email, organization, property_count, preferred_dates, notes } =
      result.data;

    // Save to consultation_requests table
    const admin = createAdminClient();
    const { error: insertError } = await admin
      .from("consultation_requests")
      .insert({
        name,
        email,
        organization,
        property_count: property_count ?? null,
        preferred_dates: preferred_dates || null,
        notes: notes || null,
      });

    if (insertError) {
      console.error("[consultation] Insert error:", insertError);
    }

    // Send emails via Resend
    if (resend) {
      try {
        // Confirmation to requester
        await resend.emails.send({
          from: "AnglerPass <hello@anglerpass.com>",
          to: email,
          subject: "We received your consultation request",
          html: `
<div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #1e1e1a;">
  <h2 style="font-size: 22px; font-weight: 500; margin-bottom: 16px;">Thanks for reaching out, ${name}.</h2>
  <p style="font-size: 15px; line-height: 1.7; color: #5a5a52;">
    We received your consultation request for <strong>${organization}</strong>. A member of our team will
    follow up within 1&ndash;2 business days to schedule a Zoom call and discuss your migration.
  </p>
  <p style="font-size: 15px; line-height: 1.7; color: #5a5a52;">
    In the meantime, if you have additional questions, just reply to this email.
  </p>
  <p style="font-size: 14px; color: #9a9a8e; margin-top: 32px;">&mdash; The AnglerPass Team</p>
</div>
          `.trim(),
        });

        // Notification to team
        await resend.emails.send({
          from: "AnglerPass Consultations <hello@anglerpass.com>",
          to: "onboarding@anglerpass.com",
          replyTo: email,
          subject: `Consultation request: ${organization} (${name})`,
          html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; color: #333;">
  <p><strong>New consultation request</strong></p>
  <table style="border-collapse: collapse; width: 100%; font-size: 14px;">
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">Name</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${name}</td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">Email</td><td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="mailto:${email}">${email}</a></td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">Organization</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${organization}</td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">Properties</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${property_count ?? "Not specified"}</td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">Preferred Dates</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${preferred_dates || "Not specified"}</td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">Notes</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${notes || "None"}</td></tr>
  </table>
  <p style="margin-top: 16px; font-size: 13px; color: #888;">Reply directly to respond to ${name} at ${email}.</p>
</div>
          `.trim(),
        });
      } catch (emailErr) {
        console.error("[consultation] Email send error:", emailErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[consultation] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
