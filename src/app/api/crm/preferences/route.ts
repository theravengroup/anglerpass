import "server-only";

import { NextRequest } from "next/server";
import { jsonOk, jsonError, requireAuth } from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

// ─── GET /api/crm/preferences ─────────────────────────────────────
// Returns the current user's topic subscription preferences.
// For each topic, returns whether they're subscribed (explicit or default).

export async function GET() {
  const auth = await requireAuth();
  if (!auth) return jsonError("Unauthorized", 401);

  const admin = createAdminClient();

  // Get all non-hidden topics
  const { data: topics } = await admin.from("crm_subscription_topics")
    .select("id, slug, name, description, is_default, is_required, display_order")
    .order("display_order", { ascending: true });

  if (!topics) return jsonOk({ preferences: [] });

  // Get user's explicit subscriptions
  const { data: subs } = await admin.from("crm_user_topic_subscriptions")
    .select("topic_id, subscribed")
    .eq("user_id", auth.user.id);

  const subMap = new Map(
    (subs ?? []).map((s) => [s.topic_id, s.subscribed])
  );

  const preferences = (topics ?? []).map((topic) => {
    const explicitSub = subMap.get(topic.id);
    return {
      topic_id: topic.id,
      slug: topic.slug,
      name: topic.name,
      description: topic.description,
      is_required: topic.is_required,
      subscribed:
        topic.is_required === true
          ? true
          : explicitSub !== undefined
            ? explicitSub === true
            : topic.is_default === true,
    };
  });

  return jsonOk({ preferences });
}

// ─── PATCH /api/crm/preferences ───────────────────────────────────
// Update topic subscription preferences.
// Body: { subscriptions: [{ topic_id, subscribed }] }

const updatePrefsSchema = z.object({
  subscriptions: z.array(
    z.object({
      topic_id: z.string().uuid(),
      subscribed: z.boolean(),
    })
  ),
});

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return jsonError("Unauthorized", 401);

  const body = await req.json();
  const result = updatePrefsSchema.safeParse(body);
  if (!result.success) {
    return jsonError(result.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const admin = createAdminClient();

  // Verify topics exist and skip required topics
  const { data: allTopics } = await admin.from("crm_subscription_topics")
    .select("id, is_required");

  const topicMap = new Map(
    (allTopics ?? []).map((t) => [t.id, t])
  );

  const upserts: {
    user_id: string;
    topic_id: string;
    subscribed: boolean;
    updated_at: string;
  }[] = [];

  for (const sub of result.data.subscriptions) {
    const topic = topicMap.get(sub.topic_id);
    if (!topic) continue;
    // Can't unsubscribe from required topics
    if (topic.is_required === true && !sub.subscribed) continue;

    upserts.push({
      user_id: auth.user.id,
      topic_id: sub.topic_id,
      subscribed: sub.subscribed,
      updated_at: new Date().toISOString(),
    });
  }

  if (upserts.length > 0) {
    await admin.from("crm_user_topic_subscriptions")
      .upsert(upserts, { onConflict: "user_id,topic_id" });
  }

  return jsonOk({ updated: upserts.length });
}
