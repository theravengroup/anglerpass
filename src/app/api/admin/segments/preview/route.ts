import { NextRequest } from "next/server";
import { requireAdmin, jsonOk, jsonError } from "@/lib/api/helpers";
import { previewSegment } from "@/lib/crm/segment-evaluator";
import { segmentPreviewSchema } from "@/lib/validations/campaigns";
import type { SegmentRuleGroup } from "@/lib/crm/types";

/**
 * POST /api/admin/segments/preview
 *
 * Preview a segment's matching profiles without saving the segment.
 * Accepts the same rules format as segment creation.
 * Returns count + sample of matching profiles.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth) return jsonError("Unauthorized", 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const result = segmentPreviewSchema.safeParse(body);
  if (!result.success) {
    return jsonError(result.error.issues[0]?.message ?? "Invalid input", 400);
  }

  try {
    const preview = await previewSegment(
      auth.admin,
      result.data.rules as SegmentRuleGroup[],
      10
    );

    return jsonOk(preview);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Preview failed";
    console.error("[api/segments/preview] Error:", err);
    return jsonError(msg, 500);
  }
}
