import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET: Public-facing guide profile
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = createAdminClient();

    const { data: guide, error } = await (admin
      .from("guide_profiles" as never)
      .select(
        "id, user_id, display_name, bio, profile_photo_url, photos, techniques, species, skill_levels, max_anglers, gear_included, gear_details, languages, base_location, service_region, closest_airports, rate_full_day, rate_half_day, rate_description, rating_avg, rating_count, trips_completed, status"
      )
      .eq("id" as never, id)
      .eq("status" as never, "approved")
      .single()) as unknown as { data: { id: string; user_id: string; [key: string]: unknown } | null; error: unknown };

    if (error || !guide) {
      return NextResponse.json(
        { error: "Guide not found" },
        { status: 404 }
      );
    }

    // Fetch revealed reviews for this guide
    const { data: reviews } = await admin
      .from("reviews" as never)
      .select(
        "id, rating, title, body, created_at, reviewer_role, profiles!reviews_reviewer_id_fkey(display_name)"
      )
      .eq("subject_id" as never, guide.user_id)
      .eq("subject_role" as never, "guide")
      .eq("is_revealed" as never, true)
      .order("created_at" as never, { ascending: false })
      .limit(10);

    // Fetch waters this guide is approved for
    const { data: waters } = await admin
      .from("guide_water_approvals" as never)
      .select(
        "id, property_id, properties(name, location_description, water_type)"
      )
      .eq("guide_id" as never, id)
      .eq("status" as never, "approved");

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
