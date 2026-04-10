import { NextRequest } from "next/server";
import { requireAdmin, jsonOk, jsonError } from "@/lib/api/helpers";
import { updateSegmentSchema } from "@/lib/validations/campaigns";
import { refreshSegmentCache } from "@/lib/crm/segment-evaluator";

/**
 * GET /api/admin/segments/[id]
 *
 * Get a single segment by ID, including a fresh count.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth) return jsonError("Unauthorized", 401);

  const { id } = await params;

  const { data: segment, error } = await auth.admin.from("segments")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !segment) {
    return jsonError("Segment not found", 404);
  }

  return jsonOk({ segment });
}

/**
 * PATCH /api/admin/segments/[id]
 *
 * Update a segment. If rules change, recalculates the cached count.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth) return jsonError("Unauthorized", 401);

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const result = updateSegmentSchema.safeParse(body);
  if (!result.success) {
    return jsonError(result.error.issues[0]?.message ?? "Invalid input", 400);
  }

  // Verify segment exists
  const { data: existing } = await auth.admin.from("segments")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (!existing) {
    return jsonError("Segment not found", 404);
  }

  const updates: Record<string, unknown> = {
    ...result.data,
    updated_at: new Date().toISOString(),
  };

  const { data: segment, error } = await auth.admin.from("segments")
    .update(updates)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    return jsonError(`Failed to update segment: ${error.message}`, 500);
  }

  // If rules were changed, refresh the cached count
  if (result.data.rules) {
    try {
      await refreshSegmentCache(auth.admin, id);
    } catch (err) {
      console.error("[api/segments] Cache refresh failed:", err);
    }
  }

  return jsonOk({ segment });
}

/**
 * DELETE /api/admin/segments/[id]
 *
 * Delete a segment. Fails if any active campaigns reference it.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth) return jsonError("Unauthorized", 401);

  const { id } = await params;

  // Check if any active campaigns reference this segment
  const { data: campaigns } = await auth.admin.from("campaigns")
    .select("id, name")
    .eq("segment_id", id)
    .in("status", ["active", "draft"]);

  if (campaigns && campaigns.length > 0) {
    const names = (campaigns as Array<{ name: string }>)
      .map((c) => c.name)
      .join(", ");
    return jsonError(
      `Cannot delete segment: referenced by campaigns: ${names}`,
      409
    );
  }

  const { error } = await auth.admin.from("segments")
    .delete()
    .eq("id", id);

  if (error) {
    return jsonError(`Failed to delete segment: ${error.message}`, 500);
  }

  return jsonOk({ deleted: true });
}
