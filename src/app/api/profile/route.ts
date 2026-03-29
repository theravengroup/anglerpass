import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { profileUpdateSchema } from "@/lib/validations/profile";

// GET: Fetch current user's full profile
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

    // Fetch profile
    const { data: profile, error } = await admin
      .from("profiles")
      .select(
        "id, display_name, role, bio, location, avatar_url, fishing_experience, favorite_species, created_at"
      )
      .eq("id", user.id)
      .single();

    if (error || !profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    // Fetch club memberships
    const { data: memberships } = await admin
      .from("club_memberships")
      .select(
        "id, role, status, joined_at, clubs:club_id (id, name, logo_url, location)"
      )
      .eq("user_id", user.id)
      .in("status", ["active", "pending"]);

    return NextResponse.json({
      profile: {
        ...profile,
        email: user.email ?? null,
      },
      memberships: memberships ?? [],
    });
  } catch (err) {
    console.error("[profile] GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH: Update current user's profile
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
    const parsed = profileUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data: updated, error } = await admin
      .from("profiles")
      .update(parsed.data)
      .eq("id", user.id)
      .select(
        "id, display_name, role, bio, location, avatar_url, fishing_experience, favorite_species"
      )
      .single();

    if (error) {
      console.error("[profile] PATCH error:", error);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile: updated });
  } catch (err) {
    console.error("[profile] PATCH unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
