import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { crmTable } from "@/lib/crm/admin-queries";
import { recordEngagement } from "@/lib/crm/send-time-optimizer";
import { SITE_URL } from "@/lib/constants";

/**
 * GET /api/crm/track/click/[sendId]?url=<encoded-destination>
 *
 * Click tracking redirect. Records a click event and 302-redirects
 * the user to the original destination URL.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sendId: string }> }
) {
  const { sendId } = await params;
  const destinationUrl = request.nextUrl.searchParams.get("url");

  const safeUrl = getSafeRedirectUrl(destinationUrl);

  // Fire-and-forget — don't block the redirect
  recordClick(sendId, safeUrl, request).catch((err) =>
    console.error("[crm/track/click] Error recording click:", err)
  );

  return Response.redirect(safeUrl, 302);
}

function getSafeRedirectUrl(url: string | null): string {
  if (!url) return SITE_URL;

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return SITE_URL;
    }
    return parsed.href;
  } catch {
    if (url.startsWith("/")) {
      return `${SITE_URL}${url}`;
    }
    return SITE_URL;
  }
}

async function recordClick(
  sendId: string,
  url: string,
  request: NextRequest
) {
  const admin = createAdminClient();
  const sends = crmTable(admin, "campaign_sends");
  const events = crmTable(admin, "engagement_events");

  // Validate send exists
  const { data: send } = await sends
    .select("id, click_count, clicked_at, recipient_email")
    .eq("id", sendId)
    .maybeSingle();

  if (!send) return;

  // Insert engagement event
  await events.insert({
    send_id: sendId,
    event_type: "click",
    url,
    user_agent: request.headers.get("user-agent") ?? null,
    ip_address: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
  });

  // Update send record — first click timestamp + increment count
  const updates: Record<string, unknown> = {
    click_count: ((send as Record<string, unknown>).click_count as number ?? 0) + 1,
  };
  if (!(send as Record<string, unknown>).clicked_at) {
    updates.clicked_at = new Date().toISOString();
  }

  await sends.update(updates).eq("id", sendId);

  // Record engagement window for send-time optimization
  const email = (send as Record<string, unknown>).recipient_email as string | undefined;
  if (email) {
    recordEngagement(admin, email, "click").catch(() => {});
  }
}
