import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { documentTemplateSchema } from "@/lib/validations/documents";

// GET: Get a single template
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

    const { data: template, error } = await admin
      .from("document_templates")
      .select("*, properties!document_templates_property_id_fkey(owner_id)")
      .eq("id", id)
      .single();

    if (error || !template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Authorization: only the property owner can view templates directly.
    // Anglers access templates through the /documents/[id]/sign endpoint.
    const propertyOwner = (template.properties as { owner_id: string } | null)?.owner_id;
    if (propertyOwner !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ template });
  } catch (err) {
    console.error("[documents/[id]] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH: Update a template
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

    // Verify ownership
    const { data: existing } = await admin
      .from("document_templates")
      .select("owner_id")
      .eq("id", id)
      .single();

    if (!existing || existing.owner_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const result = documentTemplateSchema.partial().safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { data: template, error } = await admin
      .from("document_templates")
      .update({
        ...result.data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[documents/[id]] Update error:", error);
      return NextResponse.json(
        { error: "Failed to update template" },
        { status: 500 }
      );
    }

    return NextResponse.json({ template });
  } catch (err) {
    console.error("[documents/[id]] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a template (only if no signed documents reference it)
export async function DELETE(
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

    // Verify ownership
    const { data: existing } = await admin
      .from("document_templates")
      .select("owner_id")
      .eq("id", id)
      .single();

    if (!existing || existing.owner_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check for signed documents
    const { count } = await admin
      .from("signed_documents")
      .select("id", { count: "exact", head: true })
      .eq("template_id", id);

    if ((count ?? 0) > 0) {
      // Can't delete — deactivate instead
      await admin
        .from("document_templates")
        .update({ active: false, updated_at: new Date().toISOString() })
        .eq("id", id);

      return NextResponse.json({
        success: true,
        deactivated: true,
        message:
          "Template has signed documents and was deactivated instead of deleted.",
      });
    }

    const { error } = await admin
      .from("document_templates")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[documents/[id]] Delete error:", error);
      return NextResponse.json(
        { error: "Failed to delete template" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[documents/[id]] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
