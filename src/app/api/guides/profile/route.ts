import { jsonCreated, jsonError, jsonOk, requireAuth} from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { guideProfileSchema } from "@/lib/validations/guides";

// GET: Fetch current user's guide profile
export async function GET() {
  try {
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

    const admin = createAdminClient();

    const { data: profile, error } = await admin
      .from("guide_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("[guides/profile] Fetch error:", error);
      return jsonError("Failed to fetch guide profile", 500);
    }

    if (!profile) {
      return jsonError("Guide profile not found", 404);
    }

    return jsonOk({ profile });
  } catch (err) {
    console.error("[guides/profile] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}

// POST: Create guide profile
export async function POST(request: Request) {
  try {
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

    const body = await request.json();
    const result = guideProfileSchema.safeParse(body);

    if (!result.success) {
      return jsonError(result.error.issues[0]?.message ?? "Invalid input", 400);
    }

    const admin = createAdminClient();

    // Check if guide profile already exists
    const { data: existing } = await admin
      .from("guide_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      return jsonError("Guide profile already exists. Use PATCH to update.", 409);
    }

    // Add 'guide' to user's roles if not present
    const { data: userProfile } = await admin
      .from("profiles")
      .select("roles")
      .eq("id", user.id)
      .maybeSingle();

    const currentRoles: string[] = userProfile?.roles ?? [];
    if (!currentRoles.includes("guide")) {
      await admin
        .from("profiles")
        .update({
          roles: [...currentRoles, "guide"],
          role: "guide",
        })
        .eq("id", user.id);
    }

    // Create guide profile
    const { data: profile, error } = await admin
      .from("guide_profiles")
      .insert({
        user_id: user.id,
        display_name: result.data.display_name,
        bio: result.data.bio || null,
        profile_photo_url: result.data.profile_photo_url || null,
        photos: result.data.photos ?? [],
        techniques: result.data.techniques ?? [],
        species: result.data.species ?? [],
        skill_levels: result.data.skill_levels ?? [],
        max_anglers: result.data.max_anglers,
        gear_included: result.data.gear_included,
        gear_details: result.data.gear_details || null,
        languages: result.data.languages ?? ["English"],
        base_location: result.data.base_location || null,
        service_region: result.data.service_region || null,
        closest_airports: result.data.closest_airports || null,
        rate_full_day: result.data.rate_full_day ?? null,
        rate_half_day: result.data.rate_half_day ?? null,
        rate_description: result.data.rate_description || null,
        lead_time_days: result.data.lead_time_days,
        license_state: result.data.license_state || null,
        license_expiry: result.data.license_expiry || null,
        insurance_expiry: result.data.insurance_expiry || null,
        insurance_amount: result.data.insurance_amount || null,
        first_aid_expiry: result.data.first_aid_expiry || null,
        has_motorized_vessel: result.data.has_motorized_vessel,
        uscg_license_expiry: result.data.uscg_license_expiry || null,
        status: "draft",
      })
      .select()
      .single();

    if (error) {
      console.error("[guides/profile] Insert error:", error);
      return jsonError("Failed to create guide profile", 500);
    }

    return jsonCreated({ profile });
  } catch (err) {
    console.error("[guides/profile] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}

// PATCH: Update guide profile
export async function PATCH(request: Request) {
  try {
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

    const body = await request.json();
    const admin = createAdminClient();

    // Fetch existing profile
    const { data: existing } = await admin
      .from("guide_profiles")
      .select("id, status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existing) {
      return jsonError("Guide profile not found", 404);
    }

    // Build update object from allowed fields
     
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    const allowedFields = [
      "display_name", "bio", "profile_photo_url", "photos",
      "techniques", "species", "skill_levels", "max_anglers",
      "gear_included", "gear_details", "languages",
      "base_location", "service_region", "closest_airports",
      "rate_full_day", "rate_half_day", "rate_description",
      "lead_time_days", "license_state", "license_expiry",
      "insurance_expiry", "insurance_amount", "first_aid_expiry",
      "has_motorized_vessel", "uscg_license_expiry",
    ];

    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    // Handle status transitions
    // Note: draft → pending now happens via the verification flow (Stripe + Checkr),
    // not via direct profile update. Resubmission after rejection resets to draft.
    if (body.status === "draft" && existing.status === "rejected") {
      updates.status = "draft";
      updates.rejection_reason = null;
    }

    const { data: profile, error } = await admin
      .from("guide_profiles")
      .update(updates)
      .eq("id", existing.id)
      .select()
      .maybeSingle();

    if (error) {
      console.error("[guides/profile] Update error:", error);
      return jsonError("Failed to update guide profile", 500);
    }

    return jsonOk({ profile });
  } catch (err) {
    console.error("[guides/profile] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}
