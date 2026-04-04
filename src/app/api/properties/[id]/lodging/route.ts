import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { lodgingSchema } from "@/lib/validations/lodging";

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

    const { data, error } = await admin
      .from("property_lodging")
      .select("*")
      .eq("property_id", id)
      .maybeSingle();

    if (error) {
      console.error("[lodging] Fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch lodging" },
        { status: 500 }
      );
    }

    return NextResponse.json({ lodging: data });
  } catch (err) {
    console.error("[lodging] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: propertyId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // Verify ownership
    const { data: property } = await admin
      .from("properties")
      .select("owner_id")
      .eq("id", propertyId)
      .single();

    if (!property || property.owner_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const result = lodgingSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const {
      lodging_type,
      external_listing_url,
      lodging_name,
      lodging_type_other,
      lodging_description,
      checkin_time,
      checkout_time,
      ...rest
    } = result.data;

    const payload = {
      ...rest,
      property_id: propertyId,
      lodging_name: lodging_name || null,
      lodging_type: lodging_type || null,
      lodging_type_other: lodging_type_other || null,
      lodging_description: lodging_description || null,
      checkin_time: checkin_time || null,
      checkout_time: checkout_time || null,
      external_listing_url: external_listing_url || null,
    };

    // Upsert: insert if no row exists, update if it does
    const { data: existing } = await admin
      .from("property_lodging")
      .select("id")
      .eq("property_id", propertyId)
      .maybeSingle();

    let data;
    let error;

    if (existing) {
      const result = await admin
        .from("property_lodging")
        .update(payload)
        .eq("property_id", propertyId)
        .select()
        .single();
      data = result.data;
      error = result.error;
    } else {
      const result = await admin
        .from("property_lodging")
        .insert(payload)
        .select()
        .single();
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error("[lodging] Upsert error:", error);
      return NextResponse.json(
        { error: "Failed to save lodging" },
        { status: 500 }
      );
    }

    return NextResponse.json({ lodging: data });
  } catch (err) {
    console.error("[lodging] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
