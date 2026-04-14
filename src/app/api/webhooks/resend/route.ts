import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError } from "@/lib/api/helpers";
import { requireEnabled } from "@/lib/feature-flags";

/**
 * POST /api/webhooks/resend
 *
 * Resend webhook handler for email delivery events.
 * Processes: delivered, bounced, complained.
 * Updates campaign_sends and manages the suppression list.
 */
export async function POST(request: NextRequest) {
  const killed = await requireEnabled("webhooks.resend");
  if (killed) return killed;

  const rawBody = await request.text();

  // Verify Svix webhook signature.
  // Resend uses Svix: signed payload is `${svix_id}.${svix_timestamp}.${rawBody}`,
  // HMAC-SHA256 with the secret's base64 body (after the `whsec_` prefix).
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  if (webhookSecret) {
    const svixId = request.headers.get("svix-id");
    const svixTimestamp = request.headers.get("svix-timestamp");
    const svixSignature = request.headers.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      return jsonError("Missing webhook signature", 401);
    }

    // Reject stale timestamps (>5 minutes drift) to prevent replay.
    const ts = parseInt(svixTimestamp, 10);
    if (!Number.isFinite(ts)) return jsonError("Invalid timestamp", 401);
    const nowSec = Math.floor(Date.now() / 1000);
    if (Math.abs(nowSec - ts) > 300) {
      return jsonError("Stale webhook signature", 401);
    }

    const secretBase64 = webhookSecret.startsWith("whsec_")
      ? webhookSecret.slice("whsec_".length)
      : webhookSecret;

    let expected: string;
    try {
      const { createHmac } = await import("crypto");
      const keyBytes = Buffer.from(secretBase64, "base64");
      const signedPayload = `${svixId}.${svixTimestamp}.${rawBody}`;
      expected = createHmac("sha256", keyBytes)
        .update(signedPayload)
        .digest("base64");
    } catch {
      return jsonError("Signature verification failed", 401);
    }

    // svix-signature is a space-separated list of `v1,<base64sig>` entries.
    const provided = svixSignature
      .split(" ")
      .map((part) => part.split(",")[1])
      .filter((v): v is string => Boolean(v));

    const match = provided.some((sig) => {
      if (sig.length !== expected.length) return false;
      let result = 0;
      for (let i = 0; i < expected.length; i++) {
        result |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
      }
      return result === 0;
    });

    if (!match) {
      return jsonError("Invalid webhook signature", 401);
    }
  }

  let payload: ResendWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as ResendWebhookPayload;
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const { type, data } = payload;
  if (!type || !data) {
    return jsonError("Missing type or data", 400);
  }

  const admin = createAdminClient();
  const sends = admin.from("campaign_sends");
  const events = admin.from("engagement_events");
  const suppressions = admin.from("email_suppression_list");
  const enrollments = admin.from("campaign_enrollments");

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

  switch (type) {
    case "email.delivered": {
      await sends
        .update({
          status: "delivered",
          delivered_at: new Date().toISOString(),
        })
        .eq("id", send.id);
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
        .eq("id", send.id);

      await events.insert({
        send_id: send.id,
        event_type: "bounce",
      });

      // Hard bounce → suppression list
      if (data.bounce?.type === "hard") {
        await suppressions.upsert(
          {
            email: send.recipient_email.toLowerCase(),
            reason: "hard_bounce",
            source: "resend_webhook",
          },
          { onConflict: "email" }
        );

        await enrollments
          .update({ status: "cancelled" })
          .eq("recipient_email", send.recipient_email)
          .eq("status", "active");
      }
      break;
    }

    case "email.complained": {
      await suppressions.upsert(
        {
          email: send.recipient_email.toLowerCase(),
          reason: "complaint",
          source: "resend_webhook",
        },
        { onConflict: "email" }
      );

      await events.insert({
        send_id: send.id,
        event_type: "complaint",
      });

      await enrollments
        .update({ status: "cancelled" })
        .eq("recipient_email", send.recipient_email)
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
