import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/clubos/track/open/[recipientId] — Tracking pixel endpoint
 *
 * Records an email open event and returns a 1x1 transparent GIF.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ recipientId: string }> }
) {
  const { recipientId } = await params;

  // Fire and forget — don't block the pixel response
  const admin = createAdminClient();

  // Fetch current recipient, then update status and increment open_count
  Promise.resolve(
    admin
      .from("club_campaign_recipients")
      .select("id, status, open_count")
      .eq("id", recipientId)
      .in("status", ["delivered", "opened", "clicked"])
      .single()
  )
    .then(({ data }) => {
      if (!data) return;
      const newCount = (data.open_count ?? 0) + 1;
      const updates: { open_count: number; opened_at?: string; status?: string } = {
        open_count: newCount,
      };
      // Only set status/opened_at on first open (delivered → opened)
      if (data.status === "delivered") {
        updates.status = "opened";
        updates.opened_at = new Date().toISOString();
      }
      return admin
        .from("club_campaign_recipients")
        .update(updates)
        .eq("id", recipientId);
    })
    .catch((err: unknown) => {
      console.error("[clubos/track/open] Error:", err);
    });

  // Return 1x1 transparent GIF
  const gif = Buffer.from(
    "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    "base64"
  );

  return new Response(gif, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
