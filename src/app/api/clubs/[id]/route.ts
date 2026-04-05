import { jsonError, jsonOk } from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { clubSchema } from "@/lib/validations/clubs";

// GET: Fetch a single club with stats
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
      return jsonError("Unauthorized", 401);
    }

    const admin = createAdminClient();

    const { data: club, error } = await admin
      .from("clubs")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !club) {
      return jsonError("Club not found", 404);
    }

    // Only owner or members can view full details
    if (club.owner_id !== user.id) {
      const { data: membership } = await admin
        .from("club_memberships")
        .select("id")
        .eq("club_id", id)
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      // Check if user is a platform admin
      const { data: profile } = await admin
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!membership && profile?.role !== "admin") {
        return jsonError("Forbidden", 403);
      }
    }

    // Get member count
    const { count: memberCount } = await admin
      .from("club_memberships")
      .select("id", { count: "exact", head: true })
      .eq("club_id", id)
      .eq("status", "active");

    // Get pending member count
    const { count: pendingCount } = await admin
      .from("club_memberships")
      .select("id", { count: "exact", head: true })
      .eq("club_id", id)
      .eq("status", "pending");

    // Get property count
    const { count: propertyCount } = await admin
      .from("club_property_access")
      .select("id", { count: "exact", head: true })
      .eq("club_id", id)
      .eq("status", "approved");

    // Get pending property requests
    const { count: pendingPropertyCount } = await admin
      .from("club_property_access")
      .select("id", { count: "exact", head: true })
      .eq("club_id", id)
      .eq("status", "pending");

    return jsonOk({
      club,
      stats: {
        active_members: memberCount ?? 0,
        pending_members: pendingCount ?? 0,
        active_properties: propertyCount ?? 0,
        pending_properties: pendingPropertyCount ?? 0,
      },
    });
  } catch (err) {
    console.error("[clubs/[id]] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}

// PATCH: Update club profile
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
      return jsonError("Unauthorized", 401);
    }

    const admin = createAdminClient();

    // Verify ownership
    const { data: club } = await admin
      .from("clubs")
      .select("owner_id")
      .eq("id", id)
      .single();

    if (!club || club.owner_id !== user.id) {
      return jsonError("Forbidden", 403);
    }

    const body = await request.json();
    const result = clubSchema.partial().safeParse(body);

    if (!result.success) {
      return jsonError(result.error.issues[0]?.message ?? "Invalid input", 400);
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Only include provided fields
    const { name, description, location, rules, website } = result.data;
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description || null;
    if (location !== undefined) updates.location = location || null;
    if (rules !== undefined) updates.rules = rules || null;
    if (website !== undefined) updates.website = website || null;

    const { data: updated, error: updateError } = await admin
      .from("clubs")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("[clubs/[id]] Update error:", updateError);
      return jsonError("Failed to update club", 500);
    }

    return jsonOk({ club: updated });
  } catch (err) {
    console.error("[clubs/[id]] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}
