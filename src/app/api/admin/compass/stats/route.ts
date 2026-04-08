import { requireAuth, jsonError, jsonOk } from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createUntypedAdminClient } from "@/lib/supabase/untyped-admin";

/**
 * GET /api/admin/compass/stats
 * Returns Compass AI usage stats for the admin dashboard.
 */
export async function GET() {
  const auth = await requireAuth();
  if (!auth) {
    return jsonError("Unauthorized", 401);
  }

  const typedAdmin = createAdminClient();

  // Verify admin role
  const { data: profile } = await typedAdmin
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .single();

  if (profile?.role !== "admin") {
    return jsonError("Forbidden", 403);
  }

  const admin = createUntypedAdminClient();
  const now = new Date();
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Fetch all stats in parallel
  const [usageResult, purchasesResult, topUsersResult, atLimitResult] =
    await Promise.all([
      admin
        .from("compass_usage")
        .select("message_count")
        .eq("period", currentPeriod),

      admin
        .from("compass_credit_purchases")
        .select("messages_purchased, amount_cents")
        .eq("status", "succeeded")
        .gte("created_at", `${currentPeriod}-01T00:00:00Z`),

      admin
        .from("compass_usage")
        .select("user_id, message_count")
        .eq("period", currentPeriod)
        .order("message_count", { ascending: false })
        .limit(10),

      admin
        .from("compass_usage")
        .select("user_id", { count: "exact", head: true })
        .eq("period", currentPeriod)
        .gte("message_count", 50),
    ]);

  type UsageRow = { message_count: number };
  type PurchaseRow = { messages_purchased: number; amount_cents: number };
  type TopUserRow = { user_id: string; message_count: number };

  const usageRows = (usageResult.data ?? []) as UsageRow[];
  const totalMessagesThisMonth = usageRows.reduce(
    (sum, row) => sum + (row.message_count ?? 0),
    0
  );
  const activeUsersThisMonth = usageRows.length;

  const purchases = (purchasesResult.data ?? []) as PurchaseRow[];
  const totalCreditPurchases = purchases.length;
  const creditRevenueCents = purchases.reduce(
    (sum, row) => sum + (row.amount_cents ?? 0),
    0
  );

  // Get display names for top users
  const topUsersRaw = (topUsersResult.data ?? []) as TopUserRow[];
  let topUsers: {
    user_id: string;
    display_name: string;
    message_count: number;
  }[] = [];

  if (topUsersRaw.length > 0) {
    const userIds = topUsersRaw.map((u) => u.user_id);
    const { data: profiles } = await typedAdmin
      .from("profiles")
      .select("id, display_name")
      .in("id", userIds);

    const nameMap = new Map(
      (profiles ?? []).map((p) => [p.id, p.display_name ?? "Unknown"])
    );

    topUsers = topUsersRaw.map((u) => ({
      user_id: u.user_id,
      display_name: nameMap.get(u.user_id) ?? "Unknown",
      message_count: u.message_count,
    }));
  }

  const usersAtLimit = atLimitResult.count ?? 0;

  return jsonOk({
    totalMessagesThisMonth,
    activeUsersThisMonth,
    totalCreditPurchases,
    creditRevenueCents,
    topUsers,
    usersAtLimit,
  });
}
