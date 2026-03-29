import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// GET: Discover properties accessible through the angler's club memberships
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
    const waterType = searchParams.get("water_type");
    const species = searchParams.get("species");
    const minPrice = searchParams.get("min_price");
    const maxPrice = searchParams.get("max_price");
    const bounds = searchParams.get("bounds"); // "south,west,north,east"

    // Get the user's active club memberships
    const { data: memberships } = await admin
      .from("club_memberships")
      .select("id, club_id, clubs(name)")
      .eq("user_id", user.id)
      .eq("status", "active");

    if (!memberships?.length) {
      return NextResponse.json({
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

    if (!accessRecords?.length) {
      return NextResponse.json({
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

    const propertyIds = [
      ...new Set(accessRecords.map((a) => a.property_id)),
    ];

    // Build a map of property -> clubs for the response
    const propertyClubMap: Record<string, string[]> = {};
    for (const record of accessRecords) {
      if (!propertyClubMap[record.property_id]) {
        propertyClubMap[record.property_id] = [];
      }
      propertyClubMap[record.property_id].push(record.club_id);
    }

    // Fetch the properties
    // max_rods / max_guests are new columns not yet in generated types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (admin
      .from("properties") as any)
      .select(
        "id, name, description, location_description, water_type, species, photos, capacity, max_rods, max_guests, rate_adult_full_day, rate_adult_half_day, half_day_allowed, water_miles, latitude, longitude"
      )
      .in("id", propertyIds)
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
      return NextResponse.json(
        { error: "Failed to fetch properties" },
        { status: 500 }
      );
    }

    // Enrich properties with club access info
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enriched = (properties ?? []).map((prop: any) => {
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
        accessible_through: accessibleClubs,
      };
    });

    return NextResponse.json({
      properties: enriched,
      memberships: memberships.map((m) => ({
        id: m.id,
        club_id: m.club_id,
        club_name: (m.clubs as { name: string } | null)?.name ?? "Unknown",
      })),
    });
  } catch (err) {
    console.error("[properties/discover] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
