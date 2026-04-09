/**
 * CRM email sender — wraps Resend with tracking pixel injection,
 * click wrapping, suppression list checks, and CAN-SPAM compliance.
 */

import "server-only";

import { Resend } from "resend";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getUnsubscribeUrl } from "@/lib/unsubscribe";
import { crmTable } from "@/lib/crm/admin-queries";

// ─── Resend Client ──────────────────────────────────────────────────

let _resend: Resend | null = null;
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://anglerpass.com";

// ─── Types ──────────────────────────────────────────────────────────

export interface CrmEmailPayload {
  sendId: string;
  to: string;
  subject: string;
  htmlBody: string;
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  recipientName?: string;
  userId?: string;
}

export interface CrmSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ─── Pre-send Checks ────────────────────────────────────────────────

/**
 * Check if an email address is on the suppression list.
 */
export async function isSuppressed(
  admin: SupabaseClient,
  email: string
): Promise<boolean> {
  const { data } = await crmTable(admin, "email_suppression_list")
    .select("id")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  return data !== null;
}

/**
 * Check if a user has opted out of marketing emails.
 */
export async function hasMarketingOptOut(
  admin: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data } = await admin
    .from("notification_preferences")
    .select("email_marketing")
    .eq("user_id", userId)
    .maybeSingle();

  // Default is opted-in; only skip if explicitly false
  if (data && (data as Record<string, unknown>).email_marketing === false) {
    return true;
  }
  return false;
}

// ─── Tracking Injection ─────────────────────────────────────────────

/**
 * Inject a 1x1 tracking pixel before the closing tag of the email HTML.
 */
function injectTrackingPixel(html: string, sendId: string): string {
  const pixelUrl = `${SITE_URL}/api/crm/track/open/${sendId}`;
  const pixel = `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;" />`;

  // Insert before the last closing div or at the end
  const lastDivClose = html.lastIndexOf("</div>");
  if (lastDivClose !== -1) {
    return html.slice(0, lastDivClose) + pixel + html.slice(lastDivClose);
  }
  return html + pixel;
}

/**
 * Wrap all <a href="..."> links with click tracking redirects.
 * Skips the unsubscribe link to ensure CAN-SPAM compliance.
 */
function wrapClickLinks(html: string, sendId: string): string {
  const trackBase = `${SITE_URL}/api/crm/track/click/${sendId}`;

  return html.replace(
    /<a\s([^>]*?)href="([^"]+)"([^>]*?)>/gi,
    (_match, before: string, href: string, after: string) => {
      // Don't wrap unsubscribe links or mailto: links
      if (
        href.includes("/unsubscribe") ||
        href.startsWith("mailto:") ||
        href.includes("List-Unsubscribe")
      ) {
        return `<a ${before}href="${href}"${after}>`;
      }

      const wrapped = `${trackBase}?url=${encodeURIComponent(href)}`;
      return `<a ${before}href="${wrapped}"${after}>`;
    }
  );
}

// ─── Email HTML Builder ─────────────────────────────────────────────

/**
 * Build a complete CRM email with tracking, unsubscribe footer,
 * and consistent branding.
 */
export function buildCrmEmailHtml(payload: CrmEmailPayload): string {
  const displayName = escapeHtml(payload.recipientName ?? "there");
  const unsubscribeUrl = payload.userId
    ? getUnsubscribeUrl(payload.userId)
    : `${SITE_URL}/api/notifications/unsubscribe`;

  // Process the body — replace template variables
  let body = payload.htmlBody;
  body = body.replace(/\{\{display_name\}\}/g, displayName);
  body = body.replace(/\{\{email\}\}/g, escapeHtml(payload.to));
  body = body.replace(/\{\{site_url\}\}/g, SITE_URL);
  body = body.replace(/\{\{unsubscribe_url\}\}/g, unsubscribeUrl);

  // Build the CTA button if provided
  const ctaHtml =
    payload.ctaLabel && payload.ctaUrl
      ? `<div style="margin: 28px 0;">
    <a href="${payload.ctaUrl.startsWith("/") ? SITE_URL + payload.ctaUrl : payload.ctaUrl}"
       style="display: inline-block; padding: 14px 32px; background: #1a3a2a; color: #fff; text-decoration: none; border-radius: 6px; font-family: sans-serif; font-size: 14px; font-weight: 500; letter-spacing: 0.3px;">
      ${escapeHtml(payload.ctaLabel)}
    </a>
  </div>`
      : "";

  const rawHtml = `
<div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #1e1e1a;">
  <a href="${SITE_URL}" style="display: block; margin-bottom: 24px; text-decoration: none;">
    <img src="${SITE_URL}/images/anglerpass-email-logo.png" alt="AnglerPass" width="160" style="display: block; width: 160px; height: auto; border: 0;" />
  </a>
  <p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">
    Hi ${displayName},
  </p>
  ${body}
  ${ctaHtml}
  <p style="font-size: 13px; line-height: 1.6; color: #9a9a8e; margin-top: 32px;">
    <a href="${unsubscribeUrl}" style="color: #9a9a8e; text-decoration: underline;">Unsubscribe from marketing emails</a>
    &middot;
    <a href="${SITE_URL}/dashboard/settings" style="color: #9a9a8e; text-decoration: underline;">Email preferences</a>
  </p>
  <p style="font-size: 13px; color: #9a9a8e; margin-top: 24px;">&mdash; The AnglerPass Team</p>
  <p style="font-size: 11px; color: #c0c0b8; margin-top: 16px;">
    AnglerPass, Inc. &middot; Denver, CO
  </p>
</div>`.trim();

  // Inject tracking and wrap links
  const tracked = injectTrackingPixel(rawHtml, payload.sendId);
  return wrapClickLinks(tracked, payload.sendId);
}

