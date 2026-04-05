import { jsonError, jsonOk } from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { guideAvailabilitySchema } from "@/lib/validations/guides";

// GET: Fetch guide's availability for a date range
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return jsonError("Unauthorized", 401);
    }

    const admin = createAdminClient();
    const { searchParams } = new URL(request.url);
    const guideId = searchParams.get("guide_id");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    // If guide_id provided, fetch for that guide (public approved guides only)
    // Otherwise, fetch for the current user's guide profile
    let targetGuideId = guideId;

    if (!targetGuideId) {
      const { data: profile } = await admin
        .from("guide_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) {
        return jsonError("Guide profile not found", 404);
      }
      targetGuideId = profile.id;
    }

    let query = admin
      .from("guide_availability")
      .select("id, date, status, booking_id")
      .eq("guide_id", targetGuideId)
      .order("date");

    if (startDate) {
      query = query.gte("date", startDate);
    }
    if (endDate) {
      query = query.lte("date", endDate);
    }

    const { data: availability, error } = await query;

    if (error) {
      console.error("[guides/availability] Fetch error:", error);
      return jsonError("Failed to fetch availability", 500);
    }

    return jsonOk({ availability: availability ?? [] });
  } catch (err) {
    console.error("[guides/availability] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}

// PUT: Bulk set dates as available or blocked
export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return jsonError("Unauthorized", 401);
    }

    const body = await request.json();
    const result = guideAvailabilitySchema.safeParse(body);

    if (!result.success) {
      return jsonError(result.error.issues[0]?.message ?? "Invalid input", 400);
    }

    const admin = createAdminClient();

    const { data: profile } = await admin
      .from("guide_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return jsonError("Guide profile not found", 404);
    }

    const { dates, status } = result.data;

    // Don't overwrite booked dates
    if (status === "blocked") {
      const { data: bookedDates } = await admin
        .from("guide_availability")
        .select("date")
        .eq("guide_id", profile.id)
        .eq("status", "booked")
        .in("date", dates);

      const bookedSet = new Set((bookedDates ?? []).map((d) => d.date));
      const filteredDates = dates.filter((d) => !bookedSet.has(d));

      if (filteredDates.length === 0) {
        return jsonOk({
          message: "All selected dates are already booked and cannot be blocked.",
          updated: 0,
        });
      }

      // Upsert availability records
      const records = filteredDates.map((date) => ({
        guide_id: profile.id,
        date,
        status,
      }));

      const { error } = await admin
        .from("guide_availability")
        .upsert(records, { onConflict: "guide_id,date" });

      if (error) {
        console.error("[guides/availability] Upsert error:", error);
        return jsonError("Failed to update availability", 500);
      }

      return jsonOk({
        message: `${filteredDates.length} date(s) updated to ${status}`,
        updated: filteredDates.length,
      });
    }

    // For "available" status, we can either upsert or delete the record
    // (default state is available, so we remove blocked entries)
    if (status === "available") {
      const { error } = await admin
        .from("guide_availability")
        .delete()
        .eq("guide_id", profile.id)
        .eq("status", "blocked")
        .in("date", dates);

      if (error) {
        console.error("[guides/availability] Delete error:", error);
        return jsonError("Failed to update availability", 500);
      }

      return jsonOk({
        message: `${dates.length} date(s) set to available`,
        updated: dates.length,
      });
    }

    return jsonOk({ message: "No changes made", updated: 0 });
  } catch (err) {
    console.error("[guides/availability] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}
