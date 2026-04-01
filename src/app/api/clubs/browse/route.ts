import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { escapeIlike } from "@/lib/api/helpers";

// GET: Browse/search clubs (for anglers looking to join)
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const location = searchParams.get("location")?.trim() ?? "";

    const admin = createAdminClient();

    // Get clubs the user is already a member of (to exclude or mark)
    const { data: existingMemberships } = await admin
      .from("club_memberships")
      .select("club_id, status")
      .eq("user_id", user.id);

    const memberClubIds = new Set(
      (existingMemberships ?? []).map((m) => m.club_id)
    );
    const membershipStatusMap = new Map(
      (existingMemberships ?? []).map((m) => [m.club_id, m.status])
    );

    // Fetch all clubs with member counts
    let query = admin
      .from("clubs")
      .select("id, name, description, location, logo_url, created_at")
      .order("name", { ascending: true })
      .limit(50);

    // Apply search filter with proper ilike escaping
    if (q) {
      const safeQ = escapeIlike(q);
      query = query.or(
        `name.ilike.%${safeQ}%,description.ilike.%${safeQ}%`
      );
    }

    if (location) {
      const safeLoc = escapeIlike(location);
      query = query.ilike("location", `%${safeLoc}%`);
    }

    const { data: clubs, error } = await query;

    if (error) {
      console.error("[clubs/browse] Query error:", error);
      return NextResponse.json(
        { error: "Failed to search clubs" },
        { status: 500 }
      );
    }

    // Get member counts for each club
    const clubIds = (clubs ?? []).map((c) => c.id);
    const { data: countData } = await admin
      .from("club_memberships")
      .select("club_id")
      .in("club_id", clubIds)
      .eq("status", "active");

    const memberCounts = new Map<string, number>();
    for (const row of countData ?? []) {
      memberCounts.set(row.club_id, (memberCounts.get(row.club_id) ?? 0) + 1);
    }

    // Enrich clubs with membership status and member count
    const enrichedClubs = (clubs ?? []).map((club) => ({
      ...club,
      member_count: memberCounts.get(club.id) ?? 0,
      membership_status: membershipStatusMap.get(club.id) ?? null,
      is_member: memberClubIds.has(club.id),
    }));

    return NextResponse.json({ clubs: enrichedClubs });
  } catch (err) {
    console.error("[clubs/browse] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
