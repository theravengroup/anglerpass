import { jsonOk, jsonError } from "@/lib/api/helpers";
import { createUntypedAdmin } from "@/lib/supabase/untyped";
import { rateLimit, getClientIp } from "@/lib/api/rate-limit";
import { z } from "zod";

const querySchema = z.object({
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  species: z.array(z.string()).optional(),
  waterType: z.string().optional(),
  season: z.string().optional(),
  maxResults: z.number().int().min(1).max(20).default(6),
});

/**
 * GET /api/affiliate/products?categories=rod,reel&tags=5-weight,trout&maxResults=4
 *
 * Returns matching affiliate products for Compass AI recommendations.
 * Prioritizes: direct brands > retailer fallbacks > digital.
 */
export async function POST(request: Request) {
  const limited = rateLimit("affiliate-products", getClientIp(request), 20, 60_000);
  if (limited) return jsonError("Too many requests", 429);

  const body = await request.json().catch(() => null);
  if (!body) return jsonError("Invalid JSON", 400);

  const parsed = querySchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid query", 400);

  const { categories, tags, species, waterType, season, maxResults } = parsed.data;

  const admin = createUntypedAdmin();

  let query = admin
    .from("affiliate_products")
    .select(`
      id,
      name,
      category,
      description,
      price_cents,
      image_url,
      affiliate_url,
      tags,
      sort_priority,
      affiliate_brands!inner (
        name,
        slug,
        tier
      )
    `)
    .eq("is_active", true)
    .order("sort_priority", { ascending: false })
    .limit(maxResults * 3); // fetch extra, then rank

  // Filter by categories
  if (categories && categories.length > 0) {
    query = query.in("category", categories);
  }

  // Filter by tag overlap
  if (tags && tags.length > 0) {
    query = query.overlaps("tags", tags);
  }

  // Filter by species
  if (species && species.length > 0) {
    query = query.overlaps("species_tags", species);
  }

  // Filter by water type
  if (waterType) {
    query = query.overlaps("water_type_tags", [waterType.toLowerCase()]);
  }

  // Filter by season
  if (season) {
    query = query.overlaps("season_tags", [season.toLowerCase()]);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[affiliate/products] Query error:", error.message);
    return jsonError("Failed to fetch products", 500);
  }

  if (!data || data.length === 0) {
    return jsonOk({ products: [] });
  }

  // Rank and dedupe: prefer direct > retailer > digital, then by sort_priority
  const tierOrder: Record<string, number> = { direct: 0, retailer: 1, digital: 2 };
  const ranked = data
    .map((row) => {
      const brand = row.affiliate_brands as unknown as {
        name: string;
        slug: string;
        tier: string;
      };
      return {
        id: row.id,
        name: row.name,
        brand_name: brand.name,
        brand_slug: brand.slug,
        category: row.category,
        description: row.description,
        price_cents: row.price_cents,
        image_url: row.image_url,
        affiliate_url: row.affiliate_url,
        tier: brand.tier as "direct" | "retailer" | "digital",
        tags: row.tags ?? [],
      };
    })
    .sort((a, b) => {
      // Tier priority first
      const tierDiff = (tierOrder[a.tier] ?? 2) - (tierOrder[b.tier] ?? 2);
      if (tierDiff !== 0) return tierDiff;
      // Then tag relevance (more matching tags = higher)
      const aMatches = tags ? a.tags.filter((t: string) => tags.includes(t)).length : 0;
      const bMatches = tags ? b.tags.filter((t: string) => tags.includes(t)).length : 0;
      return bMatches - aMatches;
    })
    .slice(0, maxResults);

  return jsonOk({ products: ranked });
}
