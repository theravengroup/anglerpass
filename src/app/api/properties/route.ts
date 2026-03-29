import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { propertySchema } from "@/lib/validations/properties";
import { parseCoordinates } from "@/lib/geo";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("properties")
      .select("*")
      .eq("owner_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("[properties] List error:", error);
      return NextResponse.json(
        { error: "Failed to fetch properties" },
        { status: 500 }
      );
    }

    return NextResponse.json({ properties: data });
  } catch (err) {
    console.error("[properties] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = propertySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { water_type, coordinates, ...rest } = result.data;
    const { latitude, longitude } = parseCoordinates(coordinates);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("properties")
      .insert({
        ...rest,
        coordinates,
        water_type: water_type || null,
        latitude,
        longitude,
        owner_id: user.id,
        status: "draft",
      })
      .select()
      .single();

    if (error) {
      console.error("[properties] Insert error:", error);
      return NextResponse.json(
        { error: "Failed to create property" },
        { status: 500 }
      );
    }

    return NextResponse.json({ property: data }, { status: 201 });
  } catch (err) {
    console.error("[properties] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
