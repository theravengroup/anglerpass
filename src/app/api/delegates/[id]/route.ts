import { jsonError, jsonOk, requireAuth} from "@/lib/api/helpers";
import { delegateUpdateSchema } from "@/lib/validations/permissions";
import { auditLog, AuditAction } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * PATCH /api/delegates/[id]
 *
 * Update a delegate's access level.
 */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

    const body = await request.json();
    const result = delegateUpdateSchema.safeParse(body);

    if (!result.success) {
      return jsonError(result.error.issues[0]?.message ?? "Invalid input", 400);
    }

    const { data: existing, error: fetchError } = await createAdminClient().from("angler_delegates")
      .select("id, angler_id, access_level, status")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return jsonError("Delegate not found", 404);
    }

    if (existing.angler_id !== user.id) {
      return jsonError("Forbidden", 403);
    }

    if (existing.status === "revoked") {
      return jsonError("Cannot modify a revoked delegate. Re-invite instead.", 400);
    }

    const { access_level } = result.data;
    const oldLevel = existing.access_level;

    const { data: updated, error } = await createAdminClient().from("angler_delegates")
      .update({ access_level })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[delegates] Update error:", error);
      return jsonError("Failed to update delegate", 500);
    }

    auditLog({
      actor_id: user.id,
      action: AuditAction.DELEGATE_LEVEL_CHANGED,
      entity_type: "angler_delegate",
      entity_id: id,
      old_data: { access_level: oldLevel },
      new_data: { access_level },
      scope: "consumer",
    }).catch((err) => console.error("[delegates] Audit error:", err));

    return jsonOk({ delegate: updated });
  } catch (err) {
    console.error("[delegates] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}

/**
 * DELETE /api/delegates/[id]
 *
 * Revoke a delegate's access.
 */
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

    const { data: existing, error: fetchError } = await createAdminClient().from("angler_delegates")
      .select("id, angler_id, delegate_id, access_level, status")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return jsonError("Delegate not found", 404);
    }

    if (existing.angler_id !== user.id && existing.delegate_id !== user.id) {
      return jsonError("Forbidden", 403);
    }

    if (existing.status === "revoked") {
      return jsonError("Already revoked", 400);
    }

    const { error } = await createAdminClient().from("angler_delegates")
      .update({
        status: "revoked",
        revoked_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("[delegates] Revoke error:", error);
      return jsonError("Failed to revoke delegate", 500);
    }

    auditLog({
      actor_id: user.id,
      action: AuditAction.DELEGATE_REVOKED,
      entity_type: "angler_delegate",
      entity_id: id,
      old_data: { access_level: existing.access_level, status: existing.status },
      new_data: { status: "revoked" },
      scope: "consumer",
    }).catch((err) => console.error("[delegates] Audit error:", err));

    return jsonOk({ success: true });
  } catch (err) {
    console.error("[delegates] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}
