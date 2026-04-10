import { requireAdmin, jsonOk, jsonError } from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/admin/finance-ops
 *
 * Returns finance operations overview:
 * - Recent Stripe payouts with reconciliation status
 * - Mercury account balances
 * - Open exceptions
 * - Sync status for all systems
 * - Latest daily snapshot
 */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth) return jsonError("Unauthorized", 401);

  const db = createAdminClient();

  // Fetch all data in parallel
  const [payoutsRes, accountsRes, exceptionsRes, syncRes, snapshotRes] =
    await Promise.all([
      db
        .from("finance_stripe_payouts")
        .select(
          "id, stripe_payout_id, amount, currency, status, arrival_date, paid_at, reconciliation_status, item_count, gross_amount, fee_amount, refund_amount, matched_at, created_at"
        )
        .order("created_at", { ascending: false })
        .limit(25),

      db
        .from("finance_mercury_accounts")
        .select(
          "id, mercury_account_id, name, kind, available_balance, current_balance, last_snapshot_at"
        ),

      db
        .from("finance_reconciliation_exceptions")
        .select(
          "id, type, severity, stripe_payout_id, mercury_txn_id, expected_amount, actual_amount, description, status, created_at"
        )
        .in("status", ["open", "investigating"])
        .order("created_at", { ascending: false })
        .limit(25),

      db.from("finance_sync_status").select("*"),

      db
        .from("finance_daily_snapshots")
        .select("*")
        .order("snapshot_date", { ascending: false })
        .limit(1),
    ]);

  return jsonOk({
    payouts: payoutsRes.data ?? [],
    accounts: accountsRes.data ?? [],
    exceptions: exceptionsRes.data ?? [],
    sync_status: syncRes.data ?? [],
    latest_snapshot: (snapshotRes.data ?? [])[0] ?? null,
  });
}

/**
 * PATCH /api/admin/finance-ops
 *
 * Resolve or dismiss a reconciliation exception.
 */
export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (!auth) return jsonError("Unauthorized", 401);

  const body = await request.json();
  const { exception_id, action, note } = body as {
    exception_id: string;
    action: "resolved" | "dismissed" | "investigating";
    note?: string;
  };

  if (!exception_id || !action) {
    return jsonError("Missing exception_id or action", 400);
  }

  const db = createAdminClient();

  const { data, error } = await db
    .from("finance_reconciliation_exceptions")
    .update({
      status: action,
      resolved_by: action === "investigating" ? null : auth.user.id,
      resolved_at:
        action === "investigating" ? null : new Date().toISOString(),
      resolution_note: note ?? null,
    })
    .eq("id", exception_id)
    .select("id, status")
    .maybeSingle();

  if (error) {
    return jsonError("Failed to update exception", 500);
  }

  return jsonOk({ exception: data });
}
