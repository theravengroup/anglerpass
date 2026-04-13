import { escapeIlike, jsonError, jsonOk } from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { getHiddenPropertyIds } from "@/lib/club-active-filter";
import { rateLimit, getClientIp } from "@/lib/api/rate-limit";

// GET: Public search endpoint — returns published properties (no auth required)
// Does NOT include sensitive fields (gate code, access notes, owner info)
export async function GET(request: Request) {
  const limited = rateLimit("properties-search", getClientIp(request), 30, 60_000);
  if (limited) return limited;

  try {
    const admin = createAdminClient();
    const { searchParams } = new URL(request.url);

    const waterType = searchParams.get("water_type");
    const species = searchParams.get("species");
    const minPrice = searchParams.get("min_price");
    const maxPrice = searchParams.get("max_price");
    const bounds = searchParams.get("bounds"); // "south,west,north,east"
    const q = searchParams.get("q"); // text search
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 200) : 100;

    let query = admin
      .from("properties")
      .select(
        "id, name, description, location_description, water_type, species, photos, max_rods, max_guests, rate_adult_full_day, rate_adult_half_day, half_day_allowed, water_miles, latitude, longitude"
      )
      .eq("status", "published")
      .order("name")
      .limit(limit * 2); // Over-fetch to account for inactive-club filtering

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

    if (q) {
      // Escape ilike wildcards, then strip PostgREST filter operators
      const sanitized = escapeIlike(q).replace(/[.,()]/g, " ").trim();
      if (sanitized) {
        query = query.or(
          `name.ilike.%${sanitized}%,location_description.ilike.%${sanitized}%,description.ilike.%${sanitized}%`
        );
      }
    }

    const { data: rawProperties, error } = await query;

    if (error) {
      console.error("[properties/search] Error:", error);
      return jsonError("Failed to search properties", 500);
    }

    // Filter out properties whose affiliated clubs are all inactive
    const propertyIds = (rawProperties ?? []).map((p) => p.id);
    const hiddenIds = await getHiddenPropertyIds(admin, propertyIds);

    const properties = (rawProperties ?? [])
      .filter((p) => !hiddenIds.has(p.id))
      .slice(0, limit);

    return jsonOk({ properties });
  } catch (err) {
    console.error("[properties/search] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}
