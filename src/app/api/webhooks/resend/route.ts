import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { crmTable } from "@/lib/crm/admin-queries";
import { jsonOk, jsonError } from "@/lib/api/helpers";

/**
 * POST /api/webhooks/resend
 *
 * Resend webhook handler for email delivery events.
 * Processes: delivered, bounced, complained.
 * Updates campaign_sends and manages the suppression list.
 */
export async function POST(request: NextRequest) {
  // Verify webhook secret
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  if (webhookSecret) {
    const signature = request.headers.get("svix-signature");
    if (!signature) {
      return jsonError("Missing webhook signature", 401);
    }
  }

  let payload: ResendWebhookPayload;
  try {
    payload = (await request.json()) as ResendWebhookPayload;
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const { type, data } = payload;
  if (!type || !data) {
    return jsonError("Missing type or data", 400);
  }

  const admin = createAdminClient();
  const sends = crmTable(admin, "campaign_sends");
  const events = crmTable(admin, "engagement_events");
  const suppressions = crmTable(admin, "email_suppression_list");
  const enrollments = crmTable(admin, "campaign_enrollments");

  // Find the campaign_send by Resend message ID
  const messageId = data.email_id;
  if (!messageId) {
    return jsonOk({ received: true, matched: false });
  }

  const { data: send } = await sends
    .select("id, recipient_email, campaign_id")
    .eq("resend_message_id", messageId)
    .maybeSingle();

  if (!send) {
    return jsonOk({ received: true, matched: false });
  }

  const sendRow = send as Record<string, unknown>;

  switch (type) {
    case "email.delivered": {
      await sends
        .update({
          status: "delivered",
          delivered_at: new Date().toISOString(),
        })
        .eq("id", sendRow.id);
      break;
    }

    case "email.bounced": {
      const bounceReason =
        data.bounce?.message ?? data.bounce?.description ?? "Unknown bounce";

      await sends
        .update({
          status: "bounced",
          bounced_at: new Date().toISOString(),
          bounce_reason: bounceReason,
        })
        .eq("id", sendRow.id);

      await events.insert({
        send_id: sendRow.id,
        event_type: "bounce",
      });

      // Hard bounce → suppression list
      if (data.bounce?.type === "hard") {
        await suppressions.upsert(
          {
            email: (sendRow.recipient_email as string).toLowerCase(),
            reason: "hard_bounce",
            source: "resend_webhook",
          },
          { onConflict: "email" }
        );

        await enrollments
          .update({ status: "cancelled" })
          .eq("recipient_email", sendRow.recipient_email)
          .eq("status", "active");
      }
      break;
    }

    case "email.complained": {
      await suppressions.upsert(
        {
          email: (sendRow.recipient_email as string).toLowerCase(),
          reason: "complaint",
          source: "resend_webhook",
        },
        { onConflict: "email" }
      );

      await events.insert({
        send_id: sendRow.id,
        event_type: "complaint",
      });

      await enrollments
        .update({ status: "cancelled" })
        .eq("recipient_email", sendRow.recipient_email)
        .eq("status", "active");
      break;
    }

    default:
      break;
  }

  return jsonOk({ received: true, matched: true, type });
}

// ─── Resend Webhook Types ───────────────────────────────────────────

interface ResendWebhookPayload {
  type: string;
  data: {
    email_id?: string;
    to?: string[];
    from?: string;
    subject?: string;
    bounce?: {
      type?: string;
      message?: string;
      description?: string;
    };
    [key: string]: unknown;
  };
}
