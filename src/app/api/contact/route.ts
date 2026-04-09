import { jsonError, jsonOk } from "@/lib/api/helpers";
import { getResend } from "@/lib/email";
import { contactSchema, CONTACT_DEPARTMENTS } from "@/lib/validations/contact";
import { rateLimit, getClientIp } from "@/lib/api/rate-limit";
import { verifyTurnstile } from "@/lib/api/turnstile";

export async function POST(request: Request) {
  const limited = rateLimit("contact", getClientIp(request), 3, 60_000);
  if (limited) return limited;

  try {
    const body = await request.json();

    const turnstileValid = await verifyTurnstile(body.turnstileToken);
    if (!turnstileValid) {
      return jsonError("CAPTCHA verification failed", 400);
    }

    const result = contactSchema.safeParse(body);

    if (!result.success) {
      return jsonError(result.error.issues[0]?.message ?? "Invalid input", 400);
    }

    const { name, email, department, message } = result.data;
    const dept = CONTACT_DEPARTMENTS.find((d) => d.value === department);
    if (!dept) {
      return jsonError("Invalid department", 400);
    }

    // Save to leads table
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && serviceRoleKey && supabaseUrl !== "your-supabase-url") {
      const { createAdminClient } = await import("@/lib/supabase/admin");
      const supabase = createAdminClient();

      const nameParts = name.trim().split(/\s+/);
      const firstName = nameParts[0] ?? name;
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : null;

      const { error } = await supabase.from("leads").insert({
        first_name: firstName,
        last_name: lastName,
        email,
        interest_type: "other",
        type: "contact",
        message: `[${dept.label}] ${message}`,
        source: "contact-form",
      });

      if (error && error.code !== "23505") {
        console.error("[contact] Insert error:", error);
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
          subject: "We received your message",
          html: `
<div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #1e1e1a;">
  <h2 style="font-size: 22px; font-weight: 500; margin-bottom: 16px;">Thanks for reaching out, ${name}.</h2>
  <p style="font-size: 15px; line-height: 1.7; color: #5a5a52;">
    We received your message and our ${dept.label.toLowerCase()} team will get back to you within 24\u201348 hours.
  </p>
  <p style="font-size: 15px; line-height: 1.7; color: #5a5a52;">
    In the meantime, if you have additional questions, just reply to this email.
  </p>
  <p style="font-size: 14px; color: #9a9a8e; margin-top: 32px;">\u2014 The AnglerPass Team</p>
</div>
          `.trim(),
        });

        // Forward to the appropriate department
        await resend.emails.send({
          from: "AnglerPass Contact Form <hello@anglerpass.com>",
          to: dept.email,
          replyTo: email,
          subject: `Contact form: ${name} (${dept.label})`,
          html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; color: #333;">
  <p><strong>New contact form submission</strong></p>
  <table style="border-collapse: collapse; width: 100%; font-size: 14px;">
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">Name</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${name}</td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">Email</td><td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="mailto:${email}">${email}</a></td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">Department</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${dept.label}</td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">Message</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${message}</td></tr>
  </table>
  <p style="margin-top: 16px; font-size: 13px; color: #888;">Reply directly to respond to ${name} at ${email}.</p>
</div>
          `.trim(),
        });
      } catch (emailErr) {
        console.error("[contact] Email send error:", emailErr);
      }
    }

    return jsonOk({ success: true });
  } catch (err) {
    console.error("[contact] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}
