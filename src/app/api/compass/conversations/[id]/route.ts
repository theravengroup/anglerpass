import "server-only";

import { z } from "zod";
import { requireAuth, jsonOk, jsonError } from "@/lib/api/helpers";
import { createCompassAdminClient } from "@/lib/supabase/compass-admin";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/compass/conversations/:id
 * Load a specific conversation with its messages.
 */
export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireAuth();
  if (!auth) return jsonError("Unauthorized", 401);

  const { id } = await params;

  const db = createCompassAdminClient();
  const { data, error } = await db
    .from("compass_conversations")
    .select("id, title, messages, created_at, updated_at")
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (error) {
    return jsonError("Failed to load conversation", 500);
  }

  if (!data) {
    return jsonError("Conversation not found", 404);
  }

  return jsonOk({ conversation: data });
}

const updateSchema = z.object({
  title: z.string().max(200).optional(),
  messages: z.array(z.record(z.string(), z.unknown())).optional(),
});

/**
 * PATCH /api/compass/conversations/:id
 * Update a conversation's title or messages.
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireAuth();
  if (!auth) return jsonError("Unauthorized", 401);

  const { id } = await params;

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Invalid request body", 400);
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (parsed.data.title !== undefined) {
    updates.title = parsed.data.title;
  }

  if (parsed.data.messages !== undefined) {
    updates.messages = JSON.parse(JSON.stringify(parsed.data.messages));
  }

  const db = createCompassAdminClient();

  // Verify ownership
  const { data: existing } = await db
    .from("compass_conversations")
    .select("id")
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (!existing) {
    return jsonError("Conversation not found", 404);
  }

  const { data, error } = await db
    .from("compass_conversations")
    .update(updates)
    .eq("id", id)
    .select("id, title, updated_at")
    .single();

  if (error) {
    return jsonError("Failed to update conversation", 500);
  }

  return jsonOk({ conversation: data });
}
