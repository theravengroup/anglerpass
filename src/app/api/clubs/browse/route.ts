import { createAdminClient } from "@/lib/supabase/admin";
import { escapeIlike, jsonError, jsonOk, requireAuth} from "@/lib/api/helpers";

// GET: Browse/search clubs (for anglers looking to join)
export async function GET(request: Request) {
  try {
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const location = searchParams.get("location")?.trim() ?? "";
    const nearMe = searchParams.get("near_me") === "true";

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

    // If near_me is set, use the angler's profile location for fuzzy matching
    let locationFilter = location;
    if (nearMe && !location) {
      const { data: profile } = await admin
        .from("profiles")
        .select("location")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.location) {
        // Extract meaningful location parts (city, state, region)
        // e.g. "Denver, CO" → search for "Denver" and "CO" separately
        const parts = (profile.location as string)
          .split(/[,\s]+/)
          .filter((p) => p.length > 1);
        if (parts.length > 0) {
          locationFilter = parts.join(" ");
        }
      }
    }

    if (locationFilter) {
      // Fuzzy match: split into terms and OR-match each against location
      const terms = locationFilter
        .split(/[,\s]+/)
        .filter((t) => t.length > 1)
        .map((t) => escapeIlike(t));

      if (terms.length > 0) {
        const locationOr = terms.map((t) => `location.ilike.%${t}%`).join(",");
        query = query.or(locationOr);
      }
    }

    const { data: clubs, error } = await query;

    if (error) {
      console.error("[clubs/browse] Query error:", error);
      return jsonError("Failed to search clubs", 500);
    }

    // Get member counts for each club
    const clubIds = (clubs ?? []).map((c) => c.id);
    const memberCounts = new Map<string, number>();

    if (clubIds.length > 0) {
      const { data: countData } = await admin
        .from("club_memberships")
        .select("club_id")
        .in("club_id", clubIds)
        .eq("status", "active");

      for (const row of countData ?? []) {
        memberCounts.set(row.club_id, (memberCounts.get(row.club_id) ?? 0) + 1);
      }
    }

    // Enrich clubs with membership status and member count
    const enrichedClubs = (clubs ?? []).map((club) => ({
      ...club,
      member_count: memberCounts.get(club.id) ?? 0,
      membership_status: membershipStatusMap.get(club.id) ?? null,
      is_member: memberClubIds.has(club.id),
    }));

    return jsonOk({ clubs: enrichedClubs });
  } catch (err) {
    console.error("[clubs/browse] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}
