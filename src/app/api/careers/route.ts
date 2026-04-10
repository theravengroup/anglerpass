import { jsonError, jsonOk, isDuplicateError } from "@/lib/api/helpers";
import { getResend } from "@/lib/email";
import { careersInquirySchema } from "@/lib/validations/careers";
import { rateLimit, getClientIp } from "@/lib/api/rate-limit";
import { verifyTurnstile } from "@/lib/api/turnstile";

export async function POST(request: Request) {
  const limited = rateLimit("careers", getClientIp(request), 3, 60_000);
  if (limited) return limited;

  try {
    const body = await request.json();

    const turnstileValid = await verifyTurnstile(body.turnstileToken);
    if (!turnstileValid) {
      return jsonError("CAPTCHA verification failed", 400);
    }

    const result = careersInquirySchema.safeParse(body);
    if (!result.success) {
      return jsonError(
        result.error.issues[0]?.message ?? "Invalid input",
        400
      );
    }

    const { name, email, interest } = result.data;

    // Save to leads table
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && serviceRoleKey && supabaseUrl !== "your-supabase-url") {
      const { createAdminClient } = await import("@/lib/supabase/admin");
      const supabase = createAdminClient();

      const nameParts = name.trim().split(/\s+/);
      const firstName = nameParts[0] ?? name;
      const lastName =
        nameParts.length > 1 ? nameParts.slice(1).join(" ") : null;

      const { error } = await supabase.from("leads").insert({
        first_name: firstName,
        last_name: lastName,
        email,
        interest_type: "other",
        type: "contact",
        message: `[Careers Inquiry] ${interest}`,
        source: "team-page",
      });

      if (error && !isDuplicateError(error)) {
        console.error("[careers] Insert error:", error);
      }
    }

    // Send emails via Resend
    const resend = getResend();
    if (resend) {
      try {
        // Confirmation to sender
        await resend.emails.send({
          from: "AnglerPass <hello@anglerpass.com>",
          to: email,
          subject: "Thanks for your interest in joining AnglerPass",
          html: `
<div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #1e1e1a;">
  <h2 style="font-size: 22px; font-weight: 500; margin-bottom: 16px;">Thanks for reaching out, ${name}.</h2>
  <p style="font-size: 15px; line-height: 1.7; color: #5a5a52;">
    We received your inquiry about joining the AnglerPass team and appreciate your interest.
    Someone from our team will review your message and get back to you.
  </p>
  <p style="font-size: 15px; line-height: 1.7; color: #5a5a52;">
    In the meantime, if you have additional questions, just reply to this\u00a0email.
  </p>
  <p style="font-size: 14px; color: #9a9a8e; margin-top: 32px;">\u2014 The AnglerPass Team</p>
</div>
          `.trim(),
        });

        // Forward to the team
        await resend.emails.send({
          from: "AnglerPass Careers <hello@anglerpass.com>",
          to: "hello@anglerpass.com",
          replyTo: email,
          subject: `Careers inquiry: ${name}`,
          html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; color: #333;">
  <p><strong>New careers inquiry from the team page</strong></p>
  <table style="border-collapse: collapse; width: 100%; font-size: 14px;">
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600; width: 100px;">Name</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${name}</td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">Email</td><td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="mailto:${email}">${email}</a></td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">Interest</td><td style="padding: 8px; border-bottom: 1px solid #eee; white-space: pre-wrap;">${interest}</td></tr>
  </table>
  <p style="margin-top: 16px; font-size: 13px; color: #888;">Reply directly to respond to ${name} at ${email}.</p>
</div>
          `.trim(),
        });
      } catch (emailErr) {
        console.error("[careers] Email send error:", emailErr);
      }
    }

    return jsonOk({ success: true });
  } catch (err) {
    console.error("[careers] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}
