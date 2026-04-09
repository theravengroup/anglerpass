import "server-only";

import { requireAdmin, jsonOk, jsonError, jsonCreated } from "@/lib/api/helpers";
import { crmTable } from "@/lib/crm/admin-queries";
import { z } from "zod";

// ─── GET /api/admin/crm/topics ────────────────────────────────────
// List all subscription topics

export async function GET() {
  const auth = await requireAdmin();
  if (!auth) return jsonError("Unauthorized", 401);

  const { data: topics } = await crmTable(auth.admin, "crm_subscription_topics")
    .select("*")
    .order("display_order", { ascending: true });

  return jsonOk({ topics: topics ?? [] });
}

// ─── POST /api/admin/crm/topics ───────────────────────────────────
// Create a new subscription topic

const createTopicSchema = z.object({
  slug: z.string().min(1).max(50).regex(/^[a-z0-9_]+$/),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  is_default: z.boolean().optional(),
  is_required: z.boolean().optional(),
  display_order: z.number().int().min(0).optional(),
});

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth) return jsonError("Unauthorized", 401);

  const body = await req.json();
  const result = createTopicSchema.safeParse(body);
  if (!result.success) {
    return jsonError(result.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const { data: topic, error } = await crmTable(auth.admin, "crm_subscription_topics")
    .insert(result.data as Record<string, unknown>)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return jsonError("A topic with that slug already exists", 409);
    }
    return jsonError("Failed to create topic", 500);
  }

  return jsonCreated({ topic });
}
