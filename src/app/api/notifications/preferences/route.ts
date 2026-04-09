import { jsonError, jsonOk, requireAuth} from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";

const VALID_PREFS = [
  "email_booking_requested",
  "email_booking_confirmed",
  "email_booking_declined",
  "email_booking_cancelled",
  "email_member_invited",
  "email_member_approved",
  "email_property_access",
] as const;

// GET: Get current user's notification preferences
export async function GET() {
  try {
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

    const admin = createAdminClient();

    const { data: prefs } = await admin
      .from("notification_preferences")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    // Return defaults if no row exists
    if (!prefs) {
      const defaults: Record<string, boolean> = {};
      for (const key of VALID_PREFS) {
        defaults[key] = true;
      }
      return jsonOk({ preferences: defaults });
    }

    return jsonOk({ preferences: prefs });
  } catch (err) {
    console.error("[notification-preferences] Error:", err);
    return jsonError("Internal server error", 500);
  }
}

// PATCH: Update notification preferences
export async function PATCH(request: Request) {
  try {
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

    const body = await request.json();

    // Validate only known preference keys
    const updates: Record<string, boolean> = {};
    for (const key of VALID_PREFS) {
      if (key in body && typeof body[key] === "boolean") {
        updates[key] = body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return jsonError("No valid preferences provided", 400);
    }

    const admin = createAdminClient();

    // Upsert preferences
    const { data: existing } = await admin
      .from("notification_preferences")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      const { error } = await admin
        .from("notification_preferences")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);

      if (error) {
        console.error("[notification-preferences] Update error:", error);
        return jsonError("Failed to update preferences", 500);
      }
    } else {
      const { error } = await admin
        .from("notification_preferences")
        .insert({ user_id: user.id, ...updates });

      if (error) {
        console.error("[notification-preferences] Insert error:", error);
        return jsonError("Failed to save preferences", 500);
      }
    }

    return jsonOk({ success: true });
  } catch (err) {
    console.error("[notification-preferences] Error:", err);
    return jsonError("Internal server error", 500);
  }
}
