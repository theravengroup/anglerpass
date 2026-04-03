import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin, jsonError, jsonOk } from "@/lib/api/helpers";
import type { Json } from "@/types/supabase";

// ─── GET: Fetch all platform settings ──────────────────────────────

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth) return jsonError("Forbidden", 403);

    const { data, error } = await auth.admin
      .from("platform_settings")
      .select("key, value, description, updated_at");

    if (error) {
      console.error("[admin/settings] Failed to fetch settings:", error);
      return jsonError("Failed to fetch settings", 500);
    }

    // Transform array into keyed object
    const settings: Record<
      string,
      { value: unknown; description: string | null; updated_at: string | null }
    > = {};

    for (const row of data ?? []) {
      settings[row.key] = {
        value: row.value,
        description: row.description,
        updated_at: row.updated_at,
      };
    }

    return jsonOk({ settings });
  } catch (err) {
    console.error("[admin/settings] GET error:", err);
    return jsonError("Internal server error", 500);
  }
}

// ─── PATCH: Update a single platform setting ───────────────────────

const patchSchema = z.object({
  key: z.string().min(1, "Key is required"),
  value: z.unknown().refine((v) => v !== undefined, "Value is required"),
});

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth) return jsonError("Forbidden", 403);

    const body = await request.json();
    const parsed = patchSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
    }

    const { key, value } = parsed.data;

    // Fetch the current value for audit logging
    const { data: existing, error: fetchError } = await auth.admin
      .from("platform_settings")
      .select("value")
      .eq("key", key)
      .single();

    if (fetchError || !existing) {
      console.error("[admin/settings] Setting not found:", key);
      return jsonError("Setting not found", 404);
    }

    const oldValue = existing.value;

    // Update the setting
    const { data: updated, error: updateError } = await auth.admin
      .from("platform_settings")
      .update({
        value: JSON.stringify(value),
        updated_at: new Date().toISOString(),
        updated_by: auth.user.id,
      })
      .eq("key", key)
      .select("key, value, description, updated_at")
      .single();

    if (updateError || !updated) {
      console.error("[admin/settings] Failed to update setting:", updateError);
      return jsonError("Failed to update setting", 500);
    }

    // Create audit log entry (non-blocking)
    auth.admin
      .from("audit_log")
      .insert({
        actor_id: auth.user.id,
        action: "settings.updated",
        entity_type: "platform_settings",
        entity_id: key,
        old_data: { value: oldValue } as Json,
        new_data: { value } as Json,
      })
      .then(({ error: auditError }) => {
        if (auditError) {
          console.error("[admin/settings] Audit log error:", auditError);
        }
      });

    return jsonOk({
      setting: {
        key: updated.key,
        value: updated.value,
        description: updated.description,
        updated_at: updated.updated_at,
      },
    });
  } catch (err) {
    console.error("[admin/settings] PATCH error:", err);
    return jsonError("Internal server error", 500);
  }
}
