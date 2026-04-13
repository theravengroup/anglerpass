import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/clubos/track/click/[recipientId]?url=... — Click tracking redirect
 *
 * Records a click event and redirects to the original URL.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ recipientId: string }> }
) {
  const { recipientId } = await params;
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return new Response("Missing URL", { status: 400 });
  }

  // Fire and forget — record the click asynchronously
  const admin = createAdminClient();

  admin
    .from("club_campaign_recipients")
    .select("id, click_count, status")
    .eq("id", recipientId)
    .single()
    .then(({ data }) => {
      if (data) {
        const updates: Record<string, unknown> = {
          click_count: (data.click_count ?? 0) + 1,
        };

        // Upgrade status if not already clicked
        if (data.status !== "clicked") {
          updates.status = "clicked";
          updates.clicked_at = new Date().toISOString();
        }

        // Also mark as opened if somehow missed
        if (!["opened", "clicked"].includes(data.status)) {
          updates.opened_at = new Date().toISOString();
          updates.open_count = 1;
        }

        return admin
          .from("club_campaign_recipients")
          .update(updates)
          .eq("id", recipientId);
      }
    })
    .catch((err) => {
      console.error("[clubos/track/click] Error:", err);
    });

  // Redirect to original URL
  return Response.redirect(url, 302);
}
