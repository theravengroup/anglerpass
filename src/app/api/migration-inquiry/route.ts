import { NextResponse } from "next/server";
import { Resend } from "resend";
import { migrationInquirySchema } from "@/lib/validations/migration-inquiry";
import { rateLimit, getClientIp } from "@/lib/api/rate-limit";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const DATA_SOURCE_LABELS: Record<string, string> = {
  "excel-sheets": "Excel or Google Sheets",
  "google-forms": "Google Forms",
  "club-software": "Club management software",
  paper: "Paper records",
  "legacy-dos": "Legacy or DOS system",
  other: "Other",
};

const WEBSITE_LABELS: Record<string, string> = {
  wordpress: "WordPress",
  squarespace: "Squarespace",
  wix: "Wix",
  custom: "Custom built",
  none: "No website",
  other: "Other",
};

const MULTIYEAR_LABELS: Record<string, string> = {
  yes: "Yes, definitely",
  possibly: "Possibly",
  "not-sure": "Not sure yet",
};

export async function POST(request: Request) {
  const limited = rateLimit("migration-inquiry", getClientIp(request), 5, 60_000);
  if (limited) return limited;

  try {
    const body = await request.json();
    const result = migrationInquirySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const data = result.data;

    // Save to Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (
      !supabaseUrl ||
      !serviceRoleKey ||
      supabaseUrl === "your-supabase-url" ||
      serviceRoleKey === "your-supabase-service-role-key"
    ) {
      console.log(
        "[migration-inquiry] Supabase not configured. Inquiry captured:",
        data
      );
    } else {
      const { createAdminClient } = await import("@/lib/supabase/admin");
      const supabase = createAdminClient();

      const { error } = await supabase
        .from("migration_inquiries")
        .insert({
          club_name: data.clubName,
          contact_name: data.contactName,
          email: data.email,
          member_count: data.memberCount,
          data_source: data.dataSource,
          website_platform: data.websitePlatform ?? null,
          multiyear_interest: data.multiyearInterest ?? null,
          target_launch: data.targetLaunch || null,
          loom_url: data.loomUrl,
          notes: data.notes ?? null,
        });

      if (error) {
        console.error("[migration-inquiry] Insert error:", error);
        return NextResponse.json(
          { error: "Failed to save inquiry" },
          { status: 500 }
        );
      }
    }

    // Send emails via Resend
    try {
      if (resend) {
        // Confirmation to submitter
        await resend.emails.send({
          from: "AnglerPass <hello@anglerpass.com>",
          to: data.email,
          subject: "We received your migration inquiry",
          html: `
            <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #1e1e1a;">
              <h2 style="font-size: 24px; font-weight: 500; margin-bottom: 16px;">Thanks for reaching out, ${data.contactName}.</h2>
              <p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">
                We've received your migration inquiry for <strong>${data.clubName}</strong> and will review your Loom video and details shortly.
              </p>
              <p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">
                Expect to hear back from us within 2 business days. If you have questions in the meantime, just reply to this email.
              </p>
              <p style="font-size: 14px; color: #9a9a8e; margin-top: 32px;">&mdash; The AnglerPass Team</p>
            </div>
          `,
        });

        // Notification to team
        await resend.emails.send({
          from: "AnglerPass <hello@anglerpass.com>",
          to: "onboarding@anglerpass.com",
          subject: `New migration inquiry: ${data.clubName} (${data.memberCount} members)`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; color: #1e1e1a;">
              <h3 style="margin-bottom: 12px;">New Migration Inquiry</h3>
              <table style="font-size: 14px; line-height: 1.8; border-collapse: collapse; width: 100%;">
                <tr><td style="padding: 6px 16px 6px 0; color: #888; font-weight: 600;">Club</td><td>${data.clubName}</td></tr>
                <tr><td style="padding: 6px 16px 6px 0; color: #888; font-weight: 600;">Contact</td><td>${data.contactName}</td></tr>
                <tr><td style="padding: 6px 16px 6px 0; color: #888; font-weight: 600;">Email</td><td><a href="mailto:${data.email}">${data.email}</a></td></tr>
                <tr><td style="padding: 6px 16px 6px 0; color: #888; font-weight: 600;">Members</td><td>${data.memberCount}</td></tr>
                <tr><td style="padding: 6px 16px 6px 0; color: #888; font-weight: 600;">Data source</td><td>${DATA_SOURCE_LABELS[data.dataSource] ?? data.dataSource}</td></tr>
                <tr><td style="padding: 6px 16px 6px 0; color: #888; font-weight: 600;">Website</td><td>${data.websitePlatform ? WEBSITE_LABELS[data.websitePlatform] ?? data.websitePlatform : "—"}</td></tr>
                <tr><td style="padding: 6px 16px 6px 0; color: #888; font-weight: 600;">Multi-year</td><td>${data.multiyearInterest ? MULTIYEAR_LABELS[data.multiyearInterest] ?? data.multiyearInterest : "—"}</td></tr>
                <tr><td style="padding: 6px 16px 6px 0; color: #888; font-weight: 600;">Target launch</td><td>${data.targetLaunch ?? "—"}</td></tr>
                <tr><td style="padding: 6px 16px 6px 0; color: #888; font-weight: 600;">Loom</td><td><a href="${data.loomUrl}">${data.loomUrl}</a></td></tr>
                ${data.notes ? `<tr><td style="padding: 6px 16px 6px 0; color: #888; font-weight: 600;">Notes</td><td>${data.notes}</td></tr>` : ""}
              </table>
            </div>
          `,
        });
      }
    } catch (emailErr) {
      console.error("[migration-inquiry] Email send error:", emailErr);
      // Don't fail the request if email fails — inquiry is already saved
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[migration-inquiry] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
