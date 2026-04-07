import "server-only";

import { requireAdmin, jsonOk, jsonError, parsePositiveInt } from "@/lib/api/helpers";
import { createUntypedAdminClient } from "@/lib/supabase/untyped-admin";

/**
 * GET /api/admin/impersonation
 * List impersonation sessions (active and historical).
 */
export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth) return jsonError("Forbidden", 403);

  const { searchParams } = new URL(request.url);
  const page = parsePositiveInt(searchParams.get("page"), 1);
  const pageSize = parsePositiveInt(searchParams.get("page_size"), 25, 100);
  const activeOnly = searchParams.get("active") === "true";

  const db = createUntypedAdminClient();

  let query = db
    .from("impersonation_sessions")
    .select("*", { count: "exact" })
    .order("started_at", { ascending: false });

  if (activeOnly) {
    query = query.eq("is_active", true);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data: sessions, error, count } = await query;

  if (error) {
    return jsonError(`Failed to fetch sessions: ${error.message}`, 500);
  }

  const total = count ?? 0;

  return jsonOk({
    sessions: sessions ?? [],
    total,
    page,
    page_size: pageSize,
    total_pages: Math.ceil(total / pageSize),
  });
}
