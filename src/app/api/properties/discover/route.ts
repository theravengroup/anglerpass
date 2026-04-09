import { jsonError, jsonOk, requireAuth} from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { discoverCrossClubProperties } from "@/lib/cross-club";

// GET: Discover properties accessible through the angler's club memberships
// and through the Cross-Club Network
export async function GET(request: Request) {
  try {
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

    const admin = createAdminClient();
    const { searchParams } = new URL(request.url);
    const waterType = searchParams.get("water_type");
    const species = searchParams.get("species");
    const minPrice = searchParams.get("min_price");
    const maxPrice = searchParams.get("max_price");
    const lodging = searchParams.get("lodging");
    const bounds = searchParams.get("bounds"); // "south,west,north,east"

    // Get the user's active club memberships
    const { data: memberships } = await admin
      .from("club_memberships")
      .select("id, club_id, clubs(name)")
      .eq("user_id", user.id)
      .eq("status", "active");

    if (!memberships?.length) {
      return jsonOk({
        properties: [],
        memberships: [],
        message:
          "Join a club to discover available private waters.",
      });
    }

    const clubIds = memberships.map((m) => m.club_id);

    // Get property IDs accessible through these clubs
    const { data: accessRecords } = await admin
      .from("club_property_access")
      .select("property_id, club_id")
      .in("club_id", clubIds)
      .eq("status", "approved");

    // Note: even with no direct access records, the angler may have
    // cross-club access through agreements. We continue to check.

    const directPropertyIds = [
      ...new Set((accessRecords ?? []).map((a) => a.property_id)),
    ];

    // Build a map of property -> clubs for the response
    const propertyClubMap: Record<string, string[]> = {};
    for (const record of (accessRecords ?? [])) {
      if (!propertyClubMap[record.property_id]) {
        propertyClubMap[record.property_id] = [];
      }
      propertyClubMap[record.property_id].push(record.club_id);
    }

    // ── Cross-Club Network discovery ──────────────────────────────
    // Find additional properties reachable through cross-club agreements
    const crossClubResults = await discoverCrossClubProperties(
      admin,
      clubIds,
      directPropertyIds
    );

    // Map of cross-club property ID -> routing info
    const crossClubMap: Record<
      string,
      { accessClubId: string; anglerClubId: string; agreementId: string }
    > = {};
    for (const result of crossClubResults) {
      crossClubMap[result.propertyId] = {
        accessClubId: result.accessClubId,
        anglerClubId: result.anglerClubId,
        agreementId: result.agreementId,
      };
    }

    const crossClubPropertyIds = crossClubResults.map((r) => r.propertyId);

    // Combine all accessible property IDs
    const allPropertyIds = [...directPropertyIds, ...crossClubPropertyIds];

    if (allPropertyIds.length === 0) {
      return jsonOk({
        properties: [],
        memberships: memberships.map((m) => ({
          id: m.id,
          club_id: m.club_id,
          club_name: (m.clubs as { name: string } | null)?.name ?? "Unknown",
        })),
        message:
          "Your clubs don't have access to any properties yet.",
      });
    }

    // Fetch the properties
    let query = admin
      .from("properties")
      .select(
        "id, name, description, location_description, water_type, species, photos, max_rods, max_guests, rate_adult_full_day, rate_adult_half_day, half_day_allowed, water_miles, latitude, longitude, lodging_available, lodging_url"
      )
      .in("id", allPropertyIds)
      .eq("status", "published")
      .order("name");

    if (waterType) {
      query = query.eq("water_type", waterType);
    }

    if (species) {
      query = query.contains("species", [species]);
    }

    if (minPrice) {
      query = query.gte("rate_adult_full_day", parseFloat(minPrice));
    }

    if (maxPrice) {
      query = query.lte("rate_adult_full_day", parseFloat(maxPrice));
    }

    if (lodging === "true") {
      query = query.eq("lodging_available", true);
    }

    // Bounding box filter for map viewport
    if (bounds) {
      const parts = bounds.split(",").map(Number);
      if (parts.length === 4 && parts.every((n) => !isNaN(n))) {
        const [south, west, north, east] = parts;
        query = query
          .gte("latitude", south)
          .lte("latitude", north)
          .gte("longitude", west)
          .lte("longitude", east);
      }
    }

    const { data: properties, error } = await query;

    if (error) {
      console.error("[properties/discover] Fetch error:", error);
      return jsonError("Failed to fetch properties", 500);
    }

    // Fetch active lodging data for these properties
    const propertyIds = (properties ?? []).map((p) => p.id);
    const { data: lodgingRows } = propertyIds.length > 0
      ? await admin
          .from("property_lodging")
          .select("*")
          .in("property_id", propertyIds)
          .eq("is_active", true)
      : { data: null };

    type LodgingRow = NonNullable<typeof lodgingRows>[number];
    const lodgingMap: Record<string, LodgingRow> = {};
    for (const row of lodgingRows ?? []) {
      lodgingMap[row.property_id] = row;
    }

    // Enrich properties with club access info and cross-club flag
    const enriched = (properties ?? []).map((prop) => {
      const crossClubInfo = crossClubMap[prop.id];
      const isCrossClub = !!crossClubInfo;

      const lodging = lodgingMap[prop.id] ?? null;

      if (isCrossClub) {
        // Cross-club property: route through the angler's club that has the agreement
        const anglerMembership = memberships.find(
          (m) => m.club_id === crossClubInfo.anglerClubId
        );
        return {
          ...prop,
          is_cross_club: true,
          lodging,
          accessible_through: anglerMembership
            ? [
                {
                  membership_id: anglerMembership.id,
                  club_id: anglerMembership.club_id,
                  club_name:
                    (anglerMembership.clubs as { name: string } | null)
                      ?.name ?? "Unknown",
                },
              ]
            : [],
        };
      }

      // Home-club property: direct access
      const accessibleClubIds = propertyClubMap[prop.id] ?? [];
      const accessibleClubs = memberships
        .filter((m) => accessibleClubIds.includes(m.club_id))
        .map((m) => ({
          membership_id: m.id,
          club_id: m.club_id,
          club_name:
            (m.clubs as { name: string } | null)?.name ?? "Unknown",
        }));

      return {
        ...prop,
        is_cross_club: false,
        lodging,
        accessible_through: accessibleClubs,
      };
    });

    return jsonOk({
      properties: enriched,
      memberships: memberships.map((m) => ({
        id: m.id,
        club_id: m.club_id,
        club_name: (m.clubs as { name: string } | null)?.name ?? "Unknown",
      })),
    });
  } catch (err) {
    console.error("[properties/discover] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}
