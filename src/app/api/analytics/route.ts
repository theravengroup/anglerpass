import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// GET: Fetch analytics for the current user's role
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
    const view = searchParams.get("view"); // landowner, club, angler, admin
    const days = parseInt(searchParams.get("days") ?? "30", 10);

    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceISO = since.toISOString();

    switch (view) {
      case "landowner":
        return NextResponse.json(
          await getLandownerAnalytics(admin, user.id, sinceISO)
        );

      case "angler":
        return NextResponse.json(
          await getAnglerAnalytics(admin, user.id, sinceISO)
        );

      case "admin": {
        // Verify admin role
        const { data: profile } = await admin
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile?.role !== "admin") {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        return NextResponse.json(
          await getAdminAnalytics(admin, sinceISO)
        );
      }

      default:
        return NextResponse.json(
          { error: "Invalid view parameter" },
          { status: 400 }
        );
    }
  } catch (err) {
    console.error("[analytics] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getLandownerAnalytics(admin: any, userId: string, since: string) {
  // Properties
  const { data: properties } = await admin
    .from("properties")
    .select("id, name, status")
    .eq("owner_id", userId);

  const propertyIds = (properties ?? []).map((p: { id: string }) => p.id);
  const publishedCount = (properties ?? []).filter(
    (p: { status: string }) => p.status === "published"
  ).length;

  if (propertyIds.length === 0) {
    return {
      properties_total: 0,
      properties_published: 0,
      bookings_total: 0,
      bookings_pending: 0,
      bookings_confirmed: 0,
      bookings_period: 0,
      revenue_total: 0,
      revenue_period: 0,
      conversion_rate: 0,
      recent_bookings: [],
      revenue_by_property: [],
    };
  }

  // All bookings for these properties
  const { data: allBookings } = await admin
    .from("bookings")
    .select("id, status, base_rate, total_amount, booking_date, created_at, property_id, properties(name), profiles!bookings_angler_id_fkey(display_name)")
    .in("property_id", propertyIds)
    .order("created_at", { ascending: false });

  const bookings = allBookings ?? [];

  const pending = bookings.filter((b: { status: string }) => b.status === "pending").length;
  const confirmed = bookings.filter((b: { status: string }) => b.status === "confirmed").length;
  const completed = bookings.filter(
    (b: { status: string }) => b.status === "confirmed" || b.status === "completed"
  );

  const revenueTotal = completed.reduce(
    (sum: number, b: { base_rate: number }) => sum + (b.base_rate ?? 0),
    0
  );

  const periodBookings = bookings.filter(
    (b: { created_at: string }) => b.created_at >= since
  );
  const periodRevenue = periodBookings
    .filter((b: { status: string }) => b.status === "confirmed" || b.status === "completed")
    .reduce((sum: number, b: { base_rate: number }) => sum + (b.base_rate ?? 0), 0);

  // Conversion rate: confirmed / (confirmed + declined)
  const decided = bookings.filter(
    (b: { status: string }) => b.status === "confirmed" || b.status === "declined"
  ).length;
  const conversionRate = decided > 0
    ? Math.round((confirmed / decided) * 100)
    : 0;

  // Revenue by property
  const revenueMap: Record<string, { name: string; revenue: number; bookings: number }> = {};
  for (const b of completed) {
    const pid = b.property_id;
    const pname = (b.properties as { name: string } | null)?.name ?? "Unknown";
    if (!revenueMap[pid]) {
      revenueMap[pid] = { name: pname, revenue: 0, bookings: 0 };
    }
    revenueMap[pid].revenue += b.base_rate ?? 0;
    revenueMap[pid].bookings += 1;
  }

  return {
    properties_total: properties?.length ?? 0,
    properties_published: publishedCount,
    bookings_total: bookings.length,
    bookings_pending: pending,
    bookings_confirmed: confirmed,
    bookings_period: periodBookings.length,
    revenue_total: revenueTotal,
    revenue_period: periodRevenue,
    conversion_rate: conversionRate,
    recent_bookings: bookings.slice(0, 10).map((b: Record<string, unknown>) => ({
      id: b.id,
      status: b.status,
      booking_date: b.booking_date,
      base_rate: b.base_rate,
      property_name: (b.properties as { name: string } | null)?.name,
      angler_name: (b.profiles as { display_name: string | null } | null)?.display_name,
      created_at: b.created_at,
    })),
    revenue_by_property: Object.values(revenueMap).sort(
      (a, b) => b.revenue - a.revenue
    ),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getAnglerAnalytics(admin: any, userId: string, since: string) {
  const { data: bookings } = await admin
    .from("bookings")
    .select("id, status, booking_date, total_amount, base_rate, duration, party_size, created_at, properties(name, water_type)")
    .eq("angler_id", userId)
    .order("booking_date", { ascending: false });

  const all = bookings ?? [];

  const upcoming = all.filter(
    (b: { status: string; booking_date: string }) =>
      ["pending", "confirmed"].includes(b.status) &&
      new Date(b.booking_date) >= new Date()
  );

  const completed = all.filter(
    (b: { status: string }) => b.status === "confirmed" || b.status === "completed"
  );

  const totalSpent = completed.reduce(
    (sum: number, b: { total_amount: number }) => sum + (b.total_amount ?? 0),
    0
  );

  const periodBookings = all.filter(
    (b: { created_at: string }) => b.created_at >= since
  );

  // Favorite properties (most booked)
  const propCount: Record<string, { name: string; count: number; water_type: string | null }> = {};
  for (const b of all) {
    const pname = (b.properties as { name: string; water_type: string | null } | null)?.name ?? "Unknown";
    const wtype = (b.properties as { name: string; water_type: string | null } | null)?.water_type ?? null;
    if (!propCount[pname]) {
      propCount[pname] = { name: pname, count: 0, water_type: wtype };
    }
    propCount[pname].count += 1;
  }

  // Memberships
  const { count: membershipCount } = await admin
    .from("club_memberships")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "active");

  return {
    trips_total: all.length,
    trips_upcoming: upcoming.length,
    trips_period: periodBookings.length,
    total_spent: totalSpent,
    memberships: membershipCount ?? 0,
    favorite_properties: Object.values(propCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    recent_bookings: all.slice(0, 10).map((b: Record<string, unknown>) => ({
      id: b.id,
      status: b.status,
      booking_date: b.booking_date,
      total_amount: b.total_amount,
      duration: b.duration,
      property_name: (b.properties as { name: string } | null)?.name,
      created_at: b.created_at,
    })),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getAdminAnalytics(admin: any, since: string) {
  // Counts in parallel
  const [
    { count: usersTotal },
    { count: usersNew },
    { count: propertiesTotal },
    { count: propertiesPublished },
    { count: pendingReview },
    { count: bookingsTotal },
    { count: bookingsPeriod },
    { count: clubsTotal },
    { count: leadsTotal },
    { count: leadsPeriod },
  ] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", since),
    admin.from("properties").select("id", { count: "exact", head: true }),
    admin.from("properties").select("id", { count: "exact", head: true }).eq("status", "published"),
    admin.from("properties").select("id", { count: "exact", head: true }).eq("status", "pending_review"),
    admin.from("bookings").select("id", { count: "exact", head: true }),
    admin.from("bookings").select("id", { count: "exact", head: true }).gte("created_at", since),
    admin.from("clubs").select("id", { count: "exact", head: true }),
    admin.from("leads").select("id", { count: "exact", head: true }),
    admin.from("leads").select("id", { count: "exact", head: true }).gte("created_at", since),
  ]);

  // Revenue
  const { data: confirmedBookings } = await admin
    .from("bookings")
    .select("base_rate, platform_fee, total_amount, created_at")
    .in("status", ["confirmed", "completed"]);

  const allConfirmed = confirmedBookings ?? [];
  const revenueTotal = allConfirmed.reduce(
    (sum: number, b: { platform_fee: number }) => sum + (b.platform_fee ?? 0),
    0
  );
  const gmvTotal = allConfirmed.reduce(
    (sum: number, b: { total_amount: number }) => sum + (b.total_amount ?? 0),
    0
  );
  const periodConfirmed = allConfirmed.filter(
    (b: { created_at: string }) => b.created_at >= since
  );
  const revenuePeriod = periodConfirmed.reduce(
    (sum: number, b: { platform_fee: number }) => sum + (b.platform_fee ?? 0),
    0
  );

  // Role breakdown
  const { data: roleData } = await admin
    .from("profiles")
    .select("role");

  const roleCounts: Record<string, number> = {};
  for (const r of roleData ?? []) {
    roleCounts[r.role] = (roleCounts[r.role] ?? 0) + 1;
  }

  // Recent activity (last 10 bookings)
  const { data: recentBookings } = await admin
    .from("bookings")
    .select("id, status, booking_date, total_amount, created_at, properties(name), profiles!bookings_angler_id_fkey(display_name)")
    .order("created_at", { ascending: false })
    .limit(10);

  return {
    users_total: usersTotal ?? 0,
    users_new: usersNew ?? 0,
    users_by_role: roleCounts,
    properties_total: propertiesTotal ?? 0,
    properties_published: propertiesPublished ?? 0,
    pending_review: pendingReview ?? 0,
    bookings_total: bookingsTotal ?? 0,
    bookings_period: bookingsPeriod ?? 0,
    clubs_total: clubsTotal ?? 0,
    leads_total: leadsTotal ?? 0,
    leads_period: leadsPeriod ?? 0,
    platform_revenue: revenueTotal,
    platform_revenue_period: revenuePeriod,
    gmv_total: gmvTotal,
    recent_bookings: (recentBookings ?? []).map((b: Record<string, unknown>) => ({
      id: b.id,
      status: b.status,
      booking_date: b.booking_date,
      total_amount: b.total_amount,
      property_name: (b.properties as { name: string } | null)?.name,
      angler_name: (b.profiles as { display_name: string | null } | null)?.display_name,
      created_at: b.created_at,
    })),
  };
}
