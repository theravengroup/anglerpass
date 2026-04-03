import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Financial analytics API — provides detailed fee-split breakdowns
 * for each role's dedicated financial dashboard.
 *
 * Query params:
 *   view  = landowner | club | angler | guide | admin
 *   days  = 1–3650 (default 30)
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view");
    const rawDays = parseInt(searchParams.get("days") ?? "30", 10);
    const days = Math.min(Math.max(isNaN(rawDays) ? 30 : rawDays, 1), 3650);

    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceISO = since.toISOString();

    switch (view) {
      case "landowner":
        return NextResponse.json(
          await getLandownerFinancials(admin, user.id, sinceISO)
        );

      case "club":
        return NextResponse.json(
          await getClubFinancials(admin, user.id, sinceISO)
        );

      case "angler":
        return NextResponse.json(
          await getAnglerFinancials(admin, user.id, sinceISO)
        );

      case "guide":
        return NextResponse.json(
          await getGuideFinancials(admin, user.id, sinceISO)
        );

      case "admin": {
        const { data: profile } = await admin
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile?.role !== "admin") {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        return NextResponse.json(await getAdminFinancials(admin, sinceISO));
      }

      default:
        return NextResponse.json(
          { error: "Invalid view parameter" },
          { status: 400 }
        );
    }
  } catch (err) {
    console.error("[financials] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* ═══════════════════════════════════════════════════════════════════════
   LANDOWNER FINANCIALS
   ═══════════════════════════════════════════════════════════════════════ */

 
async function getLandownerFinancials(admin: any, userId: string, since: string) {
  const { data: properties } = await admin
    .from("properties")
    .select("id, name")
    .eq("owner_id", userId);

  const propertyIds = (properties ?? []).map((p: { id: string }) => p.id);

  if (propertyIds.length === 0) {
    return emptyLandownerFinancials();
  }

  const { data: allBookings } = await admin
    .from("bookings")
    .select(
      "id, status, booking_date, created_at, base_rate, platform_fee, club_commission, landowner_payout, cross_club_fee, total_amount, rod_count, property_id, booking_group_id, properties(name), profiles!bookings_angler_id_fkey(display_name)"
    )
    .in("property_id", propertyIds)
    .order("created_at", { ascending: false });

  const bookings = allBookings ?? [];
  const completed = bookings.filter(
    (b: { status: string }) => b.status === "confirmed" || b.status === "completed"
  );
  const periodCompleted = completed.filter(
    (b: { created_at: string }) => b.created_at >= since
  );

  const totalEarnings = sumField(completed, "landowner_payout");
  const periodEarnings = sumField(periodCompleted, "landowner_payout");
  const totalCommissionsPaid = sumField(completed, "club_commission");
  const totalBaseRate = sumField(completed, "base_rate");

  // Earnings by property
  const propMap: Record<string, { name: string; base_rate: number; club_commission: number; landowner_payout: number; bookings: number }> = {};
  for (const b of completed) {
    const pid = b.property_id;
    const pname = (b.properties as { name: string } | null)?.name ?? "Unknown";
    if (!propMap[pid]) {
      propMap[pid] = { name: pname, base_rate: 0, club_commission: 0, landowner_payout: 0, bookings: 0 };
    }
    propMap[pid].base_rate += b.base_rate ?? 0;
    propMap[pid].club_commission += b.club_commission ?? 0;
    propMap[pid].landowner_payout += b.landowner_payout ?? 0;
    propMap[pid].bookings += 1;
  }

  // Monthly earnings (last 12 months)
  const monthly = aggregateMonthly(completed, "landowner_payout");

  return {
    total_earnings: totalEarnings,
    period_earnings: periodEarnings,
    total_base_rate: totalBaseRate,
    total_commissions_paid: totalCommissionsPaid,
    total_bookings: completed.length,
    period_bookings: periodCompleted.length,
    earnings_by_property: Object.values(propMap).sort((a, b) => b.landowner_payout - a.landowner_payout),
    monthly_earnings: monthly,
    recent_transactions: bookings.slice(0, 20).map((b: Record<string, unknown>) => ({
      id: b.id,
      status: b.status,
      booking_date: b.booking_date,
      property_name: (b.properties as { name: string } | null)?.name,
      angler_name: (b.profiles as { display_name: string | null } | null)?.display_name,
      base_rate: b.base_rate,
      club_commission: b.club_commission,
      landowner_payout: b.landowner_payout,
      rod_count: b.rod_count,
      created_at: b.created_at,
    })),
  };
}

function emptyLandownerFinancials() {
  return {
    total_earnings: 0,
    period_earnings: 0,
    total_base_rate: 0,
    total_commissions_paid: 0,
    total_bookings: 0,
    period_bookings: 0,
    earnings_by_property: [],
    monthly_earnings: [],
    recent_transactions: [],
  };
}

/* ═══════════════════════════════════════════════════════════════════════
   CLUB FINANCIALS
   ═══════════════════════════════════════════════════════════════════════ */

 
async function getClubFinancials(admin: any, userId: string, since: string) {
  // Find user's club
  const { data: clubs } = await admin
    .from("clubs")
    .select("id, name")
    .eq("owner_id", userId);

  if (!clubs?.length) {
    return emptyClubFinancials();
  }

  const clubId = clubs[0].id;

  // Get properties associated with this club
  const { data: clubProperties } = await admin
    .from("club_properties")
    .select("property_id, properties(name)")
    .eq("club_id", clubId)
    .eq("status", "approved");

  const propertyIds = (clubProperties ?? []).map((cp: { property_id: string }) => cp.property_id);

  // Club commission from bookings on club properties
  let bookings: Record<string, unknown>[] = [];
  if (propertyIds.length > 0) {
    const { data: bookingData } = await admin
      .from("bookings")
      .select(
        "id, status, booking_date, created_at, club_commission, base_rate, total_amount, rod_count, property_id, booking_group_id, properties(name), profiles!bookings_angler_id_fkey(display_name)"
      )
      .in("property_id", propertyIds)
      .in("status", ["confirmed", "completed"])
      .order("created_at", { ascending: false });

    bookings = bookingData ?? [];
  }

  const periodBookings = bookings.filter(
    (b: Record<string, unknown>) => (b.created_at as string) >= since
  );

  const totalCommission = sumField(bookings, "club_commission");
  const periodCommission = sumField(periodBookings, "club_commission");

  // Membership payments
  const { data: membershipPayments } = await admin
    .from("membership_payments")
    .select("id, amount, club_amount, club_payout, processing_fee, type, status, created_at, profiles(display_name)")
    .eq("club_id", clubId)
    .eq("status", "succeeded")
    .order("created_at", { ascending: false })
    .limit(50);

  const payments = membershipPayments ?? [];
  const totalMembershipRevenue = payments.reduce(
    (sum: number, p: Record<string, unknown>) => sum + ((p.club_payout as number) ?? (p.club_amount as number) ?? 0),
    0
  );
  const periodPayments = payments.filter(
    (p: Record<string, unknown>) => (p.created_at as string) >= since
  );
  const periodMembershipRevenue = periodPayments.reduce(
    (sum: number, p: Record<string, unknown>) => sum + ((p.club_payout as number) ?? (p.club_amount as number) ?? 0),
    0
  );

  // Active members count
  const { count: activeMembers } = await admin
    .from("club_memberships")
    .select("id", { count: "exact", head: true })
    .eq("club_id", clubId)
    .eq("status", "active");

  // Commission by property
  const propMap: Record<string, { name: string; commission: number; bookings: number }> = {};
  for (const b of bookings) {
    const pid = b.property_id as string;
    const pname = (b.properties as { name: string } | null)?.name ?? "Unknown";
    if (!propMap[pid]) {
      propMap[pid] = { name: pname, commission: 0, bookings: 0 };
    }
    propMap[pid].commission += (b.club_commission as number) ?? 0;
    propMap[pid].bookings += 1;
  }

  const monthly = aggregateMonthly(bookings, "club_commission");

  return {
    total_commission: totalCommission,
    period_commission: periodCommission,
    total_membership_revenue: totalMembershipRevenue,
    period_membership_revenue: periodMembershipRevenue,
    total_revenue: totalCommission + totalMembershipRevenue,
    active_members: activeMembers ?? 0,
    total_bookings: bookings.length,
    period_bookings: periodBookings.length,
    commission_by_property: Object.values(propMap).sort((a, b) => b.commission - a.commission),
    monthly_commission: monthly,
    recent_transactions: bookings.slice(0, 20).map((b: Record<string, unknown>) => ({
      id: b.id,
      status: b.status,
      booking_date: b.booking_date,
      property_name: (b.properties as { name: string } | null)?.name,
      angler_name: (b.profiles as { display_name: string | null } | null)?.display_name,
      club_commission: b.club_commission,
      base_rate: b.base_rate,
      rod_count: b.rod_count,
      created_at: b.created_at,
    })),
    recent_membership_payments: payments.slice(0, 10).map((p: Record<string, unknown>) => ({
      id: p.id,
      type: p.type,
      amount: p.club_payout ?? p.club_amount,
      processing_fee: p.processing_fee,
      member_name: (p.profiles as { display_name: string | null } | null)?.display_name,
      created_at: p.created_at,
    })),
  };
}

function emptyClubFinancials() {
  return {
    total_commission: 0,
    period_commission: 0,
    total_membership_revenue: 0,
    period_membership_revenue: 0,
    total_revenue: 0,
    active_members: 0,
    total_bookings: 0,
    period_bookings: 0,
    commission_by_property: [],
    monthly_commission: [],
    recent_transactions: [],
    recent_membership_payments: [],
  };
}

/* ═══════════════════════════════════════════════════════════════════════
   ANGLER FINANCIALS
   ═══════════════════════════════════════════════════════════════════════ */

 
async function getAnglerFinancials(admin: any, userId: string, since: string) {
  const { data: allBookings } = await admin
    .from("bookings")
    .select(
      "id, status, booking_date, created_at, base_rate, platform_fee, cross_club_fee, guide_rate, guide_service_fee, total_amount, rod_count, booking_group_id, properties(name)"
    )
    .eq("angler_id", userId)
    .in("status", ["confirmed", "completed"])
    .order("created_at", { ascending: false });

  const bookings = allBookings ?? [];
  const periodBookings = bookings.filter(
    (b: { created_at: string }) => b.created_at >= since
  );

  const totalSpent = sumField(bookings, "total_amount");
  const periodSpent = sumField(periodBookings, "total_amount");
  const totalRodFees = sumField(bookings, "base_rate");
  const totalPlatformFees = sumField(bookings, "platform_fee");
  const totalGuideFees = bookings.reduce(
    (sum: number, b: Record<string, unknown>) =>
      sum + ((b.guide_rate as number) ?? 0) + ((b.guide_service_fee as number) ?? 0),
    0
  );
  const totalCrossClubFees = sumField(bookings, "cross_club_fee");

  // Spending by property
  const propMap: Record<string, { name: string; total_amount: number; bookings: number }> = {};
  for (const b of bookings) {
    const pname = (b.properties as { name: string } | null)?.name ?? "Unknown";
    if (!propMap[pname]) {
      propMap[pname] = { name: pname, total_amount: 0, bookings: 0 };
    }
    propMap[pname].total_amount += (b.total_amount as number) ?? 0;
    propMap[pname].bookings += 1;
  }

  // Membership payments
  const { data: membershipPayments } = await admin
    .from("membership_payments")
    .select("id, amount, total_charged, type, status, created_at, clubs(name)")
    .eq("user_id", userId)
    .eq("status", "succeeded")
    .order("created_at", { ascending: false })
    .limit(20);

  const payments = membershipPayments ?? [];
  const totalMembershipDues = payments.reduce(
    (sum: number, p: Record<string, unknown>) => sum + ((p.total_charged as number) ?? (p.amount as number) ?? 0),
    0
  );

  const monthly = aggregateMonthly(bookings, "total_amount");

  return {
    total_spent: totalSpent,
    period_spent: periodSpent,
    total_rod_fees: totalRodFees,
    total_platform_fees: totalPlatformFees,
    total_guide_fees: totalGuideFees,
    total_cross_club_fees: totalCrossClubFees,
    total_membership_dues: totalMembershipDues,
    total_bookings: bookings.length,
    period_bookings: periodBookings.length,
    spending_by_property: Object.values(propMap).sort((a, b) => b.total_amount - a.total_amount),
    monthly_spending: monthly,
    recent_transactions: bookings.slice(0, 20).map((b: Record<string, unknown>) => ({
      id: b.id,
      status: b.status,
      booking_date: b.booking_date,
      property_name: (b.properties as { name: string } | null)?.name,
      base_rate: b.base_rate,
      platform_fee: b.platform_fee,
      guide_rate: b.guide_rate,
      guide_service_fee: b.guide_service_fee,
      cross_club_fee: b.cross_club_fee,
      total_amount: b.total_amount,
      created_at: b.created_at,
    })),
    membership_payments: payments.map((p: Record<string, unknown>) => ({
      id: p.id,
      type: p.type,
      amount: p.total_charged ?? p.amount,
      club_name: (p.clubs as { name: string } | null)?.name,
      created_at: p.created_at,
    })),
  };
}

/* ═══════════════════════════════════════════════════════════════════════
   GUIDE FINANCIALS
   ═══════════════════════════════════════════════════════════════════════ */

 
async function getGuideFinancials(admin: any, userId: string, since: string) {
  const { data: allBookings } = await admin
    .from("bookings")
    .select(
      "id, status, booking_date, created_at, guide_rate, guide_service_fee, guide_payout, rod_count, booking_group_id, property_id, properties(name), profiles!bookings_angler_id_fkey(display_name)"
    )
    .eq("guide_id", userId)
    .in("status", ["confirmed", "completed"])
    .order("created_at", { ascending: false });

  const bookings = allBookings ?? [];
  const periodBookings = bookings.filter(
    (b: { created_at: string }) => b.created_at >= since
  );

  // This month
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const thisMonthBookings = bookings.filter(
    (b: { booking_date: string }) => b.booking_date >= monthStart
  );

  const totalEarnings = sumField(bookings, "guide_payout");
  const periodEarnings = sumField(periodBookings, "guide_payout");
  const thisMonthEarnings = sumField(thisMonthBookings, "guide_payout");

  // Earnings by property
  const propMap: Record<string, { name: string; earnings: number; trips: number }> = {};
  for (const b of bookings) {
    const pname = (b.properties as { name: string } | null)?.name ?? "Unknown";
    if (!propMap[pname]) {
      propMap[pname] = { name: pname, earnings: 0, trips: 0 };
    }
    propMap[pname].earnings += (b.guide_payout as number) ?? 0;
    propMap[pname].trips += 1;
  }

  const monthly = aggregateMonthly(bookings, "guide_payout");

  return {
    total_earnings: totalEarnings,
    period_earnings: periodEarnings,
    this_month_earnings: thisMonthEarnings,
    trips_total: bookings.length,
    trips_period: periodBookings.length,
    trips_this_month: thisMonthBookings.length,
    earnings_by_property: Object.values(propMap).sort((a, b) => b.earnings - a.earnings),
    monthly_earnings: monthly,
    recent_trips: bookings.slice(0, 20).map((b: Record<string, unknown>) => ({
      id: b.id,
      status: b.status,
      booking_date: b.booking_date,
      property_name: (b.properties as { name: string } | null)?.name,
      angler_name: (b.profiles as { display_name: string | null } | null)?.display_name,
      guide_rate: b.guide_rate,
      guide_payout: b.guide_payout,
      guide_service_fee: b.guide_service_fee,
      rod_count: b.rod_count,
      created_at: b.created_at,
    })),
  };
}

/* ═══════════════════════════════════════════════════════════════════════
   ADMIN FINANCIALS
   ═══════════════════════════════════════════════════════════════════════ */

 
async function getAdminFinancials(admin: any, since: string) {
  const { data: allBookings } = await admin
    .from("bookings")
    .select(
      "id, status, booking_date, created_at, base_rate, platform_fee, cross_club_fee, guide_rate, guide_service_fee, guide_payout, club_commission, landowner_payout, total_amount, rod_count, property_id, properties(name, owner_id, profiles!properties_owner_id_fkey(display_name))"
    )
    .in("status", ["confirmed", "completed"])
    .order("created_at", { ascending: false });

  const bookings = allBookings ?? [];
  const periodBookings = bookings.filter(
    (b: { created_at: string }) => b.created_at >= since
  );

  // Platform revenue streams
  const platformFeeTotal = sumField(bookings, "platform_fee");
  const crossClubFeeTotal = sumField(bookings, "cross_club_fee");
  const guideServiceFeeTotal = sumField(bookings, "guide_service_fee");
  const platformRevenueTotal = platformFeeTotal + crossClubFeeTotal + guideServiceFeeTotal;

  const platformFeePeriod = sumField(periodBookings, "platform_fee");
  const crossClubFeePeriod = sumField(periodBookings, "cross_club_fee");
  const guideServiceFeePeriod = sumField(periodBookings, "guide_service_fee");
  const platformRevenuePeriod = platformFeePeriod + crossClubFeePeriod + guideServiceFeePeriod;

  // GMV
  const gmvTotal = sumField(bookings, "total_amount");
  const gmvPeriod = sumField(periodBookings, "total_amount");

  // Payout obligations
  const landownerPayoutsTotal = sumField(bookings, "landowner_payout");
  const clubPayoutsTotal = sumField(bookings, "club_commission");
  const guidePayoutsTotal = sumField(bookings, "guide_payout");

  // Revenue by month
  const monthlyRevenue: Record<string, { month: string; platform_fee: number; cross_club_fee: number; guide_service_fee: number; total: number }> = {};
  for (const b of bookings) {
    const month = (b.created_at as string).slice(0, 7); // YYYY-MM
    if (!monthlyRevenue[month]) {
      monthlyRevenue[month] = { month, platform_fee: 0, cross_club_fee: 0, guide_service_fee: 0, total: 0 };
    }
    monthlyRevenue[month].platform_fee += (b.platform_fee as number) ?? 0;
    monthlyRevenue[month].cross_club_fee += (b.cross_club_fee as number) ?? 0;
    monthlyRevenue[month].guide_service_fee += (b.guide_service_fee as number) ?? 0;
    monthlyRevenue[month].total +=
      ((b.platform_fee as number) ?? 0) +
      ((b.cross_club_fee as number) ?? 0) +
      ((b.guide_service_fee as number) ?? 0);
  }

  // Top revenue properties
  const propMap: Record<string, { name: string; gmv: number; platform_revenue: number; bookings: number }> = {};
  for (const b of bookings) {
    const pname = (b.properties as { name: string } | null)?.name ?? "Unknown";
    if (!propMap[pname]) {
      propMap[pname] = { name: pname, gmv: 0, platform_revenue: 0, bookings: 0 };
    }
    propMap[pname].gmv += (b.total_amount as number) ?? 0;
    propMap[pname].platform_revenue +=
      ((b.platform_fee as number) ?? 0) +
      ((b.cross_club_fee as number) ?? 0) +
      ((b.guide_service_fee as number) ?? 0);
    propMap[pname].bookings += 1;
  }

  // Membership payment totals
  const { data: membershipData } = await admin
    .from("membership_payments")
    .select("club_payout, processing_fee, total_charged, created_at")
    .eq("status", "succeeded");

  const memberPayments = membershipData ?? [];
  const membershipGmv = memberPayments.reduce(
    (sum: number, p: Record<string, unknown>) => sum + ((p.total_charged as number) ?? 0), 0
  );
  const membershipProcessingFees = memberPayments.reduce(
    (sum: number, p: Record<string, unknown>) => sum + ((p.processing_fee as number) ?? 0), 0
  );

  return {
    platform_revenue_total: platformRevenueTotal,
    platform_revenue_period: platformRevenuePeriod,
    platform_fee_total: platformFeeTotal,
    cross_club_fee_total: crossClubFeeTotal,
    guide_service_fee_total: guideServiceFeeTotal,
    gmv_total: gmvTotal,
    gmv_period: gmvPeriod,
    landowner_payouts_total: landownerPayoutsTotal,
    club_payouts_total: clubPayoutsTotal,
    guide_payouts_total: guidePayoutsTotal,
    total_bookings: bookings.length,
    period_bookings: periodBookings.length,
    membership_gmv: membershipGmv,
    membership_processing_fees: membershipProcessingFees,
    revenue_by_month: Object.values(monthlyRevenue).sort((a, b) => a.month.localeCompare(b.month)),
    top_properties: Object.values(propMap)
      .sort((a, b) => b.platform_revenue - a.platform_revenue)
      .slice(0, 15),
    recent_transactions: bookings.slice(0, 25).map((b: Record<string, unknown>) => ({
      id: b.id,
      status: b.status,
      booking_date: b.booking_date,
      property_name: (b.properties as { name: string } | null)?.name,
      base_rate: b.base_rate,
      platform_fee: b.platform_fee,
      cross_club_fee: b.cross_club_fee,
      guide_service_fee: b.guide_service_fee,
      landowner_payout: b.landowner_payout,
      club_commission: b.club_commission,
      guide_payout: b.guide_payout,
      total_amount: b.total_amount,
      created_at: b.created_at,
    })),
  };
}

/* ═══════════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════════ */

function sumField(rows: Record<string, unknown>[], field: string): number {
  return rows.reduce(
    (sum, row) => sum + ((row[field] as number) ?? 0),
    0
  );
}

/**
 * Aggregate a numeric field into monthly buckets.
 * Returns last 12 months sorted chronologically.
 */
function aggregateMonthly(
  rows: Record<string, unknown>[],
  field: string
): { month: string; amount: number }[] {
  const map: Record<string, number> = {};
  for (const row of rows) {
    const dateStr = (row.created_at as string) ?? (row.booking_date as string);
    if (!dateStr) continue;
    const month = dateStr.slice(0, 7);
    map[month] = (map[month] ?? 0) + ((row[field] as number) ?? 0);
  }

  return Object.entries(map)
    .map(([month, amount]) => ({ month, amount: Math.round(amount * 100) / 100 }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12);
}
