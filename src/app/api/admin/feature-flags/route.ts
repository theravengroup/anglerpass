import { NextRequest } from "next/server";
import { jsonOk, jsonError, requireAdmin } from "@/lib/api/helpers";
import { invalidateFeatureFlagCache, type FeatureFlagKey } from "@/lib/feature-flags";

/**
 * GET /api/admin/feature-flags
 * Lists every flag — used by the admin kill-switch dashboard.
 */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth) return jsonError("Forbidden", 403);

  const { data, error } = await auth.admin
    .from("feature_flags")
    .select("key, enabled, description, updated_at, updated_by")
    .order("key", { ascending: true });

  if (error) {
    console.error("[admin/feature-flags] list error:", error);
    return jsonError("Failed to load flags", 500);
  }

  return jsonOk({ flags: data ?? [] });
}

/**
 * PATCH /api/admin/feature-flags
 * Body: { key: string, enabled: boolean }
 *
 * Flips a single flag. Audit-logged. Cache is busted so the flipper's
 * own subsequent requests see the change without waiting for TTL.
 */
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth) return jsonError("Forbidden", 403);

  let body: { key?: string; enabled?: boolean };
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const { key, enabled } = body;
  if (typeof key !== "string" || typeof enabled !== "boolean") {
    return jsonError("Expected { key: string, enabled: boolean }", 400);
  }

  const { data: updated, error } = await auth.admin
    .from("feature_flags")
    .update({
      enabled,
      updated_at: new Date().toISOString(),
      updated_by: auth.user.id,
    })
    .eq("key", key)
    .select("key, enabled, description, updated_at, updated_by")
    .maybeSingle();

  if (error) {
    console.error("[admin/feature-flags] update error:", error);
    return jsonError("Failed to update flag", 500);
  }
  if (!updated) {
    return jsonError("Unknown flag key", 404);
  }

  invalidateFeatureFlagCache(key as FeatureFlagKey);

  // Audit log — a flipped kill switch is a postmortem-relevant event.
  await auth.admin.from("audit_log").insert({
    action: enabled ? "feature_flag.enabled" : "feature_flag.disabled",
    entity_type: "feature_flag",
    entity_id: key,
    actor_id: auth.user.id,
    new_data: { enabled },
  });

  return jsonOk({ flag: updated });
}
