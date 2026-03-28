import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const propertyId = formData.get("propertyId") as string | null;

    if (!file || !propertyId) {
      return NextResponse.json(
        { error: "File and propertyId are required" },
        { status: 400 }
      );
    }

    // Verify property ownership
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: property } = await (supabase as any)
      .from("properties")
      .select("id, owner_id")
      .eq("id", propertyId)
      .single();

    if (!property || property.owner_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Upload to Supabase Storage
    // Path: {user_id}/{property_id}/{timestamp}.webp
    const fileName = `${user.id}/${propertyId}/${Date.now()}.webp`;

    const { error: uploadError } = await supabase.storage
      .from("property-photos")
      .upload(fileName, file, {
        contentType: "image/webp",
        upsert: false,
      });

    if (uploadError) {
      console.error("[photos] Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload photo" },
        { status: 500 }
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("property-photos").getPublicUrl(fileName);

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error("[photos] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
