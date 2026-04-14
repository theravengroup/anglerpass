import { jsonError, jsonOk, isDuplicateError } from "@/lib/api/helpers";
import { getResend } from "@/lib/email";
import {
  corporateInquirySchema,
  EMPLOYEE_COUNT_OPTIONS,
  USE_CASE_OPTIONS,
  TIMELINE_OPTIONS,
  REGION_OPTIONS,
} from "@/lib/validations/corporate-inquiry";
import { rateLimit, getClientIp } from "@/lib/api/rate-limit";
import { verifyTurnstile } from "@/lib/api/turnstile";

function labelFor<T extends { value: string; label: string }>(
  options: readonly T[],
  value: string
): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

export async function POST(request: Request) {
  const limited = rateLimit("corporate-inquiry", getClientIp(request), 3, 60_000);
  if (limited) return limited;

  try {
    const body = await request.json();

    const turnstileValid = await verifyTurnstile(body.turnstileToken);
    if (!turnstileValid) {
      return jsonError("CAPTCHA verification failed", 400);
    }

    const result = corporateInquirySchema.safeParse(body);
    if (!result.success) {
      return jsonError(result.error.issues[0]?.message ?? "Invalid input", 400);
    }

    const data = result.data;

    const structuredMessage = [
      `Company: ${data.companyName}`,
      `Contact: ${data.contactName}`,
      data.phone ? `Phone: ${data.phone}` : null,
      `Company size: ${labelFor(EMPLOYEE_COUNT_OPTIONS, data.employeeCount)}`,
      `Estimated members: ${data.estimatedMembers}`,
      `Use case: ${labelFor(USE_CASE_OPTIONS, data.useCase)}`,
      `Regions: ${data.regions.map((r) => labelFor(REGION_OPTIONS, r)).join(", ")}`,
      `Timeline: ${labelFor(TIMELINE_OPTIONS, data.timeline)}`,
      data.notes ? `Notes: ${data.notes}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    // Save to leads table
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && serviceRoleKey && supabaseUrl !== "your-supabase-url") {
      const { createAdminClient } = await import("@/lib/supabase/admin");
      const supabase = createAdminClient();

      const nameParts = data.contactName.trim().split(/\s+/);
      const firstName = nameParts[0] ?? data.contactName;
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : null;

      const { error } = await supabase.from("leads").insert({
        first_name: firstName,
        last_name: lastName,
        email: data.workEmail,
        interest_type: "other",
        type: "contact",
        message: structuredMessage,
        source: "corporate-inquiry",
      });

      if (error && !isDuplicateError(error)) {
        console.error("[corporate-inquiry] Insert error:", error);
      }
    }

    // Send emails via Resend
    const resend = getResend();
    if (resend) {
      try {
        // Confirmation to submitter
        await resend.emails.send({
          from: "AnglerPass <hello@anglerpass.com>",
          to: data.workEmail,
          subject: "We received your corporate membership inquiry",
          html: `
<div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #1e1e1a;">
  <h2 style="font-size: 22px; font-weight: 500; margin-bottom: 16px;">Thanks, ${data.contactName}.</h2>
  <p style="font-size: 15px; line-height: 1.7; color: #5a5a52;">
    We received your inquiry about corporate memberships for <strong>${data.companyName}</strong>. A member of our corporate sales team will reach out within 1 business day to discuss next steps.
  </p>
  <p style="font-size: 15px; line-height: 1.7; color: #5a5a52;">
    In the meantime, if you have additional questions, just reply to this email.
  </p>
  <p style="font-size: 14px; color: #9a9a8e; margin-top: 32px;">\u2014 The AnglerPass Team</p>
</div>
          `.trim(),
        });

        // Internal notification to sales
        await resend.emails.send({
          from: "AnglerPass Corporate Inquiries <hello@anglerpass.com>",
          to: "partners@anglerpass.com",
          replyTo: data.workEmail,
          subject: `Corporate inquiry: ${data.companyName} (${labelFor(EMPLOYEE_COUNT_OPTIONS, data.employeeCount)})`,
          html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; color: #333;">
  <p><strong>New corporate membership inquiry</strong></p>
  <table style="border-collapse: collapse; width: 100%; font-size: 14px;">
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">Company</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.companyName}</td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">Contact</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.contactName}</td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">Email</td><td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="mailto:${data.workEmail}">${data.workEmail}</a></td></tr>
    ${data.phone ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">Phone</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.phone}</td></tr>` : ""}
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">Company size</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${labelFor(EMPLOYEE_COUNT_OPTIONS, data.employeeCount)}</td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">Estimated members</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.estimatedMembers}</td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">Use case</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${labelFor(USE_CASE_OPTIONS, data.useCase)}</td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">Regions</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.regions.map((r) => labelFor(REGION_OPTIONS, r)).join(", ")}</td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">Timeline</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${labelFor(TIMELINE_OPTIONS, data.timeline)}</td></tr>
    ${data.notes ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">Notes</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.notes}</td></tr>` : ""}
  </table>
  <p style="margin-top: 16px; font-size: 13px; color: #888;">Reply directly to respond to ${data.contactName} at ${data.workEmail}.</p>
</div>
          `.trim(),
        });
      } catch (emailErr) {
        console.error("[corporate-inquiry] Email send error:", emailErr);
      }
    }

    return jsonOk({ success: true });
  } catch (err) {
    console.error("[corporate-inquiry] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}