// ─── Core Send Function ─────────────────────────────────────────────

/**
 * Send a CRM campaign email via Resend.
 *
 * Before calling this, the caller should check suppression and opt-out
 * using `isSuppressed()` and `hasMarketingOptOut()`.
 */
export async function sendCrmEmail(
  admin: SupabaseClient,
  payload: CrmEmailPayload
): Promise<CrmSendResult> {
  const resend = getResend();
  if (!resend) {
    return { success: false, error: "Resend not configured" };
  }

  // Mark as sending
  await crmTable(admin, "campaign_sends")
    .update({ status: "sending" })
    .eq("id", payload.sendId);

  const fromName = payload.fromName ?? "AnglerPass";
  const fromEmail = payload.fromEmail ?? "hello@anglerpass.com";
  const unsubscribeUrl = payload.userId
    ? getUnsubscribeUrl(payload.userId)
    : `${SITE_URL}/api/notifications/unsubscribe`;

  try {
    const html = buildCrmEmailHtml(payload);

    const result = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: payload.to,
      subject: payload.subject,
      html,
      replyTo: payload.replyTo,
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        "X-Campaign-Send-Id": payload.sendId,
      },
    });

    const messageId =
      result.data && "id" in result.data ? result.data.id : undefined;

    // Update send record
    await crmTable(admin, "campaign_sends")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        resend_message_id: messageId ?? null,
      })
      .eq("id", payload.sendId);

    return { success: true, messageId };
  } catch (err) {
    const errorMsg =
      err instanceof Error ? err.message : "Unknown send error";
    console.error(`[crm/email-sender] Send failed for ${payload.sendId}:`, err);

    await crmTable(admin, "campaign_sends")
      .update({
        status: "failed",
        bounce_reason: errorMsg,
      })
      .eq("id", payload.sendId);

    return { success: false, error: errorMsg };
  }
}

// ─── Batch Sender ───────────────────────────────────────────────────

/**
 * Process a batch of queued sends. Returns count of successfully sent.
 */
export async function processSendBatch(
  admin: SupabaseClient,
  batchSize = 50
): Promise<{ sent: number; skipped: number; failed: number }> {
  // Fetch queued sends that are due
  const { data: queued } = await crmTable(admin, "campaign_sends")
    .select(
      "id, campaign_id, step_id, recipient_id, recipient_email, recipient_type, lead_id, drip_scheduled_for"
    )
    .eq("status", "queued")
    .or("drip_scheduled_for.is.null,drip_scheduled_for.lte.now()")
    .order("created_at", { ascending: true })
    .limit(batchSize);

  if (!queued || queued.length === 0) {
    return { sent: 0, skipped: 0, failed: 0 };
  }

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  const sendsTable = crmTable(admin, "campaign_sends");
  const stepsTable = crmTable(admin, "campaign_steps");
  const campaignsTable = crmTable(admin, "campaigns");

  for (const send of queued) {
    // Check suppression list
    const suppressed = await isSuppressed(admin, send.recipient_email);
    if (suppressed) {
      await sendsTable.update({ status: "skipped" }).eq("id", send.id);
      skipped++;
      continue;
    }

    // Check marketing opt-out for users
    if (send.recipient_type === "user" && send.recipient_id) {
      const optedOut = await hasMarketingOptOut(admin, send.recipient_id);
      if (optedOut) {
        await sendsTable.update({ status: "skipped" }).eq("id", send.id);
        skipped++;
        continue;
      }
    }

    // Load campaign + step for email content
    const { data: step } = await stepsTable
      .select("subject, html_body, cta_label, cta_url")
      .eq("id", send.step_id)
      .single();

    const { data: campaign } = await campaignsTable
      .select("from_name, from_email, reply_to")
      .eq("id", send.campaign_id)
      .single();

    if (!step || !campaign) {
      await sendsTable
        .update({ status: "failed", bounce_reason: "Missing step or campaign" })
        .eq("id", send.id);
      failed++;
      continue;
    }

    // Get recipient name if user
    let recipientName: string | undefined;
    if (send.recipient_id) {
      const { data: profile } = await admin
        .from("profiles")
        .select("display_name")
        .eq("id", send.recipient_id)
        .maybeSingle();
      recipientName = profile?.display_name ?? undefined;
    }

    const result = await sendCrmEmail(admin, {
      sendId: send.id,
      to: send.recipient_email,
      subject: step.subject,
      htmlBody: step.html_body,
      fromName: campaign.from_name,
      fromEmail: campaign.from_email,
      replyTo: campaign.reply_to ?? undefined,
      ctaLabel: step.cta_label ?? undefined,
      ctaUrl: step.cta_url ?? undefined,
      recipientName,
      userId: send.recipient_id ?? undefined,
    });

    if (result.success) {
      sent++;
    } else {
      failed++;
    }
  }

  return { sent, skipped, failed };
}

// ─── Utilities ──────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
