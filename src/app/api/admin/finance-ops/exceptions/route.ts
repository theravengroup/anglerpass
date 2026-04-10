import { requireAdmin, jsonOk, jsonError } from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/admin/finance-ops/exceptions?status=open&sort=age
 *
 * Exception listing with aging report.
 * Supports filtering by status and sorting by age or severity.
 */
export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth) return jsonError("Unauthorized", 401);

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? "open";
  const showAll = searchParams.get("all") === "true";

  const db = createAdminClient();

  let query = db
    .from("finance_reconciliation_exceptions")
    .select(
      "id, type, severity, stripe_payout_id, mercury_txn_id, expected_amount, actual_amount, description, status, resolved_by, resolved_at, resolution_note, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (!showAll) {
    query = query.eq("status", status);
  }

  const { data: exceptions } = await query;

  const exceptionList = (exceptions ?? []) as Array<{
    id: string;
    type: string;
    severity: string;
    status: string;
    created_at: string;
    resolved_at: string | null;
  }>;

  // Calculate aging
  const now = Date.now();
  const withAging = exceptionList.map((ex) => {
    const createdMs = new Date(ex.created_at).getTime();
    const ageDays = Math.floor((now - createdMs) / (24 * 60 * 60 * 1000));
    const resolvedInDays = ex.resolved_at
      ? Math.floor(
          (new Date(ex.resolved_at).getTime() - createdMs) /
            (24 * 60 * 60 * 1000)
        )
      : null;

    return { ...ex, age_days: ageDays, resolved_in_days: resolvedInDays };
  });

  // Aging summary
  const openExceptions = withAging.filter((e) => e.status === "open");
  const agingSummary = {
    total_open: openExceptions.length,
    under_1_day: openExceptions.filter((e) => e.age_days < 1).length,
    one_to_3_days: openExceptions.filter((e) => e.age_days >= 1 && e.age_days <= 3).length,
    three_to_7_days: openExceptions.filter((e) => e.age_days > 3 && e.age_days <= 7).length,
    over_7_days: openExceptions.filter((e) => e.age_days > 7).length,
    avg_age_days:
      openExceptions.length > 0
        ? Math.round(
            openExceptions.reduce((s, e) => s + e.age_days, 0) /
              openExceptions.length
          )
        : 0,
  };

  // Resolution time stats (for resolved exceptions)
  const resolved = withAging.filter(
    (e) => e.status === "resolved" && e.resolved_in_days !== null
  );
  const resolutionStats = {
    total_resolved: resolved.length,
    avg_resolution_days:
      resolved.length > 0
        ? Math.round(
            resolved.reduce((s, e) => s + (e.resolved_in_days ?? 0), 0) /
              resolved.length
          )
        : 0,
  };

  // Type breakdown
  const typeBreakdown: Record<string, number> = {};
  for (const ex of openExceptions) {
    typeBreakdown[ex.type] = (typeBreakdown[ex.type] ?? 0) + 1;
  }

  return jsonOk({
    exceptions: withAging,
    aging_summary: agingSummary,
    resolution_stats: resolutionStats,
    type_breakdown: typeBreakdown,
  });
}
