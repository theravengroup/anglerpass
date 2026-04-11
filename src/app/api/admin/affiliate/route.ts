import { jsonOk, jsonError, requireAuth } from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createUntypedAdmin } from "@/lib/supabase/untyped";

export async function GET() {
  const auth = await requireAuth();
  if (!auth) return jsonError("Unauthorized", 401);

  // Verify admin role
  const typed = createAdminClient();
  const { data: profile } = await typed
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (profile?.role !== "admin" && profile?.role !== "affiliate") {
    return jsonError("Forbidden", 403);
  }

  // Use untyped client for affiliate tables (not yet in generated types)
  const admin = createUntypedAdmin();

  // Current month period
  const now = new Date();
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Stats queries in parallel
  const [
    clicksResult,
    conversionsResult,
    brandsResult,
    revenueResult,
  ] = await Promise.all([
    // Total clicks this month
    admin
      .from("affiliate_clicks")
      .select("id", { count: "exact", head: true })
      .gte("clicked_at", `${period}-01T00:00:00Z`),

    // Conversions this month
    admin
      .from("affiliate_conversions")
      .select("id, commission_cents, status")
      .gte("converted_at", `${period}-01T00:00:00Z`),

    // Active brands
    admin
      .from("affiliate_brands")
      .select("id, name, slug, tier, is_active")
      .eq("is_active", true)
      .order("name"),

    // Monthly revenue summary
    admin
      .from("affiliate_revenue_monthly")
      .select("period, clicks, conversions, revenue_cents")
      .order("period", { ascending: false })
      .limit(12),
  ]);

  const totalClicks = clicksResult.count ?? 0;

  interface ConversionRow {
    id: string;
    commission_cents: number | null;
    status: string;
  }

  const conversions: ConversionRow[] = conversionsResult.data ?? [];
  const totalConversions = conversions.length;
  const approvedRevenueCents = conversions
    .filter((c) => c.status === "approved" || c.status === "paid")
    .reduce((sum, c) => sum + (c.commission_cents ?? 0), 0);
  const pendingRevenueCents = conversions
    .filter((c) => c.status === "pending")
    .reduce((sum, c) => sum + (c.commission_cents ?? 0), 0);

  const activeBrands = brandsResult.data ?? [];

  const conversionRate =
    totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(2) : "0";

  // Top products by clicks (manual query since we don't have the RPC yet)
  const { data: topClicksData } = await admin
    .from("affiliate_clicks")
    .select("product_id")
    .gte("clicked_at", new Date(Date.now() - 30 * 86400000).toISOString())
    .limit(500);

  // Count clicks per product
  const clickCounts = new Map<string, number>();
  for (const row of topClicksData ?? []) {
    const pid = row.product_id as string;
    clickCounts.set(pid, (clickCounts.get(pid) ?? 0) + 1);
  }

  const topProductIds = [...clickCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  let topProducts: Array<{
    product_name: string;
    brand_name: string;
    click_count: number;
  }> = [];

  if (topProductIds.length > 0) {
    const { data: products } = await admin
      .from("affiliate_products")
      .select("id, name, affiliate_brands ( name )")
      .in(
        "id",
        topProductIds.map(([id]) => id)
      );

    if (products) {
      const productMap = new Map(
        products.map((p) => {
          const brand = p.affiliate_brands as unknown as { name: string } | null;
          return [p.id as string, { name: p.name as string, brand: brand?.name ?? "" }];
        })
      );

      topProducts = topProductIds.map(([id, count]) => ({
        product_name: productMap.get(id)?.name ?? "Unknown",
        brand_name: productMap.get(id)?.brand ?? "",
        click_count: count,
      }));
    }
  }

  return jsonOk({
    period,
    stats: {
      totalClicks,
      totalConversions,
      conversionRate: `${conversionRate}%`,
      approvedRevenue: `$${(approvedRevenueCents / 100).toFixed(2)}`,
      pendingRevenue: `$${(pendingRevenueCents / 100).toFixed(2)}`,
      activeBrandCount: activeBrands.length,
    },
    brands: activeBrands,
    topProducts,
    monthlyHistory: revenueResult.data ?? [],
  });
}
