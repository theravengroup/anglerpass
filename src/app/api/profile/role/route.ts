import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const SWITCHABLE_ROLES = ["landowner", "club_admin", "angler", "guide"] as const;

const switchRoleSchema = z.object({
  role: z.enum(SWITCHABLE_ROLES),
});

const addRoleSchema = z.object({
  role: z.enum(SWITCHABLE_ROLES),
});

// PATCH: Switch active role (must already have this role)
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
    const parsed = switchRoleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Fetch current roles
    const { data: profile } = await admin
      .from("profiles")
      .select("roles")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    const roles: string[] = profile.roles ?? [];

    if (!roles.includes(parsed.data.role)) {
      return NextResponse.json(
        { error: "You don't have this role. Add it first." },
        { status: 403 }
      );
    }

    // Update active role
    const { error: updateError } = await admin
      .from("profiles")
      .update({ role: parsed.data.role })
      .eq("id", user.id);

    if (updateError) {
      console.error("[profile/role] Switch error:", updateError);
      return NextResponse.json(
        { error: "Failed to switch role" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      active_role: parsed.data.role,
    });
  } catch (err) {
    console.error("[profile/role] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Add a new role to the user's roles array
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
    const parsed = addRoleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Fetch current roles
    const { data: profile } = await admin
      .from("profiles")
      .select("roles")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    const roles: string[] = profile.roles ?? [];

    if (roles.includes(parsed.data.role)) {
      return NextResponse.json(
        { error: "You already have this role" },
        { status: 409 }
      );
    }

    // Add role and switch to it
    const newRoles = [...roles, parsed.data.role];
    const { error: updateError } = await admin
      .from("profiles")
      .update({ roles: newRoles, role: parsed.data.role })
      .eq("id", user.id);

    if (updateError) {
      console.error("[profile/role] Add role error:", updateError);
      return NextResponse.json(
        { error: "Failed to add role" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      roles: newRoles,
      active_role: parsed.data.role,
    });
  } catch (err) {
    console.error("[profile/role] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
