/**
 * In-app notification system — creates and manages notifications
 * that appear in the user's notification center.
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { renderTemplate, buildTemplateData } from "@/lib/crm/template-engine";
import type { RecipientContext } from "@/lib/crm/template-engine";
import type { NotificationCategory } from "@/lib/crm/types";

export interface CreateNotificationOptions {
  userId: string;
  title: string;
  body?: string;
  actionUrl?: string;
  category?: NotificationCategory;
  sourceType?: "system" | "workflow" | "campaign" | "manual";
  sourceId?: string;
  templateContext?: RecipientContext;
  templateExtras?: Record<string, unknown>;
}

/**
 * Create an in-app notification for a user. Title and body are
 * rendered through the template engine if a templateContext is provided.
 */
export async function createNotification(
  admin: SupabaseClient,
  opts: CreateNotificationOptions
): Promise<string> {
  let title = opts.title;
  let body = opts.body ?? null;

  // Render templates if context provided
  if (opts.templateContext) {
    const data = buildTemplateData(opts.templateContext, opts.templateExtras);
    title = renderTemplate(title, data);
    if (body) {
      body = renderTemplate(body, data);
    }
  }

  const id = crypto.randomUUID();

  await admin.from("crm_notifications").insert({
    id,
    user_id: opts.userId,
    title,
    body,
    action_url: opts.actionUrl ?? null,
    category: opts.category ?? "general",
    source_type: opts.sourceType ?? "system",
    source_id: opts.sourceId ?? null,
  });

  return id;
}

/**
 * Get notifications for a user with pagination.
 */
export async function getUserNotifications(
  admin: SupabaseClient,
  userId: string,
  opts: { limit?: number; offset?: number; unreadOnly?: boolean } = {}
): Promise<{
  notifications: Array<{
    id: string;
    title: string;
    body: string | null;
    action_url: string | null;
    category: string;
    is_read: boolean;
    created_at: string;
  }>;
  unread_count: number;
}> {
  const limit = opts.limit ?? 20;
  const offset = opts.offset ?? 0;

  let query = admin.from("crm_notifications")
    .select("id, title, body, action_url, category, is_read, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (opts.unreadOnly) {
    query = query.eq("is_read", false);
  }

  const [{ data }, { count }] = await Promise.all([
    query.returns<Array<{
      id: string;
      title: string;
      body: string | null;
      action_url: string | null;
      category: string;
      is_read: boolean;
      created_at: string;
    }>>(),
    admin.from("crm_notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false),
  ]);

  return {
    notifications: data ?? [],
    unread_count: count ?? 0,
  };
}

/**
 * Mark specific notifications as read.
 */
export async function markNotificationsRead(
  admin: SupabaseClient,
  userId: string,
  notificationIds: string[]
): Promise<void> {
  await admin.from("crm_notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .in("id", notificationIds);
}

/**
 * Mark all notifications as read for a user.
 */
export async function markAllNotificationsRead(
  admin: SupabaseClient,
  userId: string
): Promise<void> {
  await admin.from("crm_notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("is_read", false);
}
