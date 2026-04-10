import "server-only";

import { requireAuth, jsonOk, jsonCreated, jsonError } from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createConversationSchema } from "@/lib/validations/compass";

/**
 * GET /api/compass/conversations
 * List the current user's Compass conversations, newest first.
 */
export async function GET() {
  const auth = await requireAuth();
  if (!auth) return jsonError("Unauthorized", 401);

  const db = createAdminClient();
  const { data, error } = await db
    .from("compass_conversations")
    .select("id, title, created_at, updated_at")
    .eq("user_id", auth.user.id)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) {
    return jsonError("Failed to list conversations", 500);
  }

  return jsonOk({ conversations: data ?? [] });
}

/**
 * POST /api/compass/conversations
 * Create a new Compass conversation.
 */
export async function POST(request: Request) {
  const auth = await requireAuth();
  if (!auth) return jsonError("Unauthorized", 401);

  const body = await request.json();
  const parsed = createConversationSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Invalid request body", 400);
  }

  const { title, messages } = parsed.data;

  const db = createAdminClient();
  const { data, error } = await db
    .from("compass_conversations")
    .insert({
      user_id: auth.user.id,
      title: title ?? null,
      messages: JSON.parse(JSON.stringify(messages)),
    })
    .select("id, title, created_at, updated_at")
    .single();

  if (error) {
    return jsonError("Failed to create conversation", 500);
  }

  return jsonCreated({ conversation: data });
}
