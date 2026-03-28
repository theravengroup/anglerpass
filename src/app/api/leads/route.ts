import { NextResponse } from "next/server";
import { Resend } from "resend";
import { leadSchema } from "@/lib/validations/leads";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

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

    // Check if Supabase is configured
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
      return NextResponse.json({ success: true });
    }

    // Dynamic import to avoid errors when env vars are missing
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

    if (error) {
      // Handle duplicate email+type gracefully
      if (error.code === "23505") {
        return NextResponse.json({ success: true });
      }

      console.error("[leads] Insert error:", error);
      return NextResponse.json(
        { error: "Failed to save lead" },
        { status: 500 }
      );
    }

    // Send emails for investor requests
    if (type === "investor" && resend) {
      const displayName = firstName || "there";

      // Confirmation email to the investor
      try {
        await resend.emails.send({
          from: "AnglerPass Investors <investors@anglerpass.com>",
          to: email,
          subject: "AnglerPass | Investor Snapshot",
          html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; color: #1a2e1a;">
  <p style="font-size: 15px; line-height: 1.7; color: #333;">Hi ${displayName},</p>
  <p style="font-size: 15px; line-height: 1.7; color: #333;">Thanks for your interest in AnglerPass.</p>
  <p style="font-size: 15px; line-height: 1.7; color: #333;">Attached is the AnglerPass Investor Snapshot, a concise overview of the market opportunity and the platform we are building around private water access.</p>
  <p style="font-size: 15px; line-height: 1.7; color: #333;">We share the full investor presentation after a brief introductory conversation so we can provide the right context around the business model, rollout strategy, and capital plan.</p>
  <p style="font-size: 15px; line-height: 1.7; color: #333;">If you&rsquo;d like to continue the conversation, just reply here and we&rsquo;ll coordinate next steps.</p>
  <p style="font-size: 15px; line-height: 1.7; color: #333;">Best,<br/>AnglerPass</p>
</div>
          `.trim(),
        });
      } catch (emailErr) {
        console.error("[leads] Investor confirmation email failed:", emailErr);
      }

      // Internal notification email
      try {
        await resend.emails.send({
          from: "AnglerPass Leads <investors@anglerpass.com>",
          to: "investors@anglerpass.com",
          subject: `New snapshot request: ${firstName} ${lastName ?? ""} (${interestType ?? "investor"})`.trim(),
          html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; color: #333;">
  <p><strong>New investor snapshot request</strong></p>
  <table style="border-collapse: collapse; width: 100%; font-size: 14px;">
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">Name</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${firstName} ${lastName ?? ""}</td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">Email</td><td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="mailto:${email}">${email}</a></td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">Type</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${interestType ?? "—"}</td></tr>
    ${message ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">Message</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${message}</td></tr>` : ""}
  </table>
</div>
          `.trim(),
        });
      } catch (emailErr) {
        console.error("[leads] Internal notification email failed:", emailErr);
      }
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
