import "server-only";

import { requireAdmin, jsonOk, jsonError } from "@/lib/api/helpers";
import { updateTopicSchema } from "@/lib/validations/crm";

// ─── PATCH /api/admin/crm/topics/[id] ─────────────────────────────

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth) return jsonError("Unauthorized", 401);

  const { id } = await params;
  const body = await req.json();
  const result = updateTopicSchema.safeParse(body);
  if (!result.success) {
    return jsonError(result.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const updates = {
    ...result.data,
    updated_at: new Date().toISOString(),
  } as Record<string, unknown>;

  const { data: topic, error } = await auth.admin.from("crm_subscription_topics")
    .update(updates)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error || !topic) {
    return jsonError("Topic not found", 404);
  }

  return jsonOk({ topic });
}

// ─── DELETE /api/admin/crm/topics/[id] ────────────────────────────

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth) return jsonError("Unauthorized", 401);

  const { id } = await params;

  // Check if any campaigns use this topic
  const { count } = await auth.admin.from("campaigns")
    .select("id", { count: "exact", head: true })
    .eq("topic_id", id);

  if ((count ?? 0) > 0) {
    return jsonError(
      "Cannot delete topic — it is assigned to active campaigns",
      409
    );
  }

  // Delete user subscriptions first, then the topic
  await auth.admin.from("crm_user_topic_subscriptions")
    .delete()
    .eq("topic_id", id);

  const { error } = await auth.admin.from("crm_subscription_topics")
    .delete()
    .eq("id", id);

  if (error) {
    return jsonError("Failed to delete topic", 500);
  }

  return jsonOk({ deleted: true });
}
