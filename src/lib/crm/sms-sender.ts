/**
 * SMS sender — sends text messages via Twilio.
 *
 * Uses TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER
 * environment variables. If not configured, SMS sends are logged as
 * failed with a descriptive error.
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { crmTable } from "@/lib/crm/admin-queries";
import { renderTemplate, buildTemplateData } from "@/lib/crm/template-engine";
import type { RecipientContext } from "@/lib/crm/template-engine";

export interface SmsSendOptions {
  userId?: string;
  phoneNumber: string;
  message: string;
  sourceType?: "workflow" | "campaign" | "api" | "system";
  sourceId?: string;
  templateContext?: RecipientContext;
  templateExtras?: Record<string, unknown>;
}

export interface SmsSendResult {
  success: boolean;
  sendId: string;
  providerId?: string;
  error?: string;
}

/**
 * Send an SMS message. Creates a tracking record and attempts delivery
 * via Twilio. The message is rendered through the template engine if
 * a templateContext is provided.
 */
export async function sendSms(
  admin: SupabaseClient,
  opts: SmsSendOptions
): Promise<SmsSendResult> {
  // Render template if context provided
  let renderedMessage = opts.message;
  if (opts.templateContext) {
    const data = buildTemplateData(opts.templateContext, opts.templateExtras);
    renderedMessage = renderTemplate(opts.message, data);
  }

  // Truncate to SMS limits (160 chars for single, 1600 for concatenated)
  if (renderedMessage.length > 1600) {
    renderedMessage = renderedMessage.substring(0, 1597) + "...";
  }

  // Create tracking record
  const sendId = crypto.randomUUID();
  await crmTable(admin, "crm_sms_sends").insert({
    id: sendId,
    user_id: opts.userId ?? null,
    phone_number: opts.phoneNumber,
    message: renderedMessage,
    status: "queued",
    source_type: opts.sourceType ?? "system",
    source_id: opts.sourceId ?? null,
  });

  // Check Twilio configuration
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    const error = "Twilio not configured — TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_PHONE_NUMBER missing";
    console.warn(`[sms-sender] ${error}`);

    await crmTable(admin, "crm_sms_sends")
      .update({ status: "failed", error_message: error })
      .eq("id", sendId);

    return { success: false, sendId, error };
  }

  try {
    // Send via Twilio REST API
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const body = new URLSearchParams({
      To: opts.phoneNumber,
      From: fromNumber,
      Body: renderedMessage,
    });

    const res = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (res.ok) {
      const json = await res.json();
      const providerId = json.sid as string;

      await crmTable(admin, "crm_sms_sends")
        .update({
          status: "sent",
          provider_id: providerId,
          sent_at: new Date().toISOString(),
        })
        .eq("id", sendId);

      return { success: true, sendId, providerId };
    } else {
      const errorBody = await res.text();
      const error = `Twilio error ${res.status}: ${errorBody.substring(0, 200)}`;

      await crmTable(admin, "crm_sms_sends")
        .update({ status: "failed", error_message: error })
        .eq("id", sendId);

      return { success: false, sendId, error };
    }
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error";

    await crmTable(admin, "crm_sms_sends")
      .update({ status: "failed", error_message: error })
      .eq("id", sendId);

    return { success: false, sendId, error };
  }
}

/**
 * Check if a user has opted into SMS and has a phone number.
 */
export async function canReceiveSms(
  admin: SupabaseClient,
  userId: string
): Promise<{ allowed: boolean; phoneNumber?: string }> {
  const { data } = await admin
    .from("profiles")
    .select("phone_number, sms_opt_in")
    .eq("id", userId)
    .maybeSingle();

  if (!data) return { allowed: false };

  const profile = data as Record<string, unknown>;
  const phone = profile.phone_number as string | null;
  const optIn = profile.sms_opt_in as boolean;

  if (!phone || !optIn) return { allowed: false };

  return { allowed: true, phoneNumber: phone };
}
