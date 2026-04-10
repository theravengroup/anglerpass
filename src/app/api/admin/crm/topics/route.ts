import "server-only";

import { requireAdmin, jsonOk, jsonError, jsonCreated, isDuplicateError } from "@/lib/api/helpers";
import { createTopicSchema } from "@/lib/validations/crm";

// ─── GET /api/admin/crm/topics ────────────────────────────────────
// List all subscription topics

export async function GET() {
  const auth = await requireAdmin();
  if (!auth) return jsonError("Unauthorized", 401);

  const { data: topics } = await auth.admin.from("crm_subscription_topics")
    .select("*")
    .order("display_order", { ascending: true });

  return jsonOk({ topics: topics ?? [] });
}

// ─── POST /api/admin/crm/topics ───────────────────────────────────
// Create a new subscription topic

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth) return jsonError("Unauthorized", 401);

  const body = await req.json();
  const result = createTopicSchema.safeParse(body);
  if (!result.success) {
    return jsonError(result.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const { data: topic, error } = await auth.admin.from("crm_subscription_topics")
    .insert(result.data)
    .select()
    .single();

  if (error) {
    if (isDuplicateError(error)) {
      return jsonError("A topic with that slug already exists", 409);
    }
    return jsonError("Failed to create topic", 500);
  }

  return jsonCreated({ topic });
}
