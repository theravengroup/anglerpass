import { createAdminClient } from "@/lib/supabase/admin";
import {
  jsonOk,
  jsonError,
  escapeIlike,
  parsePositiveInt,
} from "@/lib/api/helpers";
import { rateLimit, getClientIp } from "@/lib/api/rate-limit";

const PAGE_SIZE = 12;

// GET: Public browse/search for approved guides
export async function GET(request: Request) {
  const limited = rateLimit("guides-browse", getClientIp(request), 30, 60_000);
  if (limited) return limited;

  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const species = searchParams.get("species")?.trim() ?? "";
    const techniques = searchParams.get("techniques")?.trim() ?? "";
    const location = searchParams.get("location")?.trim() ?? "";
    const minRating = searchParams.get("min_rating");
    const page = parsePositiveInt(searchParams.get("page"), 1, 100);

    const admin = createAdminClient();

    const selectFields = [
      "id",
      "display_name",
      "bio",
      "profile_photo_url",
      "techniques",
      "species",
      "skill_levels",
      "base_location",
      "service_region",
      "rate_full_day",
      "rate_half_day",
      "rating_avg",
      "rating_count",
      "trips_completed",
      "languages",
    ].join(", ");

    let query = admin
      .from("guide_profiles")
      .select(selectFields, { count: "exact" })
      .eq("status", "live");

    // Text search across name, bio, location, service region
    if (q) {
      const escaped = escapeIlike(q);
      query = query.or(
        `display_name.ilike.%${escaped}%,bio.ilike.%${escaped}%,base_location.ilike.%${escaped}%,service_region.ilike.%${escaped}%`
      );
    }

    // Location text search
    if (location) {
      const escaped = escapeIlike(location);
      query = query.or(
        `base_location.ilike.%${escaped}%,service_region.ilike.%${escaped}%`
      );
    }

    // Species filter — overlap with Postgres array
    if (species) {
      const speciesList = species.split(",").map((s) => s.trim()).filter(Boolean);
      if (speciesList.length > 0) {
        query = query.overlaps("species", speciesList);
      }
    }

    // Techniques filter — overlap with Postgres array
    if (techniques) {
      const techList = techniques.split(",").map((t) => t.trim()).filter(Boolean);
      if (techList.length > 0) {
        query = query.overlaps("techniques", techList);
      }
    }

    // Minimum rating filter
    if (minRating) {
      const rating = parseFloat(minRating);
      if (!isNaN(rating) && rating > 0) {
        query = query.gte("rating_avg", rating);
      }
    }

    // Order by rating (nulls last), then trips completed
    query = query
      .order("rating_avg", { ascending: false, nullsFirst: false })
      .order("trips_completed", { ascending: false, nullsFirst: false });

    // Pagination
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    query = query.range(from, to);

    const { data: guides, count, error } = await query;

    if (error) {
      console.error("[guides/browse] Query error:", error);
      return jsonError("Failed to fetch guides", 500);
    }

    const total = count ?? 0;
    const totalPages = Math.ceil(total / PAGE_SIZE);

    // Truncate bio to 200 chars for browse listing
    const guideRows = (guides ?? []) as unknown as Record<string, unknown>[];
    const trimmedGuides = guideRows.map((g) => ({
      ...g,
      bio: typeof g.bio === "string" ? g.bio.slice(0, 200) : null,
    }));

    return jsonOk({
      guides: trimmedGuides,
      total,
      page,
      total_pages: totalPages,
    });
  } catch (err) {
    console.error("[guides/browse] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}
