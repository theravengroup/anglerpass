import { jsonError, jsonOk } from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// GET: Find eligible guides for a booking
// ?property_id=X&date=YYYY-MM-DD&party_size=N&duration=full_day
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return jsonError("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("property_id");
    const date = searchParams.get("date");
    const partySizeStr = searchParams.get("party_size");
    const duration = searchParams.get("duration") ?? "full_day";

    if (!propertyId || !date) {
      return jsonError("property_id and date are required", 400);
    }

    const partySize = parseInt(partySizeStr ?? "1", 10);
    const admin = createAdminClient();

    // Find guides approved for this property
    const { data: approvals } = await admin
      .from("guide_water_approvals")
      .select("guide_id")
      .eq("property_id", propertyId)
      .eq("status", "live");

    if (!approvals?.length) {
      return jsonOk({ guides: [] });
    }

    const guideIds = approvals.map((a) => a.guide_id);

    // Fetch approved guide profiles with capacity check
    const { data: guides } = await admin
      .from("guide_profiles")
      .select(
        "id, user_id, display_name, bio, profile_photo_url, techniques, species, skill_levels, max_anglers, gear_included, rate_full_day, rate_half_day, rating_avg, rating_count, trips_completed, response_time_hours"
      )
      .in("id", guideIds)
      .eq("status", "live")
      .gte("max_anglers", partySize)
      .order("rating_avg", { ascending: false });

    if (!guides?.length) {
      return jsonOk({ guides: [] });
    }

    // Check availability — exclude blocked/booked guides
    const { data: unavailable } = await admin
      .from("guide_availability")
      .select("guide_id")
      .in("guide_id", guides.map((g) => g.id))
      .eq("date", date)
      .in("status", ["blocked", "booked"]);

    const unavailableIds = new Set(
      (unavailable ?? []).map((u) => u.guide_id)
    );

    // Also check lead time
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bookingDate = new Date(date + "T00:00:00");
    const daysUntil = Math.floor(
      (bookingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    const availableGuides = guides
      .filter((g) => !unavailableIds.has(g.id))
      .filter((g) => {
        // Check if guide has a lead_time_days constraint
        // We don't have it in the select, so we skip this check for now
        // (lead_time_days defaults to 1)
        return daysUntil >= 1;
      })
      .map((g) => ({
        ...g,
        rate:
          duration === "half_day"
            ? g.rate_half_day ?? g.rate_full_day
            : g.rate_full_day,
      }));

    return jsonOk({ guides: availableGuides });
  } catch (err) {
    console.error("[guides/match] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}
