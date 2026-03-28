import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { moderationActionSchema } from "@/lib/validations/moderation";

const ACTION_TO_STATUS: Record<string, string> = {
  approved: "published",
  changes_requested: "changes_requested",
  rejected: "archived",
};

export async function POST(
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

    // Verify admin role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase as any)
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validate request body
    const body = await request.json();
    const result = moderationActionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { action, notes } = result.data;

    // Get current property
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: property } = await (supabase as any)
      .from("properties")
      .select("id, status, name, owner_id")
      .eq("id", id)
      .single();

    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    if (property.status !== "pending_review") {
      return NextResponse.json(
        { error: "Only properties with pending_review status can be moderated" },
        { status: 400 }
      );
    }

    const newStatus = ACTION_TO_STATUS[action];
    const oldStatus = property.status;

    // Update property status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from("properties")
      .update({ status: newStatus })
      .eq("id", id);

    if (updateError) {
      console.error("[moderation] Status update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update property status" },
        { status: 500 }
      );
    }

    // Insert moderation note
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: noteError } = await (supabase as any)
      .from("moderation_notes")
      .insert({
        property_id: id,
        admin_id: user.id,
        action,
        notes,
      });

    if (noteError) {
      console.error("[moderation] Note insert error:", noteError);
      // Status was already updated — log but don't fail
    }

    // Write to audit log
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: auditError } = await (supabase as any)
      .from("audit_log")
      .insert({
        actor_id: user.id,
        action: `moderation.${action}`,
        entity_type: "property",
        entity_id: id,
        old_data: { status: oldStatus },
        new_data: { status: newStatus, notes },
      });

    if (auditError) {
      console.error("[moderation] Audit log error:", auditError);
    }

    return NextResponse.json({
      success: true,
      property: { id, status: newStatus },
    });
  } catch (err) {
    console.error("[moderation] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET moderation history for a property
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("moderation_notes")
      .select("id, action, notes, created_at, admin_id")
      .eq("property_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[moderation] Fetch notes error:", error);
      return NextResponse.json(
        { error: "Failed to fetch moderation history" },
        { status: 500 }
      );
    }

    return NextResponse.json({ notes: data ?? [] });
  } catch (err) {
    console.error("[moderation] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
