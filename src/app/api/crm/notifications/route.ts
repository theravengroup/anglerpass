import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { jsonOk, jsonError } from "@/lib/api/helpers";
import {
  getUserNotifications,
  markNotificationsRead,
  markAllNotificationsRead,
} from "@/lib/crm/notifications";

/**
 * GET /api/crm/notifications
 *
 * List CRM/marketing notifications for the authenticated user.
 * Query params: limit, offset, unread_only
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return jsonError("Unauthorized", 401);

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? "20");
  const offset = Number(url.searchParams.get("offset") ?? "0");
  const unreadOnly = url.searchParams.get("unread_only") === "true";

  const admin = createAdminClient();
  const result = await getUserNotifications(admin, user.id, {
    limit,
    offset,
    unreadOnly,
  });

  return jsonOk(result);
}

/**
 * PATCH /api/crm/notifications
 *
 * Mark CRM notifications as read.
 * Body: { ids: string[] } or { all: true }
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return jsonError("Unauthorized", 401);

  const body = await request.json();
  const admin = createAdminClient();

  if (body.all === true) {
    await markAllNotificationsRead(admin, user.id);
  } else if (Array.isArray(body.ids) && body.ids.length > 0) {
    await markNotificationsRead(admin, user.id, body.ids);
  } else {
    return jsonError("Provide ids array or all: true", 400);
  }

  return jsonOk({ success: true });
}
