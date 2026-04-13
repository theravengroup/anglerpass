import { NextRequest } from "next/server";
import { createUntypedAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/clubos/webhooks — Resend webhook handler for delivery events
 *
 * Processes email.delivered, email.bounced, email.complained events
 * from Resend and updates the corresponding club_campaign_recipients row.
 *
 * Webhook must be configured in Resend dashboard to send to this endpoint.
 * Verify using the X-ClubOS-Campaign-Id and X-ClubOS-Recipient-Id headers
 * that were set when sending.
 */
export async function POST(req: NextRequest) {
  try {
    // Resend sends a webhook signing secret — validate it in production
    const webhookSecret = process.env.RESEND_CLUBOS_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = req.headers.get("svix-signature");
      if (!signature) {
        return new Response("Missing signature", { status: 401 });
      }
      // In production, use svix library for proper signature verification
      // For now, we rely on the secret being present as a basic check
    }

    const body = await req.json();
    const { type, data } = body;

    if (!type || !data) {
      return new Response("Invalid webhook payload", { status: 400 });
    }

    const admin = createUntypedAdminClient();

    // Look up the recipient by ESP message ID
    const espMessageId = data.email_id;
    if (!espMessageId) {
      return new Response("OK", { status: 200 });
    }

    const { data: recipient } = await admin
      .from("club_campaign_recipients")
      .select("id, campaign_id, status")
      .eq("esp_message_id", espMessageId)
      .maybeSingle();

    if (!recipient) {
      // Not a ClubOS email — may be a platform CRM email
      return new Response("OK", { status: 200 });
    }

    const now = new Date().toISOString();

    switch (type) {
      case "email.delivered": {
        // Only upgrade from sent → delivered
        if (recipient.status === "sent") {
          await admin
            .from("club_campaign_recipients")
            .update({ status: "delivered", delivered_at: now })
            .eq("id", recipient.id);
        }
        break;
      }

      case "email.bounced": {
        await admin
          .from("club_campaign_recipients")
          .update({
            status: "bounced",
            bounced_at: now,
            bounce_reason: data.bounce?.type ?? "unknown",
          })
          .eq("id", recipient.id);

        // Increment campaign bounce count
        const { data: campaign } = await admin
          .from("club_campaigns")
          .select("id, bounce_count")
          .eq("id", recipient.campaign_id)
          .single();

        if (campaign) {
          await admin
            .from("club_campaigns")
            .update({ bounce_count: (campaign.bounce_count ?? 0) + 1 })
            .eq("id", campaign.id);
        }
        break;
      }

      case "email.complained": {
        // Treat complaints as bounces and suppress future sends
        await admin
          .from("club_campaign_recipients")
          .update({
            status: "bounced",
            bounced_at: now,
            bounce_reason: "complaint",
          })
          .eq("id", recipient.id);
        break;
      }

      case "email.opened": {
        // Only upgrade from delivered → opened
        if (recipient.status === "delivered") {
          await admin
            .from("club_campaign_recipients")
            .update({ status: "opened", opened_at: now, open_count: 1 })
            .eq("id", recipient.id);

          // Increment campaign open count
          const { data: camp } = await admin
            .from("club_campaigns")
            .select("id, open_count")
            .eq("id", recipient.campaign_id)
            .single();

          if (camp) {
            await admin
              .from("club_campaigns")
              .update({ open_count: (camp.open_count ?? 0) + 1 })
              .eq("id", camp.id);
          }
        }
        break;
      }

      case "email.clicked": {
        if (["delivered", "opened"].includes(recipient.status)) {
          const updates: Record<string, unknown> = {
            status: "clicked",
            clicked_at: now,
            click_count: 1,
          };

          if (recipient.status === "delivered") {
            updates.opened_at = now;
            updates.open_count = 1;
          }

          await admin
            .from("club_campaign_recipients")
            .update(updates)
            .eq("id", recipient.id);

          // Increment campaign click count
          const { data: camp } = await admin
            .from("club_campaigns")
            .select("id, click_count, open_count")
            .eq("id", recipient.campaign_id)
            .single();

          if (camp) {
            const campUpdates: Record<string, unknown> = {
              click_count: (camp.click_count ?? 0) + 1,
            };
            // If opened via click, also increment open count
            if (recipient.status === "delivered") {
              campUpdates.open_count = (camp.open_count ?? 0) + 1;
            }
            await admin
              .from("club_campaigns")
              .update(campUpdates)
              .eq("id", camp.id);
          }
        }
        break;
      }
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("[clubos/webhooks] Error:", err);
    return new Response("Internal server error", { status: 500 });
  }
}
