import { NextResponse } from "next/server";
import { Resend } from "resend";
import { leadSchema } from "@/lib/validations/leads";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const ROLE_LABELS: Record<string, string> = {
  landowner: "Landowner",
  club: "Club or Association",
  angler: "Individual Angler",
  investor: "Investor",
  other: "Other",
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
  message?: string;
}) {
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
  if (!resend) return;

  const name = data.firstName;
  const typeLabel =
    INVESTOR_TYPE_LABELS[data.investorType ?? ""] ?? data.investorType ?? "—";

  // Acknowledgment to investor
  await resend.emails.send({
    from: "AnglerPass Investors <investors@anglerpass.com>",
    to: data.email,
    subject: `Thanks for your interest, ${name}`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #1e1e1a;">
        <h2 style="font-size: 24px; font-weight: 500; margin-bottom: 16px;">Thanks for reaching out, ${name}.</h2>
        <p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">
          We've received your request for the AnglerPass investor deck. We're currently finalizing the materials
          and will send them your way shortly.
        </p>
        <p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">
          In the meantime, feel free to reply to this email with any questions.
        </p>
        <p style="font-size: 14px; color: #9a9a8e; margin-top: 32px;">— The AnglerPass Team</p>
      </div>
    `,
  });

  // Notification to team
  await resend.emails.send({
    from: "AnglerPass Leads <investors@anglerpass.com>",
    to: "investors@anglerpass.com",
    subject: `New deck request: ${name} ${data.lastName ?? ""} (${typeLabel})`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; color: #1e1e1a;">
        <h3 style="margin-bottom: 12px;">New Investor Deck Request</h3>
        <table style="font-size: 14px; line-height: 1.8;">
          <tr><td style="padding-right: 16px; color: #888;"><strong>Name</strong></td><td>${data.firstName} ${data.lastName ?? ""}</td></tr>
          <tr><td style="padding-right: 16px; color: #888;"><strong>Email</strong></td><td><a href="mailto:${data.email}">${data.email}</a></td></tr>
          <tr><td style="padding-right: 16px; color: #888;"><strong>Type</strong></td><td>${typeLabel}</td></tr>
          ${data.message ? `<tr><td style="padding-right: 16px; color: #888;"><strong>Message</strong></td><td>${data.message}</td></tr>` : ""}
        </table>
      </div>
    `,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = leadSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, interestType, message, source, type } =
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
      console.log("[leads] Supabase not configured. Lead captured:", {
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
      });

      if (error && error.code !== "23505") {
        console.error("[leads] Insert error:", error);
        return NextResponse.json(
          { error: "Failed to save lead" },
          { status: 500 }
        );
      }
    }

    // Send emails via Resend
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
          message,
        });
      }
    } catch (emailErr) {
      console.error("[leads] Email send error:", emailErr);
      // Don't fail the request if email fails — lead is already saved
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[leads] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
