import { jsonError, jsonOk, requireAuth } from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createUntypedAdmin } from "@/lib/supabase/untyped";

/**
 * GET: Get or create a calendar token for the authenticated user's club.
 * The feed includes bookings across all club-associated properties.
 */
export async function GET() {
  try {
    const auth = await requireAuth();
    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;
    const admin = createAdminClient();
    const db = createUntypedAdmin();

    // Resolve the user's club (must be club_admin or staff)
    const { data: membership } = await admin
      .from("club_memberships")
      .select("club_id")
      .eq("user_id", user.id)
      .in("role", ["admin", "staff"])
      .maybeSingle();

    if (!membership) return jsonError("No club found", 404);

    const clubId = membership.club_id;

    // Get existing token or create one
    let { data: tokenRecord } = await db
      .from("club_calendar_tokens")
      .select("token")
      .eq("club_id", clubId)
      .maybeSingle();

    if (!tokenRecord) {
      const { data: newToken, error } = await db
        .from("club_calendar_tokens")
        .insert({ club_id: clubId })
        .select("token")
        .single();

      if (error) {
        console.error("[clubs/calendar-token] Insert error:", error);
        return jsonError("Failed to create calendar token", 500);
      }
      tokenRecord = newToken;
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://anglerpass.com";
    const feedUrl = `${siteUrl}/api/clubs/calendar.ics?token=${tokenRecord!.token}`;

    return jsonOk({ token: tokenRecord!.token, feed_url: feedUrl });
  } catch (err) {
    console.error("[clubs/calendar-token] Error:", err);
    return jsonError("Internal server error", 500);
  }
}

/**
 * DELETE: Regenerate the club calendar token (invalidates old subscriptions).
 */
export async function DELETE() {
  try {
    const auth = await requireAuth();
    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;
    const admin = createAdminClient();
    const db = createUntypedAdmin();

    const { data: membership } = await admin
      .from("club_memberships")
      .select("club_id")
      .eq("user_id", user.id)
      .in("role", ["admin", "staff"])
      .maybeSingle();

    if (!membership) return jsonError("No club found", 404);

    const clubId = membership.club_id;

    await db
      .from("club_calendar_tokens")
      .delete()
      .eq("club_id", clubId);

    const { data: newToken, error } = await db
      .from("club_calendar_tokens")
      .insert({ club_id: clubId })
      .select("token")
      .single();

    if (error) {
      console.error("[clubs/calendar-token] Regenerate error:", error);
      return jsonError("Failed to regenerate token", 500);
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://anglerpass.com";
    const feedUrl = `${siteUrl}/api/clubs/calendar.ics?token=${newToken!.token}`;

    return jsonOk({ token: newToken!.token, feed_url: feedUrl });
  } catch (err) {
    console.error("[clubs/calendar-token] Error:", err);
    return jsonError("Internal server error", 500);
  }
}
