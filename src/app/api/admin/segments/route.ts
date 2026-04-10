import { NextRequest } from "next/server";
import { requireAdmin, jsonOk, jsonCreated, jsonError } from "@/lib/api/helpers";
import { createSegmentSchema } from "@/lib/validations/campaigns";
import { countSegment } from "@/lib/crm/segment-evaluator";
import type { SegmentRuleGroup } from "@/lib/crm/types";

/**
 * GET /api/admin/segments
 *
 * List all segments with cached counts.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth) return jsonError("Unauthorized", 401);

  const url = request.nextUrl;
  const page = Number(url.searchParams.get("page") ?? "1");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "50"), 100);
  const offset = (page - 1) * limit;

  const segments = auth.admin.from("segments");

  const { data, error } = await segments
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return jsonError(`Failed to fetch segments: ${error.message}`, 500);
  }

  // Get total count for pagination
  const { count: total } = await segments
    .select("*", { count: "exact", head: true });

  return jsonOk({
    segments: data ?? [],
    pagination: { page, limit, total: total ?? 0 },
  });
}

/**
 * POST /api/admin/segments
 *
 * Create a new segment. Immediately calculates the cached count.
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

  const result = createSegmentSchema.safeParse(body);
  if (!result.success) {
    return jsonError(result.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const { name, description, is_dynamic, include_leads, rules } = result.data;

  // Calculate initial count
  let cachedCount = 0;
  try {
    cachedCount = await countSegment(
      auth.admin,
      rules as SegmentRuleGroup[]
    );
  } catch (err) {
    console.error("[api/segments] Count failed during creation:", err);
    // Don't block creation — count will be 0 until next refresh
  }

  const { data: segment, error } = await auth.admin.from("segments")
    .insert({
      name,
      description: description ?? null,
      is_dynamic,
      include_leads,
      rules,
      cached_count: cachedCount,
      cached_at: new Date().toISOString(),
      created_by: auth.user.id,
    })
    .select("*")
    .single();

  if (error) {
    return jsonError(`Failed to create segment: ${error.message}`, 500);
  }

  return jsonCreated({ segment });
}
