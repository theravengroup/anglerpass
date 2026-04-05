import { jsonError, jsonOk } from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { markReadSchema } from "@/lib/validations/notifications";

// GET: List notifications for the current user
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return jsonError("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unread") === "true";
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 100) : 50;

    const admin = createAdminClient();

    let query = admin
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq("read", false);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error("[notifications] Fetch error:", error);
      return jsonError("Failed to fetch notifications", 500);
    }

    // Also return unread count
    const { count } = await admin
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false);

    return jsonOk({
      notifications: notifications ?? [],
      unread_count: count ?? 0,
    });
  } catch (err) {
    console.error("[notifications] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}

// PATCH: Mark notifications as read
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return jsonError("Unauthorized", 401);
    }

    const body = await request.json();
    const parsed = markReadSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
    }

    const admin = createAdminClient();

    // Mark all as read
    if (parsed.data.mark_all_read) {
      const { error } = await admin
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);

      if (error) {
        console.error("[notifications] Mark all read error:", error);
        return jsonError("Failed to update notifications", 500);
      }

      return jsonOk({ success: true });
    }

    // Mark specific notification(s) as read
    const ids: string[] = parsed.data.ids ?? (parsed.data.id ? [parsed.data.id] : []);

    const { error } = await admin
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .in("id", ids);

    if (error) {
      console.error("[notifications] Mark read error:", error);
      return jsonError("Failed to update notifications", 500);
    }

    return jsonOk({ success: true });
  } catch (err) {
    console.error("[notifications] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}
