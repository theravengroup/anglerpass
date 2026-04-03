import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { guideProfileSchema } from "@/lib/validations/guides";

// GET: Fetch current user's guide profile
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    const { data: profile, error } = await admin
      .from("guide_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("[guides/profile] Fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch guide profile" },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { error: "Guide profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ profile });
  } catch (err) {
    console.error("[guides/profile] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Create guide profile
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
    const result = guideProfileSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Check if guide profile already exists
    const { data: existing } = await admin
      .from("guide_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Guide profile already exists. Use PATCH to update." },
        { status: 409 }
      );
    }

    // Add 'guide' to user's roles if not present
    const { data: userProfile } = await admin
      .from("profiles")
      .select("roles")
      .eq("id", user.id)
      .single();

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
      return NextResponse.json(
        { error: "Failed to create guide profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile }, { status: 201 });
  } catch (err) {
    console.error("[guides/profile] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH: Update guide profile
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const admin = createAdminClient();

    // Fetch existing profile
    const { data: existing } = await admin
      .from("guide_profiles")
      .select("id, status")
      .eq("user_id", user.id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: "Guide profile not found" },
        { status: 404 }
      );
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
      .single();

    if (error) {
      console.error("[guides/profile] Update error:", error);
      return NextResponse.json(
        { error: "Failed to update guide profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile });
  } catch (err) {
    console.error("[guides/profile] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
