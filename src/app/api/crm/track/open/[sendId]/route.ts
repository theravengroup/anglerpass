import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordEngagement } from "@/lib/crm/send-time-optimizer";

/** 1x1 transparent GIF (43 bytes) */
const TRACKING_PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

/**
 * GET /api/crm/track/open/[sendId]
 *
 * Tracking pixel endpoint. Records an email open event and returns
 * a 1x1 transparent GIF.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sendId: string }> }
) {
  const { sendId } = await params;

  // Fire-and-forget — don't block the pixel response
  recordOpen(sendId, request).catch((err) =>
    console.error("[crm/track/open] Error recording open:", err)
  );

  return new Response(TRACKING_PIXEL, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Content-Length": String(TRACKING_PIXEL.length),
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

async function recordOpen(sendId: string, request: NextRequest) {
  const admin = createAdminClient();
  const sends = admin.from("campaign_sends");
  const events = admin.from("engagement_events");

  // Validate send exists
  const { data: send } = await sends
    .select("id, open_count, opened_at, recipient_email")
    .eq("id", sendId)
    .maybeSingle();

  if (!send) return;

  // Insert engagement event
  await events.insert({
    send_id: sendId,
    event_type: "open",
    user_agent: request.headers.get("user-agent") ?? null,
    ip_address: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
  });

  // Update send record — first open timestamp + increment count
  const updates: Record<string, unknown> = {
    open_count: ((send as Record<string, unknown>).open_count as number ?? 0) + 1,
  };
  if (!(send as Record<string, unknown>).opened_at) {
    updates.opened_at = new Date().toISOString();
  }

  await sends.update(updates).eq("id", sendId);

  // Record engagement window for send-time optimization
  const email = (send as Record<string, unknown>).recipient_email as string | undefined;
  if (email) {
    recordEngagement(admin, email, "open").catch(() => {});
  }
}
