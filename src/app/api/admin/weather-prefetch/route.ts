import { jsonError, jsonOk, requireAdmin } from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPropertyForecast } from "@/lib/weather";

/**
 * POST /api/admin/weather-prefetch
 *
 * Pre-warms the weather cache for all published properties with coordinates.
 * Intended to be called by a cron job every 30 minutes, or manually by admins.
 *
 * Processes properties sequentially with a small delay between calls
 * to avoid hammering the NWS API.
 */
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();

    if (!auth) return jsonError("Unauthorized", 401);

    const admin = createAdminClient();

    // Fetch all published properties with coordinates
    const { data: properties } = await admin
      .from("properties")
      .select("id, name, latitude, longitude")
      .eq("status", "published")
      .not("latitude", "is", null)
      .not("longitude", "is", null);

    if (!properties?.length) {
      return jsonOk({
        message: "No properties to prefetch",
        prefetched: 0,
        failed: 0,
      });
    }

    let prefetched = 0;
    let failed = 0;

    for (const prop of properties) {
      try {
        const result = await getPropertyForecast(
          prop.latitude as number,
          prop.longitude as number
        );
        if (result) {
          prefetched++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }

      // Small delay between requests to be a good NWS API citizen
      // (cache hits return instantly so only cache misses actually hit NWS)
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    return jsonOk({
      message: `Prefetched ${prefetched} of ${properties.length} properties`,
      prefetched,
      failed,
      total: properties.length,
    });
  } catch (err) {
    console.error("[weather-prefetch] Error:", err);
    return jsonError("Internal server error", 500);
  }
}
