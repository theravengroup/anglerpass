import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { propertySchema, propertyStatusTransition } from "@/lib/validations/properties";

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
      .from("properties")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ property: data });
  } catch (err) {
    console.error("[properties] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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

    // Verify ownership
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase as any)
      .from("properties")
      .select("id, owner_id, status")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    if (existing.owner_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // Handle status-only updates (submit for review / withdraw)
    if (body.status && Object.keys(body).length === 1) {
      const statusResult = propertyStatusTransition.safeParse(body);
      if (!statusResult.success) {
        return NextResponse.json(
          { error: "Invalid status transition" },
          { status: 400 }
        );
      }

      // Only drafts can be submitted for review
      if (
        statusResult.data.status === "pending_review" &&
        existing.status !== "draft"
      ) {
        return NextResponse.json(
          { error: "Only draft properties can be submitted for review" },
          { status: 400 }
        );
      }

      // Only pending_review can be withdrawn back to draft
      if (
        statusResult.data.status === "draft" &&
        existing.status !== "pending_review"
      ) {
        return NextResponse.json(
          { error: "Only pending properties can be withdrawn" },
          { status: 400 }
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("properties")
        .update({ status: statusResult.data.status })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("[properties] Status update error:", error);
        return NextResponse.json(
          { error: "Failed to update status" },
          { status: 500 }
        );
      }

      return NextResponse.json({ property: data });
    }

    // Handle field updates
    const result = propertySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { water_type, ...rest } = result.data;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("properties")
      .update({
        ...rest,
        water_type: water_type || null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[properties] Update error:", error);
      return NextResponse.json(
        { error: "Failed to update property" },
        { status: 500 }
      );
    }

    return NextResponse.json({ property: data });
  } catch (err) {
    console.error("[properties] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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

    // RLS policy only allows deleting drafts owned by the user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("properties")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[properties] Delete error:", error);
      return NextResponse.json(
        { error: "Failed to delete property. Only drafts can be deleted." },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[properties] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
