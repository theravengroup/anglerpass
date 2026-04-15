import { jsonError, jsonOk, requireAuth} from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { roundCurrency } from "@/lib/constants/fees";

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
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

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
        return jsonOk(await getLandownerFinancials(admin, user.id, sinceISO));

      case "club":
        return jsonOk(await getClubFinancials(admin, user.id, sinceISO));

      case "angler":
        return jsonOk(await getAnglerFinancials(admin, user.id, sinceISO));

      case "guide":
        return jsonOk(await getGuideFinancials(admin, user.id, sinceISO));

      case "admin": {
        const { data: profile } = await admin
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (profile?.role !== "admin") {
          return jsonError("Forbidden", 403);
        }
        return jsonOk(await getAdminFinancials(admin, sinceISO));
      }

      default:
        return jsonError("Invalid view parameter", 400);
    }
  } catch (err) {
    console.error("[financials] Error:", err);
    return jsonError("Internal server error", 500);
  }
}

/* ═══════════════════════════════════════════════════════════════════════
   LANDOWNER FINANCIALS
   ═══════════════════════════════════════════════════════════════════════ */

 
async function getLandownerFinancials(admin: any, userId: string, since: string) {
  const { data: properties } = await admin
    .from("properties")
    .select("id, name, pricing_mode, classification, lease_paid_through, lease_amount_cents")
    .eq("owner_id", userId);

  const propertyIds = (properties ?? []).map((p: { id: string }) => p.id);

  if (propertyIds.length === 0) {
    return emptyLandownerFinancials();
  }

  // Fetch ALL bookings (including cancelled) for complete financial picture
  const { data: allBookings } = await admin
    .from("bookings")
    .select(
      "id, status, payment_status, booking_date, created_at, base_rate, platform_fee, club_commission, landowner_payout, cross_club_fee, total_amount, rod_count, property_id, booking_group_id, guide_id, guide_rate, guide_payout, guide_service_fee, refund_amount, refund_percentage, late_cancel_fee, property_classification, pricing_mode, properties(name), profiles!bookings_angler_id_fkey(display_name)"
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

  // Held funds — bookings with payment captured but not yet paid out
  const heldBookings = bookings.filter(
    (b: { payment_status: string; status: string }) =>
      (b.payment_status === "hold" || b.payment_status === "succeeded") &&
      (b.status === "confirmed" || b.status === "completed")
  );
  const heldFundsTotal = sumField(heldBookings, "landowner_payout");
  const awaitingCapture = bookings.filter(
    (b: { payment_status: string; status: string }) =>
      b.payment_status === "hold" && b.status === "completed"
  ).length;

  // Refund tracking — cancelled bookings with refunds
  const cancelledBookings = bookings.filter(
    (b: { status: string }) => b.status === "cancelled"
  );
  const totalRefunds = sumField(cancelledBookings, "refund_amount");
  const periodCancelled = cancelledBookings.filter(
    (b: { created_at: string }) => b.created_at >= since
  );
  const periodRefunds = sumField(periodCancelled, "refund_amount");

  // Guide involvement tracking
  const guidedBookings = completed.filter(
    (b: { guide_id: string | null }) => b.guide_id
  );
  const totalGuideRate = sumField(guidedBookings, "guide_rate");
  const totalGuidePayout = sumField(guidedBookings, "guide_payout");

  // YTD / Quarterly earnings for tax purposes
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1).toISOString();
  const ytdBookings = completed.filter(
    (b: { created_at: string }) => b.created_at >= yearStart
  );
  const ytdEarnings = sumField(ytdBookings, "landowner_payout");

  // Quarterly breakdown for current year
  const quarters = [0, 3, 6, 9].map((startMonth) => {
    const qStart = new Date(now.getFullYear(), startMonth, 1).toISOString();
    const qEnd = new Date(now.getFullYear(), startMonth + 3, 1).toISOString();
    const qBookings = completed.filter(
      (b: { created_at: string }) => b.created_at >= qStart && b.created_at < qEnd
    );
    return {
      quarter: `Q${Math.floor(startMonth / 3) + 1} ${now.getFullYear()}`,
      earnings: sumField(qBookings, "landowner_payout"),
      gross: sumField(qBookings, "base_rate"),
      commissions: sumField(qBookings, "club_commission"),
      bookings: qBookings.length,
    };
  });

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

  // Lease payments received (upfront_lease properties)
  const { data: leasePaymentsRaw } = await admin
    .from("property_lease_payments")
    .select("id, property_id, amount_cents, platform_fee_cents, landowner_net_cents, status, period_start, period_end, paid_at, created_at, properties(name), clubs(name)")
    .in("property_id", propertyIds)
    .eq("status", "succeeded")
    .order("paid_at", { ascending: false });

  const leasePayments = leasePaymentsRaw ?? [];
  const totalLeaseIncome = leasePayments.reduce(
    (sum: number, p: Record<string, unknown>) => sum + ((p.landowner_net_cents as number) ?? 0) / 100,
    0
  );
  const periodLeasePayments = leasePayments.filter(
    (p: Record<string, unknown>) => (p.created_at as string) >= since
  );
  const periodLeaseIncome = periodLeasePayments.reduce(
    (sum: number, p: Record<string, unknown>) => sum + ((p.landowner_net_cents as number) ?? 0) / 100,
    0
  );

  // Properties pricing overview
  const propertiesPricingOverview = (properties ?? []).map(
    (p: { id: string; name: string; pricing_mode: string | null; classification: string | null; lease_paid_through: string | null; lease_amount_cents: number | null }) => ({
      property_id: p.id,
      name: p.name,
      pricing_mode: p.pricing_mode ?? "rod_fee_split",
      classification: p.classification,
      lease_paid_through: p.lease_paid_through,
      lease_amount: (p.lease_amount_cents ?? 0) / 100,
    })
  );

  // Classification breakdown from completed bookings
  const classMap: Record<string, { classification: string; bookings: number; landowner_payout: number }> = {};
  for (const b of completed) {
    const key = (b.pricing_mode === "upfront_lease")
      ? "lease"
      : (b.property_classification as string | null) ?? "unclassified";
    if (!classMap[key]) {
      classMap[key] = { classification: key, bookings: 0, landowner_payout: 0 };
    }
    classMap[key].bookings += 1;
    classMap[key].landowner_payout += (b.landowner_payout as number) ?? 0;
  }
  const classificationBreakdown = Object.values(classMap).map((c) => ({
    ...c,
    landowner_payout: roundCurrency(c.landowner_payout),
  }));

  return {
    total_earnings: roundCurrency(totalEarnings),
    period_earnings: roundCurrency(periodEarnings),
    total_base_rate: roundCurrency(totalBaseRate),
    total_commissions_paid: roundCurrency(totalCommissionsPaid),
    total_bookings: completed.length,
    period_bookings: periodCompleted.length,
    // New: held funds
    held_funds_total: heldFundsTotal,
    awaiting_capture: awaitingCapture,
    // New: refund tracking
    total_refunds: totalRefunds,
    period_refunds: periodRefunds,
    total_cancellations: cancelledBookings.length,
    period_cancellations: periodCancelled.length,
    // New: guide split visibility
    guided_bookings_count: guidedBookings.length,
    total_guide_rate: totalGuideRate,
    total_guide_payout: totalGuidePayout,
    // New: tax-ready data
    ytd_earnings: ytdEarnings,
    quarterly_earnings: quarters,
    earnings_by_property: Object.values(propMap).sort((a, b) => b.landowner_payout - a.landowner_payout),
    monthly_earnings: monthly,
    // Lease income (upfront_lease properties)
    total_lease_income: roundCurrency(totalLeaseIncome),
    period_lease_income: roundCurrency(periodLeaseIncome),
    recent_lease_payments: leasePayments.slice(0, 10).map((p: Record<string, unknown>) => ({
      id: p.id,
      property_name: (p.properties as { name: string } | null)?.name ?? "Unknown",
      club_name: (p.clubs as { name: string } | null)?.name,
      amount: roundCurrency(((p.amount_cents as number) ?? 0) / 100),
      platform_fee: roundCurrency(((p.platform_fee_cents as number) ?? 0) / 100),
      landowner_net: roundCurrency(((p.landowner_net_cents as number) ?? 0) / 100),
      period_start: p.period_start,
      period_end: p.period_end,
      paid_at: p.paid_at,
    })),
    properties_pricing_overview: propertiesPricingOverview,
    classification_breakdown: classificationBreakdown,
    recent_transactions: bookings.slice(0, 20).map((b: Record<string, unknown>) => ({
      id: b.id,
      status: b.status,
      payment_status: b.payment_status,
      booking_date: b.booking_date,
      property_name: (b.properties as { name: string } | null)?.name,
      angler_name: (b.profiles as { display_name: string | null } | null)?.display_name,
      base_rate: b.base_rate,
      club_commission: b.club_commission,
      landowner_payout: b.landowner_payout,
      rod_count: b.rod_count,
      guide_rate: b.guide_rate,
      guide_payout: b.guide_payout,
      refund_amount: b.refund_amount,
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
    held_funds_total: 0,
    awaiting_capture: 0,
    total_refunds: 0,
    period_refunds: 0,
    total_cancellations: 0,
    period_cancellations: 0,
    guided_bookings_count: 0,
    total_guide_rate: 0,
    total_guide_payout: 0,
    ytd_earnings: 0,
    quarterly_earnings: [],
    earnings_by_property: [],
    monthly_earnings: [],
    total_lease_income: 0,
    period_lease_income: 0,
    recent_lease_payments: [],
    properties_pricing_overview: [],
    classification_breakdown: [],
    recent_transactions: [],
  };
}

/* ═══════════════════════════════════════════════════════════════════════
   CLUB FINANCIALS
   ═══════════════════════════════════════════════════════════════════════ */

 
async function getClubFinancials(admin: any, userId: string, since: string) {
  // Find user's club (also check membership-based admin access)
  const { data: ownedClubs } = await admin
    .from("clubs")
    .select("id, name")
    .eq("owner_id", userId);

  let clubId: string | null = null;
  if (ownedClubs?.length) {
    clubId = ownedClubs[0].id;
  } else {
    // Check if user is an admin/manager of a club
    const { data: adminMembership } = await admin
      .from("club_memberships")
      .select("club_id")
      .eq("user_id", userId)
      .in("role", ["admin", "manager", "owner"])
      .limit(1)
      .maybeSingle();
    clubId = adminMembership?.club_id ?? null;
  }

  if (!clubId) {
    return emptyClubFinancials();
  }

  // Get properties associated with this club
  const { data: clubProperties } = await admin
    .from("club_property_access")
    .select("property_id, properties(name)")
    .eq("club_id", clubId)
    .eq("status", "approved");

  const propertyIds = (clubProperties ?? []).map((cp: { property_id: string }) => cp.property_id);

  // Club commission from ALL bookings on club properties (including cancelled for refund tracking)
  let allBookings: Record<string, unknown>[] = [];
  if (propertyIds.length > 0) {
    const { data: bookingData } = await admin
      .from("bookings")
      .select(
        "id, status, booking_date, created_at, club_commission, base_rate, total_amount, rod_count, property_id, booking_group_id, refund_amount, refund_percentage, club_membership_id, managing_club_id, referring_club_id, home_club_referral, property_classification, pricing_mode, properties(name), profiles!bookings_angler_id_fkey(display_name)"
      )
      .in("property_id", propertyIds)
      .order("created_at", { ascending: false });

    allBookings = bookingData ?? [];
  }

  const bookings = allBookings.filter(
    (b: Record<string, unknown>) =>
      (b.status as string) === "confirmed" || (b.status as string) === "completed"
  );
  const periodBookings = bookings.filter(
    (b: Record<string, unknown>) => (b.created_at as string) >= since
  );

  // Managing commission: club_commission where this club manages the booking
  const managingBookings = bookings.filter(
    (b: Record<string, unknown>) => (b.managing_club_id as string | null) === clubId
  );
  const periodManagingBookings = managingBookings.filter(
    (b: Record<string, unknown>) => (b.created_at as string) >= since
  );
  const managingCommission = sumField(managingBookings, "club_commission");
  const periodManagingCommission = sumField(periodManagingBookings, "club_commission");

  // Cross-club inbound: bookings at this club's properties by members of other clubs
  const crossClubInboundBookings = managingBookings.filter(
    (b: Record<string, unknown>) => {
      const ref = b.referring_club_id as string | null;
      return ref && ref !== clubId;
    }
  );
  const crossClubInboundCount = crossClubInboundBookings.length;

  // Cross-club outbound (referral income): this club is the referring club, but not managing
  const { data: referralBookingData } = await admin
    .from("bookings")
    .select(
      "id, status, created_at, home_club_referral, managing_club_id, referring_club_id"
    )
    .eq("referring_club_id", clubId)
    .in("status", ["confirmed", "completed"])
    .order("created_at", { ascending: false });

  const referralBookings = (referralBookingData ?? []).filter(
    (b: Record<string, unknown>) => (b.managing_club_id as string | null) !== clubId
  );
  const periodReferralBookings = referralBookings.filter(
    (b: Record<string, unknown>) => (b.created_at as string) >= since
  );
  const referralRevenue = sumField(referralBookings, "home_club_referral");
  const periodReferralRevenue = sumField(periodReferralBookings, "home_club_referral");

  // Back-compat totals
  const totalCommission = managingCommission + referralRevenue;
  const periodCommission = periodManagingCommission + periodReferralRevenue;

  // Refund impact on club revenue
  const cancelledBookings = allBookings.filter(
    (b: Record<string, unknown>) => (b.status as string) === "cancelled"
  );
  const lostCommissionFromCancellations = sumField(cancelledBookings, "club_commission");
  const periodCancelled = cancelledBookings.filter(
    (b: Record<string, unknown>) => (b.created_at as string) >= since
  );

  // Lease payments OUT — this club paid for upfront_lease properties
  const { data: leasePaymentsOutRaw } = await admin
    .from("property_lease_payments")
    .select("id, property_id, amount_cents, platform_fee_cents, landowner_net_cents, status, period_start, period_end, paid_at, created_at, properties(name)")
    .eq("club_id", clubId)
    .eq("status", "succeeded")
    .order("paid_at", { ascending: false });

  const leasePaymentsOut = leasePaymentsOutRaw ?? [];
  const totalLeaseOutflows = leasePaymentsOut.reduce(
    (sum: number, p: Record<string, unknown>) => sum + ((p.amount_cents as number) ?? 0) / 100,
    0
  );
  const totalLeasePlatformFeesPaid = leasePaymentsOut.reduce(
    (sum: number, p: Record<string, unknown>) => sum + ((p.platform_fee_cents as number) ?? 0) / 100,
    0
  );

  // Membership payments — with initiation vs dues breakdown
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

  // Initiation vs dues breakdown
  const initiationPayments = payments.filter((p: Record<string, unknown>) => p.type === "initiation_fee");
  const duesPayments = payments.filter((p: Record<string, unknown>) => p.type === "annual_dues");
  const totalInitiationRevenue = initiationPayments.reduce(
    (sum: number, p: Record<string, unknown>) => sum + ((p.club_payout as number) ?? (p.club_amount as number) ?? 0), 0
  );
  const totalDuesRevenue = duesPayments.reduce(
    (sum: number, p: Record<string, unknown>) => sum + ((p.club_payout as number) ?? (p.club_amount as number) ?? 0), 0
  );

  // Member dues health — membership status breakdown
  const [
    { count: activeMembersCount },
    { count: pastDueMembersCount },
    { count: gracePeriodCount },
    { count: lapsedCount },
  ] = await Promise.all([
    admin.from("club_memberships").select("id", { count: "exact", head: true })
      .eq("club_id", clubId).eq("status", "active"),
    admin.from("club_memberships").select("id", { count: "exact", head: true })
      .eq("club_id", clubId).eq("dues_status", "past_due"),
    admin.from("club_memberships").select("id", { count: "exact", head: true })
      .eq("club_id", clubId).eq("dues_status", "grace_period"),
    admin.from("club_memberships").select("id", { count: "exact", head: true })
      .eq("club_id", clubId).eq("status", "lapsed"),
  ]);

  // Monthly membership revenue (separate from commission trend)
  const monthlyMembership: Record<string, number> = {};
  for (const p of payments) {
    const dateStr = p.created_at as string;
    if (!dateStr) continue;
    const month = dateStr.slice(0, 7);
    monthlyMembership[month] = (monthlyMembership[month] ?? 0) +
      ((p.club_payout as number) ?? (p.club_amount as number) ?? 0);
  }

  // Commission by property (from managing bookings only)
  const propMap: Record<string, { name: string; commission: number; bookings: number }> = {};
  for (const b of managingBookings) {
    const pid = b.property_id as string;
    const pname = (b.properties as { name: string } | null)?.name ?? "Unknown";
    if (!propMap[pid]) {
      propMap[pid] = { name: pname, commission: 0, bookings: 0 };
    }
    propMap[pid].commission += (b.club_commission as number) ?? 0;
    propMap[pid].bookings += 1;
  }

  // Classification mix from managing bookings
  const clsMap: Record<string, { classification: string; bookings: number; commission: number }> = {};
  for (const b of managingBookings) {
    const key = (b.pricing_mode === "upfront_lease")
      ? "lease"
      : (b.property_classification as string | null) ?? "unclassified";
    if (!clsMap[key]) {
      clsMap[key] = { classification: key, bookings: 0, commission: 0 };
    }
    clsMap[key].bookings += 1;
    clsMap[key].commission += (b.club_commission as number) ?? 0;
  }
  const classificationMix = Object.values(clsMap).map((c) => ({
    ...c,
    commission: roundCurrency(c.commission),
  }));

  const monthly = aggregateMonthly(managingBookings, "club_commission");

  return {
    total_commission: roundCurrency(totalCommission),
    period_commission: roundCurrency(periodCommission),
    total_membership_revenue: roundCurrency(totalMembershipRevenue),
    period_membership_revenue: roundCurrency(periodMembershipRevenue),
    total_revenue: roundCurrency(totalCommission + totalMembershipRevenue),
    active_members: activeMembersCount ?? 0,
    total_bookings: bookings.length,
    period_bookings: periodBookings.length,
    // New: initiation vs dues breakdown
    total_initiation_revenue: roundCurrency(totalInitiationRevenue),
    total_dues_revenue: roundCurrency(totalDuesRevenue),
    // New: member dues health
    member_dues_health: {
      active: activeMembersCount ?? 0,
      past_due: pastDueMembersCount ?? 0,
      grace_period: gracePeriodCount ?? 0,
      lapsed: lapsedCount ?? 0,
    },
    // New: refund impact
    total_cancellations: cancelledBookings.length,
    period_cancellations: periodCancelled.length,
    lost_commission_from_cancellations: roundCurrency(lostCommissionFromCancellations),
    // Rod-fee share split
    managing_commission: roundCurrency(managingCommission),
    period_managing_commission: roundCurrency(periodManagingCommission),
    referral_revenue: roundCurrency(referralRevenue),
    period_referral_revenue: roundCurrency(periodReferralRevenue),
    // Cross-club booking volume
    cross_club_booking_count: crossClubInboundCount,
    cross_club_inbound_count: crossClubInboundCount,
    cross_club_outbound_count: referralBookings.length,
    // Lease outflows
    total_lease_outflows: roundCurrency(totalLeaseOutflows),
    total_lease_platform_fees_paid: roundCurrency(totalLeasePlatformFeesPaid),
    recent_lease_payments: leasePaymentsOut.slice(0, 10).map((p: Record<string, unknown>) => ({
      id: p.id,
      property_name: (p.properties as { name: string } | null)?.name ?? "Unknown",
      amount: roundCurrency(((p.amount_cents as number) ?? 0) / 100),
      platform_fee: roundCurrency(((p.platform_fee_cents as number) ?? 0) / 100),
      landowner_net: roundCurrency(((p.landowner_net_cents as number) ?? 0) / 100),
      period_start: p.period_start,
      period_end: p.period_end,
      paid_at: p.paid_at,
    })),
    classification_mix: classificationMix,
    // New: monthly membership trend
    monthly_membership: Object.entries(monthlyMembership)
      .map(([month, amount]) => ({ month, amount: roundCurrency(amount) }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12),
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
    total_initiation_revenue: 0,
    total_dues_revenue: 0,
    member_dues_health: { active: 0, past_due: 0, grace_period: 0, lapsed: 0 },
    total_cancellations: 0,
    period_cancellations: 0,
    lost_commission_from_cancellations: 0,
    managing_commission: 0,
    period_managing_commission: 0,
    referral_revenue: 0,
    period_referral_revenue: 0,
    cross_club_booking_count: 0,
    cross_club_inbound_count: 0,
    cross_club_outbound_count: 0,
    total_lease_outflows: 0,
    total_lease_platform_fees_paid: 0,
    recent_lease_payments: [],
    classification_mix: [],
    monthly_membership: [],
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
  // Fetch ALL bookings including cancelled (for refund tracking)
  const { data: allBookingsRaw } = await admin
    .from("bookings")
    .select(
      "id, status, booking_date, created_at, base_rate, platform_fee, cross_club_fee, guide_rate, guide_service_fee, total_amount, rod_count, booking_group_id, refund_amount, refund_percentage, late_cancel_fee, staff_discount_amount, properties(name)"
    )
    .eq("angler_id", userId)
    .order("created_at", { ascending: false });

  const allBookings = allBookingsRaw ?? [];
  const bookings = allBookings.filter(
    (b: { status: string }) => b.status === "confirmed" || b.status === "completed"
  );
  const periodBookings = bookings.filter(
    (b: { created_at: string }) => b.created_at >= since
  );

  const totalSpent = sumField(bookings, "total_amount");
  const periodSpent = sumField(periodBookings, "total_amount");
  const totalRodFees = sumField(bookings, "base_rate");
  const totalPlatformFees = sumField(bookings, "platform_fee");
  const totalGuideRates = sumField(bookings, "guide_rate");
  const totalGuideServiceFees = sumField(bookings, "guide_service_fee");
  const totalGuideFees = totalGuideRates + totalGuideServiceFees;
  const totalCrossClubFees = sumField(bookings, "cross_club_fee");

  // New: refund tracking — cancelled bookings
  const cancelledBookings = allBookings.filter(
    (b: { status: string }) => b.status === "cancelled"
  );
  const totalRefundsReceived = sumField(cancelledBookings, "refund_amount");
  const periodCancelled = cancelledBookings.filter(
    (b: { created_at: string }) => b.created_at >= since
  );
  const periodRefunds = sumField(periodCancelled, "refund_amount");

  // New: late cancellation fees
  const totalLateCancelFees = sumField(cancelledBookings, "late_cancel_fee");
  const periodLateCancelFees = sumField(periodCancelled, "late_cancel_fee");

  // New: staff discount savings
  const totalDiscountSavings = sumField(bookings, "staff_discount_amount");

  // New: cost-per-trip metrics
  const costPerTrip = bookings.length > 0 ? totalSpent / bookings.length : 0;
  const avgRodFee = bookings.length > 0 ? totalRodFees / bookings.length : 0;

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

  // Membership payments — with initiation vs dues split and platform fee
  const { data: membershipPayments } = await admin
    .from("membership_payments")
    .select("id, amount, total_charged, processing_fee, type, status, created_at, clubs(name)")
    .eq("user_id", userId)
    .eq("status", "succeeded")
    .order("created_at", { ascending: false })
    .limit(50);

  const payments = membershipPayments ?? [];
  const totalMembershipDues = payments.reduce(
    (sum: number, p: Record<string, unknown>) => sum + ((p.total_charged as number) ?? (p.amount as number) ?? 0),
    0
  );

  // Initiation vs dues breakdown
  const initiationPayments = payments.filter((p: Record<string, unknown>) => p.type === "initiation_fee");
  const duesOnlyPayments = payments.filter((p: Record<string, unknown>) => p.type === "annual_dues");
  const totalInitiationFees = initiationPayments.reduce(
    (sum: number, p: Record<string, unknown>) => sum + ((p.total_charged as number) ?? (p.amount as number) ?? 0), 0
  );
  const totalAnnualDues = duesOnlyPayments.reduce(
    (sum: number, p: Record<string, unknown>) => sum + ((p.total_charged as number) ?? (p.amount as number) ?? 0), 0
  );
  const totalProcessingFees = payments.reduce(
    (sum: number, p: Record<string, unknown>) => sum + ((p.processing_fee as number) ?? 0), 0
  );

  const monthly = aggregateMonthly(bookings, "total_amount");

  return {
    total_spent: totalSpent,
    period_spent: periodSpent,
    total_rod_fees: totalRodFees,
    total_platform_fees: totalPlatformFees,
    total_guide_fees: totalGuideFees,
    total_guide_rates: totalGuideRates,
    total_guide_service_fees: totalGuideServiceFees,
    total_cross_club_fees: totalCrossClubFees,
    total_membership_dues: totalMembershipDues,
    total_bookings: bookings.length,
    period_bookings: periodBookings.length,
    // New: initiation vs dues breakdown
    total_initiation_fees: totalInitiationFees,
    total_annual_dues: totalAnnualDues,
    total_processing_fees: totalProcessingFees,
    // New: refund tracking
    total_refunds_received: totalRefundsReceived,
    period_refunds: periodRefunds,
    total_cancellations: cancelledBookings.length,
    period_cancellations: periodCancelled.length,
    // New: late cancel fees
    total_late_cancel_fees: totalLateCancelFees,
    period_late_cancel_fees: periodLateCancelFees,
    // New: discount savings
    total_discount_savings: totalDiscountSavings,
    // New: cost metrics
    cost_per_trip: roundCurrency(costPerTrip),
    avg_rod_fee: roundCurrency(avgRodFee),
    spending_by_property: Object.values(propMap).sort((a, b) => b.total_amount - a.total_amount),
    monthly_spending: monthly,
    recent_transactions: allBookings.slice(0, 25).map((b: Record<string, unknown>) => ({
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
      refund_amount: b.refund_amount,
      late_cancel_fee: b.late_cancel_fee,
      created_at: b.created_at,
    })),
    membership_payments: payments.map((p: Record<string, unknown>) => ({
      id: p.id,
      type: p.type,
      amount: p.total_charged ?? p.amount,
      processing_fee: p.processing_fee,
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
      "id, status, booking_date, created_at, base_rate, platform_fee, cross_club_fee, home_club_referral, guide_rate, guide_service_fee, guide_payout, club_commission, landowner_payout, total_amount, rod_count, property_id, property_classification, pricing_mode, properties(name, owner_id, profiles!properties_owner_id_fkey(display_name))"
    )
    .in("status", ["confirmed", "completed"])
    .order("created_at", { ascending: false });

  const bookings = allBookings ?? [];
  const periodBookings = bookings.filter(
    (b: { created_at: string }) => b.created_at >= since
  );

  // Platform revenue streams
  //
  // IMPORTANT: cross_club_fee is the full $25/rod/day charged to the angler,
  // but $10 of that is the referring-club referral (home_club_referral). AP
  // only keeps $15. For AP revenue we must subtract the referral payout.
  const platformFeeTotal = sumField(bookings, "platform_fee");
  const crossClubFeeTotal = sumField(bookings, "cross_club_fee");
  const crossClubReferralTotal = sumField(bookings, "home_club_referral");
  const crossClubApShareTotal = roundCurrency(crossClubFeeTotal - crossClubReferralTotal);
  const guideServiceFeeTotal = sumField(bookings, "guide_service_fee");
  const platformRevenueTotal = platformFeeTotal + crossClubApShareTotal + guideServiceFeeTotal;

  const platformFeePeriod = sumField(periodBookings, "platform_fee");
  const crossClubFeePeriod = sumField(periodBookings, "cross_club_fee");
  const crossClubReferralPeriod = sumField(periodBookings, "home_club_referral");
  const crossClubApSharePeriod = roundCurrency(crossClubFeePeriod - crossClubReferralPeriod);
  const guideServiceFeePeriod = sumField(periodBookings, "guide_service_fee");
  const platformRevenuePeriod = platformFeePeriod + crossClubApSharePeriod + guideServiceFeePeriod;

  // GMV
  const gmvTotal = sumField(bookings, "total_amount");
  const gmvPeriod = sumField(periodBookings, "total_amount");

  // Payout obligations
  const landownerPayoutsTotal = sumField(bookings, "landowner_payout");
  const clubPayoutsTotal = sumField(bookings, "club_commission");
  const guidePayoutsTotal = sumField(bookings, "guide_payout");

  // Revenue by month
  const monthlyRevenue: Record<string, { month: string; platform_fee: number; cross_club_fee: number; guide_service_fee: number; lease_facilitation_fee: number; total: number }> = {};
  for (const b of bookings) {
    const month = (b.created_at as string).slice(0, 7); // YYYY-MM
    if (!monthlyRevenue[month]) {
      monthlyRevenue[month] = { month, platform_fee: 0, cross_club_fee: 0, guide_service_fee: 0, lease_facilitation_fee: 0, total: 0 };
    }
    monthlyRevenue[month].platform_fee += (b.platform_fee as number) ?? 0;
    const ccFee = (b.cross_club_fee as number) ?? 0;
    const ccReferral = (b.home_club_referral as number) ?? 0;
    const ccApShare = ccFee - ccReferral;
    monthlyRevenue[month].cross_club_fee += ccApShare;
    monthlyRevenue[month].guide_service_fee += (b.guide_service_fee as number) ?? 0;
    monthlyRevenue[month].total +=
      ((b.platform_fee as number) ?? 0) +
      ccApShare +
      ((b.guide_service_fee as number) ?? 0);
  }

  // Classification mix & pricing-mode split from bookings
  const clsMap: Record<string, { classification: string; bookings: number; gmv: number; platform_fee: number }> = {};
  let rodFeeSplitBookings = 0;
  let rodFeeSplitGmv = 0;
  let leaseBookings = 0;
  let leaseGmv = 0;
  for (const b of bookings) {
    const isLease = b.pricing_mode === "upfront_lease";
    const key = isLease ? "lease" : ((b.property_classification as string | null) ?? "unclassified");
    if (!clsMap[key]) {
      clsMap[key] = { classification: key, bookings: 0, gmv: 0, platform_fee: 0 };
    }
    const gmv = (b.total_amount as number) ?? 0;
    const bCcFee = (b.cross_club_fee as number) ?? 0;
    const bCcRef = (b.home_club_referral as number) ?? 0;
    const fee =
      ((b.platform_fee as number) ?? 0) +
      (bCcFee - bCcRef) +
      ((b.guide_service_fee as number) ?? 0);
    clsMap[key].bookings += 1;
    clsMap[key].gmv += gmv;
    clsMap[key].platform_fee += fee;
    if (isLease) {
      leaseBookings += 1;
      leaseGmv += gmv;
    } else {
      rodFeeSplitBookings += 1;
      rodFeeSplitGmv += gmv;
    }
  }
  const classificationMix = Object.values(clsMap).map((c) => ({
    ...c,
    gmv: roundCurrency(c.gmv),
    platform_fee: roundCurrency(c.platform_fee),
  }));

  // Top revenue properties
  const propMap: Record<string, { name: string; gmv: number; platform_revenue: number; bookings: number }> = {};
  for (const b of bookings) {
    const pname = (b.properties as { name: string } | null)?.name ?? "Unknown";
    if (!propMap[pname]) {
      propMap[pname] = { name: pname, gmv: 0, platform_revenue: 0, bookings: 0 };
    }
    propMap[pname].gmv += (b.total_amount as number) ?? 0;
    const pCcFee = (b.cross_club_fee as number) ?? 0;
    const pCcRef = (b.home_club_referral as number) ?? 0;
    propMap[pname].platform_revenue +=
      ((b.platform_fee as number) ?? 0) +
      (pCcFee - pCcRef) +
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

  // Lease payments — platform facilitation revenue
  const { data: allLeasePayments } = await admin
    .from("property_lease_payments")
    .select("id, property_id, club_id, amount_cents, platform_fee_cents, landowner_net_cents, status, period_start, period_end, paid_at, created_at, properties(name), clubs(name)")
    .eq("status", "succeeded")
    .order("paid_at", { ascending: false });

  const leasePayments = allLeasePayments ?? [];
  const leaseFacilitationFeeTotal = leasePayments.reduce(
    (sum: number, p: Record<string, unknown>) => sum + ((p.platform_fee_cents as number) ?? 0) / 100,
    0
  );
  const leasePayoutsTotal = leasePayments.reduce(
    (sum: number, p: Record<string, unknown>) => sum + ((p.landowner_net_cents as number) ?? 0) / 100,
    0
  );
  const periodLeasePayments = leasePayments.filter(
    (p: Record<string, unknown>) => (p.created_at as string) >= since
  );
  const leaseFacilitationFeePeriod = periodLeasePayments.reduce(
    (sum: number, p: Record<string, unknown>) => sum + ((p.platform_fee_cents as number) ?? 0) / 100,
    0
  );

  // Attribute lease facilitation fees to month buckets (by paid_at or created_at)
  for (const p of leasePayments) {
    const dateStr = (p.paid_at as string | null) ?? (p.created_at as string);
    if (!dateStr) continue;
    const month = dateStr.slice(0, 7);
    if (!monthlyRevenue[month]) {
      monthlyRevenue[month] = { month, platform_fee: 0, cross_club_fee: 0, guide_service_fee: 0, lease_facilitation_fee: 0, total: 0 };
    }
    const fee = ((p.platform_fee_cents as number) ?? 0) / 100;
    monthlyRevenue[month].lease_facilitation_fee += fee;
    monthlyRevenue[month].total += fee;
  }

  // Membership processing fees for the period
  const periodMemberPayments = memberPayments.filter(
    (p: Record<string, unknown>) => (p.created_at as string) >= since
  );
  const membershipProcessingFeesPeriod = periodMemberPayments.reduce(
    (sum: number, p: Record<string, unknown>) => sum + ((p.processing_fee as number) ?? 0), 0
  );

  // Roll lease facilitation + membership processing into headline platform revenue
  const platformRevenueTotalWithLease = platformRevenueTotal + leaseFacilitationFeeTotal + membershipProcessingFees;
  const platformRevenuePeriodWithLease = platformRevenuePeriod + leaseFacilitationFeePeriod + membershipProcessingFeesPeriod;

  return {
    platform_revenue_total: roundCurrency(platformRevenueTotalWithLease),
    platform_revenue_period: roundCurrency(platformRevenuePeriodWithLease),
    platform_fee_total: roundCurrency(platformFeeTotal),
    cross_club_fee_total: roundCurrency(crossClubApShareTotal),
    cross_club_fee_gross: roundCurrency(crossClubFeeTotal),
    cross_club_referral_total: roundCurrency(crossClubReferralTotal),
    guide_service_fee_total: roundCurrency(guideServiceFeeTotal),
    gmv_total: roundCurrency(gmvTotal),
    gmv_period: roundCurrency(gmvPeriod),
    landowner_payouts_total: roundCurrency(landownerPayoutsTotal),
    club_payouts_total: roundCurrency(clubPayoutsTotal),
    guide_payouts_total: roundCurrency(guidePayoutsTotal),
    total_bookings: bookings.length,
    period_bookings: periodBookings.length,
    membership_gmv: membershipGmv,
    membership_processing_fees: roundCurrency(membershipProcessingFees),
    lease_facilitation_fee_total: roundCurrency(leaseFacilitationFeeTotal),
    lease_facilitation_fee_period: roundCurrency(leaseFacilitationFeePeriod),
    lease_payouts_total: roundCurrency(leasePayoutsTotal),
    lease_payment_count: leasePayments.length,
    classification_mix: classificationMix,
    pricing_mode_split: {
      rod_fee_split: { bookings: rodFeeSplitBookings, gmv: roundCurrency(rodFeeSplitGmv) },
      upfront_lease: { bookings: leaseBookings, gmv: roundCurrency(leaseGmv) },
    },
    recent_lease_payments: leasePayments.slice(0, 10).map((p: Record<string, unknown>) => ({
      id: p.id,
      property_name: (p.properties as { name: string } | null)?.name ?? "Unknown",
      club_name: (p.clubs as { name: string } | null)?.name,
      amount: roundCurrency(((p.amount_cents as number) ?? 0) / 100),
      platform_fee: roundCurrency(((p.platform_fee_cents as number) ?? 0) / 100),
      landowner_net: roundCurrency(((p.landowner_net_cents as number) ?? 0) / 100),
      period_start: p.period_start,
      period_end: p.period_end,
      paid_at: p.paid_at,
    })),
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
    .map(([month, amount]) => ({ month, amount: roundCurrency(amount) }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12);
}
