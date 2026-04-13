import { jsonError, jsonOk, isDuplicateError } from "@/lib/api/helpers";
import { getResend } from "@/lib/email";
import { leadSchema } from "@/lib/validations/leads";
import { rateLimit, getClientIp } from "@/lib/api/rate-limit";
import { verifyTurnstile } from "@/lib/api/turnstile";
import { fireCrmTrigger } from "@/lib/crm/triggers";

const ROLE_LABELS: Record<string, string> = {
  landowner: "Landowner",
  club: "Club or Association",
  angler: "Individual Angler",
  guide: "Guide",
  corporate: "Corporate Member",
  partner: "Partner",
  investor: "Investor",
  other: "Other",
};

const ROLE_QUESTIONS: Record<string, string> = {
  angler: "What\u2019s your biggest frustration with accessing private water today?",
  landowner: "Do you currently allow fishing on your property?",
  club: "How many members does your club currently have?",
  guide: "How many years have you been guiding and where?",
  corporate: "What company are you with?",
};

const INVESTOR_TYPE_LABELS: Record<string, string> = {
  angel: "Angel Investor",
  vc: "Venture Capital",
  "family-office": "Family Office",
  strategic: "Strategic / Industry",
  other: "Other",
};

async function sendWaitlistEmails(data: {
  firstName: string;
  lastName?: string;
  email: string;
  interestType: string;
  state?: string;
  roleResponse?: string;
  message?: string;
}) {
  const resend = getResend();
  if (!resend) return;

  const name = data.firstName;
  const roleLabel = ROLE_LABELS[data.interestType] ?? data.interestType;

  // Confirmation to submitter
  await resend.emails.send({
    from: "AnglerPass <hello@anglerpass.com>",
    to: data.email,
    subject: `You're on the list, ${name}`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #1e1e1a;">
        <h2 style="font-size: 24px; font-weight: 500; margin-bottom: 16px;">Welcome to the waitlist, ${name}.</h2>
        <p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">
          Thanks for your interest in AnglerPass. We're building the operating platform for private fly fishing access —
          and you'll be among the first to know when we launch.
        </p>
        <p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">
          We'll be in touch soon with updates. In the meantime, if you have questions, just reply to this email.
        </p>
        <p style="font-size: 14px; color: #9a9a8e; margin-top: 32px;">— The AnglerPass Team</p>
      </div>
    `,
  });

  // Notification to team
  await resend.emails.send({
    from: "AnglerPass Leads <hello@anglerpass.com>",
    to: "hello@anglerpass.com",
    subject: `New waitlist signup: ${name} ${data.lastName ?? ""} (${roleLabel})`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; color: #1e1e1a;">
        <h3 style="margin-bottom: 12px;">New Waitlist Signup</h3>
        <table style="font-size: 14px; line-height: 1.8;">
          <tr><td style="padding-right: 16px; color: #888;"><strong>Name</strong></td><td>${data.firstName} ${data.lastName ?? ""}</td></tr>
          <tr><td style="padding-right: 16px; color: #888;"><strong>Email</strong></td><td><a href="mailto:${data.email}">${data.email}</a></td></tr>
          <tr><td style="padding-right: 16px; color: #888;"><strong>Role</strong></td><td>${roleLabel}</td></tr>
          ${data.state ? `<tr><td style="padding-right: 16px; color: #888;"><strong>State</strong></td><td>${data.state}</td></tr>` : ""}
          ${data.roleResponse ? `<tr><td style="padding-right: 16px; color: #888;"><strong>${ROLE_QUESTIONS[data.interestType] ?? "Role Q&amp;A"}</strong></td><td>${data.roleResponse}</td></tr>` : ""}
          ${data.message ? `<tr><td style="padding-right: 16px; color: #888;"><strong>Message</strong></td><td>${data.message}</td></tr>` : ""}
        </table>
      </div>
    `,
  });
}

