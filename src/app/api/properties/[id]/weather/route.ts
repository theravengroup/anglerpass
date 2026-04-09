import { jsonError, requireAuth} from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPropertyForecast } from "@/lib/weather";

/**
 * GET /api/properties/[id]/weather
 *
 * Returns the 7-day weather forecast for a property's location.
 * Requires authentication. Uses cached data when available.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

    const { id } = await params;
    const admin = createAdminClient();

    // Fetch property coordinates
    const { data: property, error } = await admin
      .from("properties")
      .select("id, latitude, longitude, status")
      .eq("id", id)
      .eq("status", "published")
      .single();

    if (error || !property) {
      return jsonError("Property not found", 404);
    }

    if (property.latitude == null || property.longitude == null) {
      return jsonError("Property coordinates not available", 404);
    }

    const forecast = await getPropertyForecast(
      property.latitude,
      property.longitude
    );

    if (!forecast) {
      return jsonError("Forecast temporarily unavailable", 503);
    }

    // Allow browser to cache for 15 minutes, CDN for 30 minutes
    return Response.json(forecast, {
      headers: {
        "Cache-Control": "public, s-maxage=1800, max-age=900, stale-while-revalidate=3600",
      },
    });
  } catch (err) {
    console.error("[weather] Error:", err);
    return jsonError("Internal server error", 500);
  }
}
