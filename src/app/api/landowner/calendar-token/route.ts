import { jsonError, jsonOk, requireAuth } from "@/lib/api/helpers";
import { createUntypedAdmin } from "@/lib/supabase/untyped";

/**
 * GET: Get or create an aggregate calendar token for the authenticated landowner.
 * The feed includes bookings across ALL properties owned by this user.
 */
export async function GET() {
  try {
    const auth = await requireAuth();
    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;
    const db = createUntypedAdmin();

    // Get existing token or create one
    let { data: tokenRecord } = await db
      .from("landowner_calendar_tokens")
      .select("token")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!tokenRecord) {
      const { data: newToken, error } = await db
        .from("landowner_calendar_tokens")
        .insert({ user_id: user.id })
        .select("token")
        .single();

      if (error) {
        console.error("[landowner/calendar-token] Insert error:", error);
        return jsonError("Failed to create calendar token", 500);
      }
      tokenRecord = newToken;
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://anglerpass.com";
    const feedUrl = `${siteUrl}/api/landowner/calendar.ics?token=${tokenRecord!.token}`;

    return jsonOk({ token: tokenRecord!.token, feed_url: feedUrl });
  } catch (err) {
    console.error("[landowner/calendar-token] Error:", err);
    return jsonError("Internal server error", 500);
  }
}

/**
 * DELETE: Regenerate the landowner calendar token (invalidates old subscriptions).
 */
export async function DELETE() {
  try {
    const auth = await requireAuth();
    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;
    const db = createUntypedAdmin();

    await db
      .from("landowner_calendar_tokens")
      .delete()
      .eq("user_id", user.id);

    const { data: newToken, error } = await db
      .from("landowner_calendar_tokens")
      .insert({ user_id: user.id })
      .select("token")
      .single();

    if (error) {
      console.error("[landowner/calendar-token] Regenerate error:", error);
      return jsonError("Failed to regenerate token", 500);
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://anglerpass.com";
    const feedUrl = `${siteUrl}/api/landowner/calendar.ics?token=${newToken!.token}`;

    return jsonOk({ token: newToken!.token, feed_url: feedUrl });
  } catch (err) {
    console.error("[landowner/calendar-token] Error:", err);
    return jsonError("Internal server error", 500);
  }
}
