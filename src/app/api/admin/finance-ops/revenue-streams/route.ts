import { requireAuth, jsonOk, jsonError } from "@/lib/api/helpers";
import { createUntypedAdminClient } from "@/lib/supabase/untyped-admin";

/**
 * GET /api/admin/finance-ops/revenue-streams?days=30
 *
 * Revenue breakdown by stream:
 * - Platform fees (15%)
 * - Cross-club fees ($25/rod/day)
 * - Guide service fees (10%)
 * - Membership processing fees (3.5%)
 * - Compass AI credit packs
 */
export async function GET(request: Request) {
  const auth = await requireAuth();
  if (!auth) return jsonError("Unauthorized", 401);

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") ?? "30", 10);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const untypedAdmin = createUntypedAdminClient();

  // Fetch all succeeded bookings in range (use untyped — some fee columns added by later migrations)
  const { data: bookings } = await untypedAdmin
    .from("bookings")
    .select(
      "id, platform_fee_cents, cross_club_fee_cents, guide_service_fee_cents, amount_cents, paid_at, booking_date"
    )
    .eq("payment_status", "succeeded")
    .gte("paid_at", since);

  const bookingList = (bookings ?? []) as Array<{
    id: string;
    platform_fee_cents: number | null;
    cross_club_fee_cents: number | null;
    guide_service_fee_cents: number | null;
    amount_cents: number | null;
    paid_at: string;
    booking_date: string;
  }>;

  // Platform fees
  const platformFees = bookingList.reduce(
    (sum, b) => sum + ((b.platform_fee_cents ?? 0) / 100),
    0
  );

  // Cross-club fees
  const crossClubFees = bookingList.reduce(
    (sum, b) => sum + ((b.cross_club_fee_cents ?? 0) / 100),
    0
  );

  // Guide service fees
  const guideServiceFees = bookingList.reduce(
    (sum, b) => sum + ((b.guide_service_fee_cents ?? 0) / 100),
    0
  );

  // Membership processing fees
  const { data: membershipPayments } = await untypedAdmin
    .from("membership_payments")
    .select("processing_fee")
    .gte("created_at", since);

  const membershipFees = ((membershipPayments ?? []) as Array<{ processing_fee: number | null }>)
    .reduce((sum, p) => sum + (p.processing_fee ?? 0), 0);

  // Compass AI credit revenue
  const { data: compassPurchases } = await untypedAdmin
    .from("compass_credit_purchases")
    .select("amount_cents")
    .eq("status", "succeeded")
    .gte("created_at", since);

  const compassRevenue = ((compassPurchases ?? []) as Array<{ amount_cents: number }>)
    .reduce((sum, p) => sum + (p.amount_cents / 100), 0);

  // GMV (total charged to anglers)
  const gmv = bookingList.reduce(
    (sum, b) => sum + ((b.amount_cents ?? 0) / 100),
    0
  );

  const totalRevenue = platformFees + crossClubFees + guideServiceFees + membershipFees + compassRevenue;

  // Daily breakdown for trending
  const dailyMap = new Map<string, {
    platform: number;
    cross_club: number;
    guide: number;
    membership: number;
    compass: number;
  }>();

  for (const b of bookingList) {
    const date = b.paid_at.split("T")[0];
    const entry = dailyMap.get(date) ?? {
      platform: 0, cross_club: 0, guide: 0, membership: 0, compass: 0,
    };
    entry.platform += (b.platform_fee_cents ?? 0) / 100;
    entry.cross_club += (b.cross_club_fee_cents ?? 0) / 100;
    entry.guide += (b.guide_service_fee_cents ?? 0) / 100;
    dailyMap.set(date, entry);
  }

  // Sort daily entries
  const daily = [...dailyMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, values]) => ({ date, ...values }));

  return jsonOk({
    period_days: days,
    gmv,
    total_revenue: totalRevenue,
    streams: {
      platform_fees: platformFees,
      cross_club_fees: crossClubFees,
      guide_service_fees: guideServiceFees,
      membership_fees: membershipFees,
      compass_credit_revenue: compassRevenue,
    },
    percentages: {
      platform_fees: totalRevenue > 0 ? Math.round((platformFees / totalRevenue) * 100) : 0,
      cross_club_fees: totalRevenue > 0 ? Math.round((crossClubFees / totalRevenue) * 100) : 0,
      guide_service_fees: totalRevenue > 0 ? Math.round((guideServiceFees / totalRevenue) * 100) : 0,
      membership_fees: totalRevenue > 0 ? Math.round((membershipFees / totalRevenue) * 100) : 0,
      compass_credit_revenue: totalRevenue > 0 ? Math.round((compassRevenue / totalRevenue) * 100) : 0,
    },
    daily,
    booking_count: bookingList.length,
  });
}
