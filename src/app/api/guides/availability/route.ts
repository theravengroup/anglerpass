import { NextResponse } from "next/server";
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      const { data: profile } = await (admin
        .from("guide_profiles" as never)
        .select("id")
        .eq("user_id" as never, user.id)
        .single()) as unknown as { data: { id: string } | null };

      if (!profile) {
        return NextResponse.json(
          { error: "Guide profile not found" },
          { status: 404 }
        );
      }
      targetGuideId = profile.id;
    }

    let query = admin
      .from("guide_availability" as never)
      .select("id, date, status, booking_id")
      .eq("guide_id" as never, targetGuideId)
      .order("date" as never);

    if (startDate) {
      query = query.gte("date" as never, startDate);
    }
    if (endDate) {
      query = query.lte("date" as never, endDate);
    }

    const { data: availability, error } = await query;

    if (error) {
      console.error("[guides/availability] Fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch availability" },
        { status: 500 }
      );
    }

    return NextResponse.json({ availability: availability ?? [] });
  } catch (err) {
    console.error("[guides/availability] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = guideAvailabilitySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data: profile } = await (admin
      .from("guide_profiles" as never)
      .select("id")
      .eq("user_id" as never, user.id)
      .single()) as unknown as { data: { id: string } | null };

    if (!profile) {
      return NextResponse.json(
        { error: "Guide profile not found" },
        { status: 404 }
      );
    }

    const { dates, status } = result.data;

    // Don't overwrite booked dates
    if (status === "blocked") {
      const { data: bookedDates } = await (admin
        .from("guide_availability" as never)
        .select("date")
        .eq("guide_id" as never, profile.id)
        .eq("status" as never, "booked")
        .in("date" as never, dates)) as unknown as { data: { date: string }[] | null };

      const bookedSet = new Set((bookedDates ?? []).map((d) => d.date));
      const filteredDates = dates.filter((d) => !bookedSet.has(d));

      if (filteredDates.length === 0) {
        return NextResponse.json({
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
        .from("guide_availability" as never)
        .upsert(records as never, { onConflict: "guide_id,date" });

      if (error) {
        console.error("[guides/availability] Upsert error:", error);
        return NextResponse.json(
          { error: "Failed to update availability" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: `${filteredDates.length} date(s) updated to ${status}`,
        updated: filteredDates.length,
      });
    }

    // For "available" status, we can either upsert or delete the record
    // (default state is available, so we remove blocked entries)
    if (status === "available") {
      const { error } = await admin
        .from("guide_availability" as never)
        .delete()
        .eq("guide_id" as never, profile.id)
        .eq("status" as never, "blocked")
        .in("date" as never, dates);

      if (error) {
        console.error("[guides/availability] Delete error:", error);
        return NextResponse.json(
          { error: "Failed to update availability" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: `${dates.length} date(s) set to available`,
        updated: dates.length,
      });
    }

    return NextResponse.json({ message: "No changes made", updated: 0 });
  } catch (err) {
    console.error("[guides/availability] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
