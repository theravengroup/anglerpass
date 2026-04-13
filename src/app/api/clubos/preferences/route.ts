import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError, requireAuth } from "@/lib/api/helpers";
import { updateCommPreferencesSchema } from "@/lib/validations/clubos-communications";

/**
 * GET /api/clubos/preferences?membership_id=...&club_id=...
 *
 * Returns the member's communication preferences for a club.
 * Missing row = all defaults enabled.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth) return jsonError("Unauthorized", 401);

    const membershipId = req.nextUrl.searchParams.get("membership_id");
    const clubId = req.nextUrl.searchParams.get("club_id");

    if (!membershipId || !clubId) {
      return jsonError("membership_id and club_id are required", 400);
    }

    const admin = createAdminClient();

    // Verify the membership belongs to the authenticated user
    const { data: membership } = await admin
      .from("club_memberships")
      .select("id, user_id")
      .eq("id", membershipId)
      .eq("club_id", clubId)
      .single();

    if (!membership || membership.user_id !== auth.user.id) {
      return jsonError("Forbidden", 403);
    }

    const { data: prefs } = await admin
      .from("club_communication_preferences")
      .select("*")
      .eq("membership_id", membershipId)
      .maybeSingle();

    // Return defaults if no row exists
    return jsonOk({
      preferences: prefs ?? {
        membership_id: membershipId,
        club_id: clubId,
        email_broadcasts: true,
        email_targeted: true,
        email_digest: true,
        email_event_notices: true,
      },
    });
  } catch (err) {
    console.error("[clubos/preferences] GET error:", err);
    return jsonError("Internal server error", 500);
  }
}

/**
 * PUT /api/clubos/preferences — Update communication preferences
 */
export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth) return jsonError("Unauthorized", 401);

    const body = await req.json();
    const { membership_id, club_id, ...prefsData } = body;

    if (!membership_id || !club_id) {
      return jsonError("membership_id and club_id are required", 400);
    }

    const admin = createAdminClient();

    // Verify membership belongs to auth user
    const { data: membership } = await admin
      .from("club_memberships")
      .select("id, user_id")
      .eq("id", membership_id)
      .eq("club_id", club_id)
      .single();

    if (!membership || membership.user_id !== auth.user.id) {
      return jsonError("Forbidden", 403);
    }

    const parsed = updateCommPreferencesSchema.safeParse(prefsData);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0].message, 400);
    }

    // Upsert preferences
    const { data: prefs, error } = await admin
      .from("club_communication_preferences")
      .upsert(
        {
          membership_id,
          club_id,
          ...parsed.data,
        },
        { onConflict: "membership_id" }
      )
      .select()
      .single();

    if (error) {
      console.error("[clubos/preferences] Upsert failed:", error);
      return jsonError("Failed to update preferences", 500);
    }

    return jsonOk({ preferences: prefs });
  } catch (err) {
    console.error("[clubos/preferences] PUT error:", err);
    return jsonError("Internal server error", 500);
  }
}
