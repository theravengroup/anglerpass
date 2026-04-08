import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createHash } from "crypto";

/** Deterministic UUID from a seed string — idempotent across runs */
function sid(seed: string): string {
  const h = createHash("sha256").update(`anglerpass-press-${seed}`).digest("hex");
  return [
    h.slice(0, 8),
    h.slice(8, 12),
    "4" + h.slice(13, 16),
    ((parseInt(h[16], 16) & 0x3) | 0x8).toString(16) + h.slice(17, 20),
    h.slice(20, 32),
  ].join("-");
}

/**
 * Dev-only: seeds realistic demo data for press kit screenshots.
 * Idempotent — safe to run multiple times.
 *
 * GET /api/dev/seed-press-kit
 */
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const admin = createAdminClient();

  // ── Find the dev test user ──────────────────────────────────────
  const { data: listData } = await admin.auth.admin.listUsers();
  const devUser = listData?.users?.find(
    (u) => u.email === "dev-test@anglerpass.local"
  );
  if (!devUser) {
    return NextResponse.json(
      { error: "Dev test user not found. Hit /api/dev/login first." },
      { status: 400 }
    );
  }
  const DEV = devUser.id;

  // ── Fake users ──────────────────────────────────────────────────
  const fakeUsers = [
    { email: "jake.rivers@demo.local", name: "Jake Rivers", role: "angler" },
    { email: "sarah.brook@demo.local", name: "Sarah Brook", role: "angler" },
    { email: "mike.stonefly@demo.local", name: "Mike Stonefly", role: "angler" },
    { email: "emma.hatch@demo.local", name: "Emma Hatch", role: "angler" },
    { email: "tom.riffle@demo.local", name: "Tom Riffle", role: "angler" },
    { email: "lisa.mayfly@demo.local", name: "Lisa Mayfly", role: "angler" },
    { email: "ben.cutthroat@demo.local", name: "Ben Cutthroat", role: "angler" },
    { email: "anna.tippet@demo.local", name: "Anna Tippet", role: "angler" },
    { email: "chris.eddy@demo.local", name: "Chris Eddy", role: "angler" },
    { email: "rachel.caddis@demo.local", name: "Rachel Caddis", role: "angler" },
    { email: "david.rancher@demo.local", name: "David Whitfield", role: "landowner" },
    { email: "mark.clubadmin@demo.local", name: "Mark Patterson", role: "club_admin" },
  ].map((u) => ({ ...u, id: "" })); // id filled from auth below

  // Create or find auth users
  const { data: allUsers } = await admin.auth.admin.listUsers();
  const existingByEmail = new Map(
    allUsers?.users?.map((u) => [u.email, u.id]) ?? []
  );

  for (const u of fakeUsers) {
    const existing = existingByEmail.get(u.email);
    if (existing) {
      u.id = existing;
    } else {
      const { data } = await admin.auth.admin.createUser({
        email: u.email,
        password: "demo-password-2024",
        email_confirm: true,
        user_metadata: { full_name: u.name },
      });
      u.id = data?.user?.id ?? "";
    }
  }

  // Upsert profiles
  for (const u of fakeUsers) {
    if (!u.id) continue;
    await admin.from("profiles").upsert(
      { id: u.id, display_name: u.name, role: u.role, roles: [u.role] },
      { onConflict: "id" }
    );
  }

  // Dev user: all roles + Stripe bypass
  await admin
    .from("profiles")
    .update({
      roles: ["admin", "landowner", "club_admin", "angler", "guide"],
      stripe_connect_account_id: "acct_demo_dev_user",
      stripe_connect_onboarded: true,
    })
    .eq("id", DEV);

  const anglers = fakeUsers.filter((u) => u.role === "angler");
  const landowner2 = fakeUsers.find((u) => u.name === "David Whitfield")!;
  const clubAdmin2 = fakeUsers.find((u) => u.name === "Mark Patterson")!;

  // ── Properties ──────────────────────────────────────────────────
  const properties = [
    {
      id: sid("prop-elk-creek"),
      owner_id: DEV,
      name: "Elk Creek Ranch",
      status: "published",
      description: "Three miles of private spring creek winding through pristine meadows. Trophy brown trout average 18-22 inches. Strict catch-and-release, barbless hooks only.",
      location_description: "Paradise Valley, Montana",
      water_type: "spring_creek",
      species: ["brown_trout", "rainbow_trout"],
      photos: [] as string[],
      max_rods: 4, max_guests: 6,
      rate_adult_full_day: 350, rate_adult_half_day: 200, half_day_allowed: true,
      water_miles: 3.2, latitude: 45.4, longitude: -110.65,
      access_notes: "Turn left at mile marker 42. Gate code provided morning of trip.",
      gate_code_required: true, gate_code: "4821",
    },
    {
      id: sid("prop-bitterroot"),
      owner_id: DEV,
      name: "Bitterroot Bend",
      status: "published",
      description: "Two miles of the Bitterroot River's best dry-fly water. Prolific hatches from May through October. Wading access with gravel bars.",
      location_description: "Hamilton, Montana",
      water_type: "river",
      species: ["rainbow_trout", "cutthroat_trout", "brown_trout"],
      photos: [] as string[],
      max_rods: 6, max_guests: 8,
      rate_adult_full_day: 275, rate_adult_half_day: 175, half_day_allowed: true,
      water_miles: 2.1, latitude: 46.25, longitude: -114.16,
      access_notes: "Park at the barn and walk downstream to the first riffle.",
      gate_code_required: false,
    },
    {
      id: sid("prop-silver-lake"),
      owner_id: DEV,
      name: "Silver Lake Preserve",
      status: "published",
      description: "A 40-acre alpine lake stocked with trophy rainbows and brookies. Float tubes welcome. Surrounded by national forest with mountain views.",
      location_description: "McCall, Idaho",
      water_type: "lake",
      species: ["rainbow_trout", "brook_trout"],
      photos: [] as string[],
      max_rods: 4, max_guests: 6,
      rate_adult_full_day: 225, half_day_allowed: false,
      latitude: 44.73, longitude: -116.1,
      access_notes: "4WD recommended for the last 2 miles of dirt road.",
      gate_code_required: true, gate_code: "7739",
    },
  ];

  const otherProperties = [
    {
      id: sid("prop-frying-pan"),
      owner_id: landowner2.id,
      name: "Frying Pan Tailwater",
      status: "published",
      description: "Half a mile of premium tailwater below Ruedi Reservoir. Year-round fishing with giant rainbows. Gold-medal water.",
      location_description: "Basalt, Colorado",
      water_type: "tailwater",
      species: ["rainbow_trout", "brown_trout"],
      photos: [] as string[],
      max_rods: 3, max_guests: 4,
      rate_adult_full_day: 425, rate_adult_half_day: 250, half_day_allowed: true,
      water_miles: 0.5, latitude: 39.37, longitude: -106.84,
      access_notes: "Meet at the parking area below the dam.",
      gate_code_required: false,
    },
    {
      id: sid("prop-willow-creek"),
      owner_id: landowner2.id,
      name: "Willow Creek Meadows",
      status: "published",
      description: "A hidden gem — small stream fishing for wild cutthroat in a high-country meadow. Sight-fishing with dry flies at its finest.",
      location_description: "Jackson, Wyoming",
      water_type: "stream",
      species: ["cutthroat_trout"],
      photos: [] as string[],
      max_rods: 2, max_guests: 3,
      rate_adult_full_day: 300, half_day_allowed: false,
      latitude: 43.48, longitude: -110.76,
      access_notes: "Hike 1.5 miles from trailhead. Waders not needed — wet wade in summer.",
      gate_code_required: false,
    },
  ];

  const allProperties = [...properties, ...otherProperties];
  const stableIds = allProperties.map((p) => p.id);

  // Delete stale properties from earlier non-idempotent seed runs
  const { data: existingProps } = await admin
    .from("properties")
    .select("id")
    .in("owner_id", [DEV, landowner2.id].filter(Boolean));

  const staleIds = (existingProps ?? [])
    .map((p) => p.id)
    .filter((id) => !stableIds.includes(id));

  if (staleIds.length > 0) {
    // Delete bookings referencing stale properties first (FK constraint)
    await admin.from("bookings").delete().in("property_id", staleIds);
    await admin.from("club_property_access").delete().in("property_id", staleIds);
    await admin.from("properties").delete().in("id", staleIds);
  }

  for (const p of allProperties) {
    await admin.from("properties").upsert(p as Record<string, unknown>, { onConflict: "id" });
  }

  // ── Clubs ───────────────────────────────────────────────────────
  const CLUB1 = sid("club-yva");
  const CLUB2 = sid("club-mrc");

  // Delete ALL old clubs owned by dev user first (including stale duplicates),
  // then re-insert the stable one. This ensures maybeSingle() works.
  await admin.from("clubs").delete().eq("owner_id", DEV);
  // Also clean up any old clubs from the other demo admin
  if (clubAdmin2.id) {
    await admin.from("clubs").delete().eq("owner_id", clubAdmin2.id);
  }

  await admin.from("clubs").insert({
    id: CLUB1,
    owner_id: DEV,
    name: "Yellowstone Valley Anglers",
    description: "A private fly fishing club with access to premium waters across Paradise Valley and the greater Yellowstone ecosystem.",
    location: "Livingston, Montana",
    subscription_tier: "pro",
    initiation_fee: 500,
    annual_dues: 350,
    membership_application_required: true,
    stripe_subscription_id: "sub_demo_yva",
    stripe_connect_account_id: "acct_demo_yva",
    stripe_connect_onboarded: true,
  } as Record<string, unknown>);

  await admin.from("clubs").insert({
    id: CLUB2,
    owner_id: clubAdmin2.id,
    name: "Madison River Conservancy",
    description: "Dedicated to conservation and access on the Madison River corridor. Members enjoy exclusive fishing on private ranches.",
    location: "Ennis, Montana",
    subscription_tier: "standard",
    initiation_fee: 250,
    annual_dues: 200,
    membership_application_required: true,
  } as Record<string, unknown>);

  // ── Club ↔ Property access ─────────────────────────────────────
  const accessRecords = [
    ...properties.map((p) => ({
      id: sid(`access-c1-${p.name}`),
      club_id: CLUB1,
      property_id: p.id,
      status: "approved",
      requested_by: DEV,
      approved_at: new Date().toISOString(),
    })),
    ...otherProperties.map((p) => ({
      id: sid(`access-c2-${p.name}`),
      club_id: CLUB2,
      property_id: p.id,
      status: "approved",
      requested_by: clubAdmin2.id,
      approved_at: new Date().toISOString(),
    })),
    {
      id: sid("access-c2-elk-cross"),
      club_id: CLUB2,
      property_id: properties[0].id,
      status: "approved",
      requested_by: clubAdmin2.id,
      approved_at: new Date().toISOString(),
    },
  ];

  for (const a of accessRecords) {
    await admin.from("club_property_access").upsert(
      a as Record<string, unknown>,
      { onConflict: "club_id,property_id" }
    );
  }

  // ── Memberships ─────────────────────────────────────────────────
  const now = new Date();
  const duesPaidThrough = new Date(now);
  duesPaidThrough.setFullYear(duesPaidThrough.getFullYear() + 1);
  const dpt = duesPaidThrough.toISOString().split("T")[0];
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();

  // Dev user: admin of club 1, member of club 2
  const devClub1 = {
    id: sid("mem-dev-c1"),
    club_id: CLUB1, user_id: DEV,
    role: "admin", status: "active", dues_status: "exempt",
    joined_at: daysAgo(180),
  };
  const devClub2 = {
    id: sid("mem-dev-c2"),
    club_id: CLUB2, user_id: DEV,
    role: "member", status: "active",
    dues_status: "active", dues_paid_through: dpt,
    joined_at: daysAgo(90),
  };

  // Anglers in club 1
  const anglerMems = anglers.map((a, i) => ({
    id: sid(`mem-${a.email}-c1`),
    club_id: CLUB1, user_id: a.id,
    role: "member" as const,
    status: i < 8 ? "active" : "pending",
    dues_status: i < 8 ? "active" : "none",
    dues_paid_through: i < 8 ? dpt : null,
    joined_at: i < 8 ? daysAgo(30 + i * 15) : null,
  }));

  // Some anglers cross-club in club 2
  const crossMems = anglers.slice(0, 3).map((a) => ({
    id: sid(`mem-${a.email}-c2`),
    club_id: CLUB2, user_id: a.id,
    role: "member" as const,
    status: "active", dues_status: "active", dues_paid_through: dpt,
    joined_at: daysAgo(60),
  }));

  const allMems = [devClub1, devClub2, ...anglerMems, ...crossMems];
  for (const m of allMems) {
    await admin.from("club_memberships").upsert(
      m as Record<string, unknown>,
      { onConflict: "club_id,user_id" }
    );
  }

  // ── Bookings ────────────────────────────────────────────────────
  // Delete old demo bookings to avoid constraint conflicts
  const demoAnglerIds = anglers.map((a) => a.id).filter(Boolean);
  if (demoAnglerIds.length > 0) {
    await admin.from("bookings").delete().in("angler_id", [...demoAnglerIds, DEV]);
  }

  const bookings: Record<string, unknown>[] = [];

  function makeBooking(opts: {
    seed: string;
    propId: string;
    anglerId: string;
    memId: string;
    daysOffset: number; // negative = past
    status: string;
    rate: number;
  }) {
    const d = new Date(now.getTime() + opts.daysOffset * 86400000);
    const pf = Math.round(opts.rate * 0.15 * 100) / 100;
    bookings.push({
      id: sid(opts.seed),
      property_id: opts.propId,
      angler_id: opts.anglerId,
      club_membership_id: opts.memId,
      booking_date: d.toISOString().split("T")[0],
      duration: "full_day", party_size: 1, booking_days: 1,
      base_rate: opts.rate,
      platform_fee: pf,
      cross_club_fee: 0, club_commission: 5,
      landowner_payout: opts.rate - 5,
      is_cross_club: false,
      total_amount: opts.rate + pf,
      status: opts.status,
      confirmed_at: d.toISOString(),
    });
  }

  // Past bookings on dev user's properties (landowner dashboard)
  const pastDays = [3, 7, 12, 18, 25, 35, 42, 55];
  pastDays.forEach((d, i) => {
    const a = anglers[i % anglers.length];
    const p = properties[i % properties.length];
    const m = anglerMems.find((mem) => mem.user_id === a.id);
    if (!m) return;
    makeBooking({
      seed: `book-past-${i}`,
      propId: p.id, anglerId: a.id, memId: m.id,
      daysOffset: -d,
      status: i < 6 ? "completed" : "confirmed",
      rate: Number(p.rate_adult_full_day),
    });
  });

  // Upcoming bookings on dev user's properties
  [2, 5, 8, 14].forEach((d, i) => {
    const a = anglers[i + 2];
    const p = properties[i % properties.length];
    const m = anglerMems.find((mem) => mem.user_id === a.id);
    if (!m) return;
    makeBooking({
      seed: `book-future-${i}`,
      propId: p.id, anglerId: a.id, memId: m.id,
      daysOffset: d, status: "confirmed",
      rate: Number(p.rate_adult_full_day),
    });
  });

  // Dev user's own bookings as angler (angler dashboard)
  [
    { d: -5, prop: otherProperties[0], s: "completed" },
    { d: -14, prop: otherProperties[1], s: "completed" },
    { d: -30, prop: otherProperties[0], s: "completed" },
    { d: 3, prop: otherProperties[0], s: "confirmed" },
    { d: 10, prop: otherProperties[1], s: "confirmed" },
  ].forEach((b, i) => {
    makeBooking({
      seed: `book-dev-${i}`,
      propId: b.prop.id, anglerId: DEV, memId: devClub2.id,
      daysOffset: b.d, status: b.s,
      rate: Number(b.prop.rate_adult_full_day),
    });
  });

  let inserted = 0;
  for (const b of bookings) {
    const { error } = await admin.from("bookings").insert(b);
    if (!error) inserted++;
  }

  return NextResponse.json({
    success: true,
    seeded: {
      profiles: fakeUsers.length,
      clubs: 2,
      properties: allProperties.length,
      club_property_access: accessRecords.length,
      club_memberships: allMems.length,
      bookings_inserted: inserted,
    },
    note: "Idempotent — safe to run again. Old demo bookings are cleaned first.",
  });
}
