import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
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
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    if (property.latitude == null || property.longitude == null) {
      return NextResponse.json(
        { error: "Property coordinates not available" },
        { status: 404 }
      );
    }

    const forecast = await getPropertyForecast(
      property.latitude,
      property.longitude
    );

    if (!forecast) {
      return NextResponse.json(
        { error: "Forecast temporarily unavailable" },
        { status: 503 }
      );
    }

    // Allow browser to cache for 15 minutes, CDN for 30 minutes
    return NextResponse.json(forecast, {
      headers: {
        "Cache-Control": "public, s-maxage=1800, max-age=900, stale-while-revalidate=3600",
      },
    });
  } catch (err) {
    console.error("[weather] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
