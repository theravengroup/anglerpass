import { jsonError, jsonOk, requireAuth} from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";

// GET: Get or create calendar token for a property
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

    const admin = createAdminClient();

    // Verify ownership
    const { data: property } = await admin
      .from("properties")
      .select("owner_id")
      .eq("id", id)
      .maybeSingle();

    if (!property || property.owner_id !== user.id) {
      return jsonError("Forbidden", 403);
    }

    // Get existing token or create one
    let { data: tokenRecord } = await admin
      .from("calendar_tokens")
      .select("token")
      .eq("property_id", id)
      .maybeSingle();

    if (!tokenRecord) {
      const { data: newToken, error } = await admin
        .from("calendar_tokens")
        .insert({ property_id: id })
        .select("token")
        .single();

      if (error) {
        console.error("[calendar-token] Insert error:", error);
        return jsonError("Failed to create calendar token", 500);
      }

      tokenRecord = newToken;
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://anglerpass.com";
    const feedUrl = `${siteUrl}/api/properties/${id}/calendar.ics?token=${tokenRecord!.token}`;

    return jsonOk({ token: tokenRecord!.token, feed_url: feedUrl });
  } catch (err) {
    console.error("[calendar-token] Error:", err);
    return jsonError("Internal server error", 500);
  }
}

// DELETE: Regenerate calendar token (invalidates old subscriptions)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

    const admin = createAdminClient();

    // Verify ownership
    const { data: property } = await admin
      .from("properties")
      .select("owner_id")
      .eq("id", id)
      .maybeSingle();

    if (!property || property.owner_id !== user.id) {
      return jsonError("Forbidden", 403);
    }

    // Delete existing token
    await admin
      .from("calendar_tokens")
      .delete()
      .eq("property_id", id);

    // Create new one
    const { data: newToken, error } = await admin
      .from("calendar_tokens")
      .insert({ property_id: id })
      .select("token")
      .single();

    if (error) {
      console.error("[calendar-token] Regenerate error:", error);
      return jsonError("Failed to regenerate token", 500);
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://anglerpass.com";
    const feedUrl = `${siteUrl}/api/properties/${id}/calendar.ics?token=${newToken!.token}`;

    return jsonOk({ token: newToken!.token, feed_url: feedUrl });
  } catch (err) {
    console.error("[calendar-token] Error:", err);
    return jsonError("Internal server error", 500);
  }
}
