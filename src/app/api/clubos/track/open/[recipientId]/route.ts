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

  admin
    .from("club_campaign_recipients")
    .update({
      status: "opened",
      opened_at: new Date().toISOString(),
      open_count: undefined, // Will be incremented below
    })
    .eq("id", recipientId)
    .eq("status", "delivered")
    .then(() => {
      // Increment open_count using raw RPC or follow-up query
      return admin.rpc("increment_recipient_open_count", {
        recipient_id: recipientId,
      });
    })
    .catch((err) => {
      console.error("[clubos/track/open] Error:", err);
    });

  // Also update on already-opened recipients (increment count only)
  admin
    .from("club_campaign_recipients")
    .select("id, open_count")
    .eq("id", recipientId)
    .in("status", ["opened", "clicked"])
    .single()
    .then(({ data }) => {
      if (data) {
        return admin
          .from("club_campaign_recipients")
          .update({ open_count: (data.open_count ?? 0) + 1 })
          .eq("id", recipientId);
      }
    })
    .catch(() => {});

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
