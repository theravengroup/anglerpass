import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendCrmEmail } from "@/lib/crm/email-sender";
import { runPreSendChecks } from "@/lib/crm/subscription-checks";
import { crmSendSchema } from "@/lib/validations/crm";

// ─── POST /api/crm/send ───────────────────────────────────────────
// API-triggered email send. Used by server code to send one-off or
// transactional emails through the CRM system with full tracking,
// template rendering, subscription checks, and frequency caps.
//
// Auth: Requires CRON_SECRET or internal service key.

export async function POST(req: NextRequest) {
  // Auth: service-to-service via CRON_SECRET or admin session
  const authHeader = req.headers.get("authorization");
  const isCronAuth = authHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (!isCronAuth) {
    // Fall back to admin session check
    const { requireAdmin } = await import("@/lib/api/helpers");
    const auth = await requireAdmin();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = crmSendSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const input = result.data;
  const admin = createAdminClient();

  // Resolve email from user_id if needed
  let email = input.to;
  let userId = input.user_id;
  let recipientName: string | undefined;

  if (userId && !email) {
    const { data: { user } } = await admin.auth.admin.getUserById(userId);
    if (!user?.email) {
      return NextResponse.json(
        { error: "User not found or has no email" },
        { status: 404 }
      );
    }
    email = user.email;
  }

  if (!email) {
    return NextResponse.json(
      { error: "Could not resolve recipient email" },
      { status: 400 }
    );
  }

  // Look up user profile for name
  if (userId) {
    const { data: profile } = await admin
      .from("profiles")
      .select("display_name")
      .eq("id", userId)
      .maybeSingle();
    recipientName = profile?.display_name ?? undefined;
  } else {
    // Try to find user by email
    const { data: { users } } = await admin.auth.admin.listUsers();
    const matchedUser = users?.find((u) => u.email === email);
    if (matchedUser) {
      userId = matchedUser.id;
      const { data: profile } = await admin
        .from("profiles")
        .select("display_name")
        .eq("id", userId)
        .maybeSingle();
      recipientName = profile?.display_name ?? undefined;
    }
  }

  // Resolve topic from slug for subscription checking
  let campaignId = input.campaign_id;

  if (input.topic_slug && !input.skip_checks) {
    // Find or create a virtual campaign linkage for topic checking
    const { data: topic } = await admin.from("crm_subscription_topics")
      .select("id")
      .eq("slug", input.topic_slug)
      .maybeSingle();

    if (topic && campaignId) {
      // Ensure campaign has this topic
      await admin.from("campaigns")
        .update({ topic_id: topic.id })
        .eq("id", campaignId);
    }
  }

  // Run pre-send checks unless skipped (transactional)
  if (!input.skip_checks) {
    const check = await runPreSendChecks(admin, {
      recipientEmail: email,
      recipientId: userId,
      recipientType: userId ? "user" : "lead",
      campaignId: campaignId ?? "api-send",
    });

    if (!check.allowed) {
      return NextResponse.json(
        {
          sent: false,
          reason: check.reason,
          message: `Email not sent: ${check.reason}`,
        },
        { status: 200 }
      );
    }
  }

  // Create a send record for tracking (requires campaign_id + step_id)
  let sendId: string;
  let tracked = false;

  if (campaignId && input.step_id) {
    const { data: send, error: sendError } = await admin.from("campaign_sends")
      .insert({
        campaign_id: campaignId,
        step_id: input.step_id,
        recipient_id: userId ?? null,
        recipient_email: email,
        recipient_type: userId ? "user" : "lead",
        lead_id: null,
        status: "queued",
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (!sendError && send) {
      sendId = send.id;
      tracked = true;
    } else {
      sendId = crypto.randomUUID();
    }
  } else {
    sendId = crypto.randomUUID();
  }

  if (!tracked) {
    // Send without tracking record
    const sendResult = await sendCrmEmail(admin, {
      sendId,
      to: email,
      subject: input.subject,
      htmlBody: input.html_body,
      fromName: input.from_name,
      fromEmail: input.from_email,
      replyTo: input.reply_to,
      ctaLabel: input.cta_label,
      ctaUrl: input.cta_url,
      recipientName,
      userId: userId ?? undefined,
      templateData: input.data,
    });

    return NextResponse.json({
      sent: sendResult.success,
      message_id: sendResult.messageId,
      tracked: false,
      error: sendResult.error,
    });
  }

  // Send the email
  const sendResult = await sendCrmEmail(admin, {
    sendId,
    to: email,
    subject: input.subject,
    htmlBody: input.html_body,
    fromName: input.from_name,
    fromEmail: input.from_email,
    replyTo: input.reply_to,
    ctaLabel: input.cta_label,
    ctaUrl: input.cta_url,
    recipientName,
    userId: userId ?? undefined,
    templateData: input.data,
  });

  return NextResponse.json({
    sent: sendResult.success,
    send_id: sendId,
    message_id: sendResult.messageId,
    tracked: true,
    error: sendResult.error,
  });
}
