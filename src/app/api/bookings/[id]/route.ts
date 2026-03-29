import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { bookingStatusSchema } from "@/lib/validations/bookings";

// GET: Fetch a single booking
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    const { data: booking, error } = await admin
      .from("bookings")
      .select(
        "*, properties(id, name, location_description, photos, water_type, regulations, access_notes, gate_code_required, gate_code, owner_id), profiles!bookings_angler_id_fkey(display_name)"
      )
      .eq("id", id)
      .single();

    if (error || !booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Verify access: angler, property owner, or admin
    const property = booking.properties as { owner_id: string } | null;
    const isAngler = booking.angler_id === user.id;
    const isLandowner = property?.owner_id === user.id;

    if (!isAngler && !isLandowner) {
      const { data: profile } = await admin
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Only show access details (gate code, etc.) for confirmed bookings to the angler
    if (isAngler && booking.status !== "confirmed") {
      const props = booking.properties as Record<string, unknown> | null;
      if (props) {
        delete props.gate_code;
        delete props.access_notes;
      }
    }

    return NextResponse.json({ booking });
  } catch (err) {
    console.error("[bookings/[id]] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH: Update booking status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // Fetch the booking
    const { data: booking } = await admin
      .from("bookings")
      .select("id, status, angler_id, property_id, properties(owner_id)")
      .eq("id", id)
      .single();

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const property = booking.properties as { owner_id: string } | null;

    // Angler cancellation
    if (body.status === "cancelled") {
      if (booking.angler_id !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      if (!["pending", "confirmed"].includes(booking.status)) {
        return NextResponse.json(
          { error: "This booking cannot be cancelled" },
          { status: 400 }
        );
      }

      const { data: updated, error: updateError } = await admin
        .from("bookings")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (updateError) {
        console.error("[bookings/[id]] Cancel error:", updateError);
        return NextResponse.json(
          { error: "Failed to cancel booking" },
          { status: 500 }
        );
      }

      return NextResponse.json({ booking: updated });
    }

    // Landowner confirm/decline
    if (property?.owner_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (booking.status !== "pending") {
      return NextResponse.json(
        { error: "Only pending bookings can be confirmed or declined" },
        { status: 400 }
      );
    }

    const result = bookingStatusSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {
      status: result.data.status,
      updated_at: new Date().toISOString(),
    };

    if (result.data.landowner_notes) {
      updates.landowner_notes = result.data.landowner_notes;
    }

    if (result.data.status === "confirmed") {
      updates.confirmed_at = new Date().toISOString();
    }

    const { data: updated, error: updateError } = await admin
      .from("bookings")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("[bookings/[id]] Update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update booking" },
        { status: 500 }
      );
    }

    return NextResponse.json({ booking: updated });
  } catch (err) {
    console.error("[bookings/[id]] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
