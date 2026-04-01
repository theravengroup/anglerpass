import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { propertySchema, propertyStatusTransition, MIN_PHOTOS } from "@/lib/validations/properties";
import { parseCoordinates } from "@/lib/geo";

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

    const admin = createAdminClient();

    // Verify ownership — fetch full property for validation
    const { data: existing } = await admin
      .from("properties")
      .select("*")
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

      // Only drafts and changes_requested can be submitted for review
      if (
        statusResult.data.status === "pending_review" &&
        existing.status !== "draft" &&
        existing.status !== "changes_requested"
      ) {
        return NextResponse.json(
          { error: "Only draft or changes-requested properties can be submitted for review" },
          { status: 400 }
        );
      }

      // Server-side validation for submit-for-review
      if (statusResult.data.status === "pending_review") {
        const photoCount = (existing.photos as string[])?.length ?? 0;
        if (photoCount < MIN_PHOTOS) {
          return NextResponse.json(
            { error: `At least ${MIN_PHOTOS} photos are required to submit for review` },
            { status: 400 }
          );
        }

        if (
          existing.rate_adult_full_day == null ||
          existing.rate_youth_full_day == null ||
          existing.rate_child_full_day == null
        ) {
          return NextResponse.json(
            { error: "Full-day rates for Adult, Youth, and Child are required to submit for review" },
            { status: 400 }
          );
        }

        if (existing.capacity == null) {
          return NextResponse.json(
            { error: "Capacity is required to submit for review" },
            { status: 400 }
          );
        }
      }

      // Only pending_review or changes_requested can be withdrawn back to draft
      if (
        statusResult.data.status === "draft" &&
        existing.status !== "pending_review" &&
        existing.status !== "changes_requested"
      ) {
        return NextResponse.json(
          { error: "Only pending or changes-requested properties can be withdrawn" },
          { status: 400 }
        );
      }

      const { data, error } = await admin
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

    const { water_type, coordinates, ...rest } = result.data;
    const { latitude, longitude } = parseCoordinates(coordinates);

    const { data, error } = await admin
      .from("properties")
      .update({
        ...rest,
        coordinates,
        water_type: water_type || null,
        latitude,
        longitude,
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

    const admin = createAdminClient();

    // Verify ownership
    const { data: property } = await admin
      .from("properties")
      .select("owner_id, photos")
      .eq("id", id)
      .single();

    if (!property || property.owner_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete photos from storage
    if ((property.photos as string[])?.length > 0) {
      const paths = (property.photos as string[]).map((url: string) => {
        try {
          const urlObj = new URL(url);
          const pathParts = urlObj.pathname.split("/storage/v1/object/public/property-photos/");
          return pathParts[1] ?? "";
        } catch {
          return "";
        }
      }).filter(Boolean);

      if (paths.length > 0) {
        await admin.storage.from("property-photos").remove(paths);
      }
    }

    // Only allow deleting drafts
    const { error } = await admin
      .from("properties")
      .delete()
      .eq("id", id)
      .eq("status", "draft");

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