async function sendInvestorEmails(data: {
  firstName: string;
  lastName?: string;
  email: string;
  investorType?: string;
  message?: string;
}) {
  const resend = getResend();
  if (!resend) return;

  const name = data.firstName;
  const typeLabel =
    INVESTOR_TYPE_LABELS[data.investorType ?? ""] ?? data.investorType ?? "—";

  // Fetch the Investor Snapshot PDF for attachment
  let attachments: { filename: string; content: Buffer }[] = [];
  try {
    const snapshotRes = await fetch("https://anglerpass.com/images/anglerpass-investor-snapshot.pdf");
    if (snapshotRes.ok) {
      const arrayBuffer = await snapshotRes.arrayBuffer();
      attachments = [{ filename: "AnglerPass-Investor-Snapshot.pdf", content: Buffer.from(arrayBuffer) }];
    }
  } catch {
    console.error("[leads] Failed to fetch investor snapshot for attachment");
  }

  // Confirmation to investor
  await resend.emails.send({
    from: "AnglerPass Investors <investors@anglerpass.com>",
    to: data.email,
    subject: "AnglerPass | Investor Snapshot",
    attachments,
    html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; color: #1a2e1a;">
  <p style="font-size: 15px; line-height: 1.7; color: #333;">Hi ${name},</p>
  <p style="font-size: 15px; line-height: 1.7; color: #333;">Thanks for your interest in AnglerPass.</p>
  <p style="font-size: 15px; line-height: 1.7; color: #333;">Attached is the AnglerPass Investor Snapshot, a concise overview of the market opportunity and the platform we are building around private water access.</p>
  <p style="font-size: 15px; line-height: 1.7; color: #333;">We share the full investor presentation after a brief introductory conversation so we can provide the right context around the business model, rollout strategy, and capital plan.</p>
  <p style="font-size: 15px; line-height: 1.7; color: #333;">If you'd like to continue the conversation, just reply here and we'll coordinate next steps.</p>
  <p style="font-size: 15px; line-height: 1.7; color: #333;">Best,<br/>AnglerPass</p>
</div>
    `.trim(),
  });

  // Notification to team
  await resend.emails.send({
    from: "AnglerPass Leads <investors@anglerpass.com>",
    to: "investors@anglerpass.com",
    subject: `New snapshot request: ${name} ${data.lastName ?? ""} (${typeLabel})`.trim(),
    html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; color: #333;">
  <p><strong>New investor snapshot request</strong></p>
  <table style="border-collapse: collapse; width: 100%; font-size: 14px;">
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">Name</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.firstName} ${data.lastName ?? ""}</td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">Email</td><td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="mailto:${data.email}">${data.email}</a></td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">Type</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${typeLabel}</td></tr>
    ${data.message ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">Message</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.message}</td></tr>` : ""}
  </table>
</div>
    `.trim(),
  });
}

export async function POST(request: Request) {
  const limited = rateLimit("leads", getClientIp(request), 5, 60_000);
  if (limited) return limited;

  try {
    const body = await request.json();

    const turnstileValid = await verifyTurnstile(body.turnstileToken);
    if (!turnstileValid) {
      return jsonError("CAPTCHA verification failed", 400);
    }

    const result = leadSchema.safeParse(body);

    if (!result.success) {
      return jsonError(result.error.issues[0]?.message ?? "Invalid input", 400);
    }

    const { firstName, lastName, email, interestType, state, roleResponse, message, source, type } =
      result.data;

    // Save to Supabase if configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (
      !supabaseUrl ||
      !serviceRoleKey ||
      supabaseUrl === "your-supabase-url" ||
      serviceRoleKey === "your-supabase-service-role-key"
    ) {
      console.info("[leads] Supabase not configured. Lead captured:", {
        firstName,
        lastName,
        email,
        interestType,
        type,
        source,
      });
    } else {
      const { createAdminClient } = await import("@/lib/supabase/admin");
      const supabase = createAdminClient();

      const { error } = await supabase.from("leads").insert({
        first_name: firstName,
        last_name: lastName ?? null,
        email,
        interest_type: interestType,
        type: type ?? "waitlist",
        message: message ?? null,
        source: source ?? "homepage",
        state: state ?? null,
        role_response: roleResponse ?? null,
      });

      if (error && !isDuplicateError(error)) {
        console.error("[leads] Insert error:", error);
        return jsonError("Failed to save lead", 500);
      }
    }

    // Fire CRM trigger for new leads
    fireCrmTrigger("lead_created", {
      email,
      metadata: { interestType, source, type },
    }).catch((err) => console.error("[leads] CRM trigger error:", err));

    // Send emails via Resend (even on duplicate DB entries — they may not have received the email)
    try {
      if (type === "investor") {
        await sendInvestorEmails({
          firstName,
          lastName,
          email,
          investorType: body.investorType,
          message,
        });
      } else {
        await sendWaitlistEmails({
          firstName,
          lastName,
          email,
          interestType,
          state,
          roleResponse,
          message,
        });
      }
    } catch (emailErr) {
      console.error("[leads] Email send error:", emailErr);
      // Don't fail the request if email fails — lead is already saved
    }

    return jsonOk({ success: true });
  } catch (err) {
    console.error("[leads] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}
