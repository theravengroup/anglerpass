import { jsonError, jsonOk, requireAuth} from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { propertySchema, propertyStatusTransition, MIN_PHOTOS } from "@/lib/validations/properties";
import { parseCoordinates } from "@/lib/geo";
import { notifyPropertyDeactivated } from "@/lib/notifications";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

    const admin = createAdminClient();

    const { data, error } = await admin
      .from("properties")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      return jsonError("Property not found", 404);
    }

    // Published properties are visible to everyone
    if (data.status !== "published") {
      // Non-published: only owner, club staff, or admin
      let hasAccess = data.owner_id === user.id;

      if (!hasAccess && data.created_by_club_id) {
        const { requireClubRole } = await import("@/lib/api/helpers");
        const role = await requireClubRole(user.id, data.created_by_club_id, "club.manage_properties");
        if (role?.allowed) hasAccess = true;
      }

      if (!hasAccess) {
        const { data: profile } = await admin
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
        if (profile?.role === "admin") hasAccess = true;
      }

      if (!hasAccess) {
        return jsonError("Property not found", 404);
      }
    }

    return jsonOk({ property: data });
  } catch (err) {
    console.error("[properties] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

    const admin = createAdminClient();

    // Verify ownership — fetch full property for validation
    const { data: existing } = await admin
      .from("properties")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!existing) {
      return jsonError("Property not found", 404);
    }

    // Allow owner OR club staff who created the property
    let hasAccess = existing.owner_id === user.id;
    if (!hasAccess && existing.created_by_club_id) {
      const { requireClubRole } = await import("@/lib/api/helpers");
      const role = await requireClubRole(user.id, existing.created_by_club_id, "club.manage_properties");
      if (role?.allowed) hasAccess = true;
    }
    if (!hasAccess) {
      return jsonError("Forbidden", 403);
    }

    const body = await request.json();

    // Handle status-only updates (submit for review / withdraw)
    if (body.status && Object.keys(body).length === 1) {
      const statusResult = propertyStatusTransition.safeParse(body);
      if (!statusResult.success) {
        return jsonError("Invalid status transition", 400);
      }

      // Only drafts and changes_requested can be submitted for review
      if (
        statusResult.data.status === "pending_review" &&
        existing.status !== "draft" &&
        existing.status !== "changes_requested"
      ) {
        return jsonError("Only draft or changes-requested properties can be submitted for review", 400);
      }

      // Server-side validation for submit-for-review
      if (statusResult.data.status === "pending_review") {
        const photoCount = (existing.photos as string[])?.length ?? 0;
        if (photoCount < MIN_PHOTOS) {
          return jsonError(`At least ${MIN_PHOTOS} photos are required to submit for review`, 400);
        }

        if (
          existing.rate_adult_full_day == null ||
          existing.rate_youth_full_day == null ||
          existing.rate_child_full_day == null
        ) {
          return jsonError("Full-day rates for Adult, Youth, and Child are required to submit for review", 400);
        }

        if (existing.max_rods == null) {
          return jsonError("Max rods per day is required to submit for review", 400);
        }
      }

      // Only pending_review or changes_requested can be withdrawn back to draft
      if (
        statusResult.data.status === "draft" &&
        existing.status !== "pending_review" &&
        existing.status !== "changes_requested"
      ) {
        return jsonError("Only pending or changes-requested properties can be withdrawn", 400);
      }

      const { data, error } = await admin
        .from("properties")
        .update({ status: statusResult.data.status })
        .eq("id", id)
        .select()
        .maybeSingle();

      if (error) {
        console.error("[properties] Status update error:", error);
        return jsonError("Failed to update status", 500);
      }

      // Notify affiliated clubs when a published property is withdrawn
      if (
        existing.status === "published" &&
        statusResult.data.status === "draft"
      ) {
        notifyPropertyDeactivated(admin, {
          propertyId: id,
          propertyName: existing.name,
        }).catch((err) =>
          console.error("[properties] Deactivation notification error:", err)
        );
      }

      return jsonOk({ property: data });
    }

    // Handle field updates
    const result = propertySchema.safeParse(body);
    if (!result.success) {
      return jsonError(result.error.issues[0]?.message ?? "Invalid input", 400);
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
      .maybeSingle();

    if (error) {
      console.error("[properties] Update error:", error);
      return jsonError("Failed to update property", 500);
    }

    return jsonOk({ property: data });
  } catch (err) {
    console.error("[properties] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

    const admin = createAdminClient();

    // Verify ownership
    const { data: property } = await admin
      .from("properties")
      .select("owner_id, photos")
      .eq("id", id)
      .maybeSingle();

    if (!property || property.owner_id !== user.id) {
      return jsonError("Forbidden", 403);
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
      return jsonError("Failed to delete property. Only drafts can be deleted.", 400);
    }

    return jsonOk({ success: true });
  } catch (err) {
    console.error("[properties] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}
