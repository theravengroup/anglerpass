import { jsonError, jsonOk, requireAuth} from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import { rateLimit, getClientIp } from "@/lib/api/rate-limit";

const SWITCHABLE_ROLES = ["landowner", "club_admin", "angler", "guide"] as const;

const switchRoleSchema = z.object({
  role: z.enum(SWITCHABLE_ROLES),
});

const addRoleSchema = z.object({
  role: z.enum(SWITCHABLE_ROLES),
});

// PATCH: Switch active role (must already have this role)
export async function PATCH(request: Request) {
  const limited = rateLimit("role-switch", getClientIp(request), 10, 60_000);
  if (limited) return limited;

  try {
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

    const body = await request.json();
    const parsed = switchRoleSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError("Invalid role", 400);
    }

    const admin = createAdminClient();

    // Fetch current roles
    const { data: profile } = await admin
      .from("profiles")
      .select("roles")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return jsonError("Profile not found", 404);
    }

    const roles: string[] = profile.roles ?? [];

    if (!roles.includes(parsed.data.role)) {
      return jsonError("You don't have this role. Add it first.", 403);
    }

    // Update active role
    const { error: updateError } = await admin
      .from("profiles")
      .update({ role: parsed.data.role })
      .eq("id", user.id);

    if (updateError) {
      console.error("[profile/role] Switch error:", updateError);
      return jsonError("Failed to switch role", 500);
    }

    return jsonOk({
      success: true,
      active_role: parsed.data.role,
    });
  } catch (err) {
    console.error("[profile/role] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}

// POST: Add a new role to the user's roles array
export async function POST(request: Request) {
  try {
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

    const body = await request.json();
    const parsed = addRoleSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError("Invalid role", 400);
    }

    const admin = createAdminClient();

    // Fetch current roles
    const { data: profile } = await admin
      .from("profiles")
      .select("roles")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return jsonError("Profile not found", 404);
    }

    const roles: string[] = profile.roles ?? [];

    if (roles.includes(parsed.data.role)) {
      return jsonError("You already have this role", 409);
    }

    // Add role and switch to it
    const newRoles = [...roles, parsed.data.role];
    const { error: updateError } = await admin
      .from("profiles")
      .update({ roles: newRoles, role: parsed.data.role })
      .eq("id", user.id);

    if (updateError) {
      console.error("[profile/role] Add role error:", updateError);
      return jsonError("Failed to add role", 500);
    }

    return jsonOk({
      success: true,
      roles: newRoles,
      active_role: parsed.data.role,
    });
  } catch (err) {
    console.error("[profile/role] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}
