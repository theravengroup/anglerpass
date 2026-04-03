import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit, getClientIp } from "@/lib/api/rate-limit";

// GET: Public-facing guide profile
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = rateLimit("guide-profile", getClientIp(_request), 30, 60_000);
  if (limited) return limited;

  try {
    const { id } = await params;
    const admin = createAdminClient();

    const { data: guide, error } = await admin
      .from("guide_profiles")
      .select(
        "id, user_id, display_name, bio, profile_photo_url, photos, techniques, species, skill_levels, max_anglers, gear_included, gear_details, languages, base_location, service_region, closest_airports, rate_full_day, rate_half_day, rate_description, rating_avg, rating_count, trips_completed, status"
      )
      .eq("id", id)
      .eq("status", "live")
      .single();

    if (error || !guide) {
      return NextResponse.json(
        { error: "Guide not found" },
        { status: 404 }
      );
    }

    // Fetch revealed reviews for this guide
    const { data: reviews } = await admin
      .from("reviews")
      .select(
        "id, rating, title, body, created_at, reviewer_role, profiles!reviews_reviewer_id_fkey(display_name)"
      )
      .eq("subject_id", guide.user_id)
      .eq("subject_role", "guide")
      .eq("is_revealed", true)
      .order("created_at", { ascending: false })
      .limit(10);

    // Fetch waters this guide is approved for
    const { data: waters } = await admin
      .from("guide_water_approvals")
      .select(
        "id, property_id, properties(name, location_description, water_type)"
      )
      .eq("guide_id", id)
      .eq("status", "live");

    return NextResponse.json({
      guide,
      reviews: reviews ?? [],
      waters: waters ?? [],
    });
  } catch (err) {
    console.error("[guides/[id]] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
