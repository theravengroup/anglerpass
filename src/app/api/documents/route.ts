import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { documentTemplateSchema } from "@/lib/validations/documents";

// GET: List document templates for a property (query param: property_id)
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("property_id");

    if (!propertyId) {
      return NextResponse.json(
        { error: "property_id is required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Check if user is the property owner (show all) or angler (show active only)
    const { data: property } = await admin
      .from("properties")
      .select("owner_id")
      .eq("id", propertyId)
      .single();

    const isOwner = property?.owner_id === user.id;

    let query = admin
      .from("document_templates")
      .select("*")
      .eq("property_id", propertyId)
      .order("sort_order", { ascending: true });

    if (!isOwner) {
      query = query.eq("active", true);
    }

    const { data: templates, error } = await query;

    if (error) {
      console.error("[documents] Fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch templates" },
        { status: 500 }
      );
    }

    return NextResponse.json({ templates: templates ?? [] });
  } catch (err) {
    console.error("[documents] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Create a document template
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
    const { property_id, ...templateData } = body;

    if (!property_id) {
      return NextResponse.json(
        { error: "property_id is required" },
        { status: 400 }
      );
    }

    const result = documentTemplateSchema.safeParse(templateData);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Verify ownership
    const { data: property } = await admin
      .from("properties")
      .select("owner_id")
      .eq("id", property_id)
      .single();

    if (!property || property.owner_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: template, error } = await admin
      .from("document_templates")
      .insert({
        property_id,
        owner_id: user.id,
        ...result.data,
      })
      .select()
      .single();

    if (error) {
      console.error("[documents] Insert error:", error);
      return NextResponse.json(
        { error: "Failed to create template" },
        { status: 500 }
      );
    }

    return NextResponse.json({ template }, { status: 201 });
  } catch (err) {
    console.error("[documents] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
