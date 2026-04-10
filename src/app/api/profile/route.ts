import { jsonError, jsonOk, requireAuth} from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { profileUpdateSchema } from "@/lib/validations/profile";
import { rateLimit, getClientIp } from "@/lib/api/rate-limit";

// GET: Fetch current user's full profile
export async function GET() {
  try {
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

    const admin = createAdminClient();

    // Fetch profile
    const { data: profile, error } = await admin
      .from("profiles")
      .select(
        "id, display_name, role, bio, location, avatar_url, fishing_experience, favorite_species, created_at"
      )
      .eq("id", user.id)
      .maybeSingle();

    if (error || !profile) {
      return jsonError("Profile not found", 404);
    }

    // Fetch club memberships
    const { data: memberships } = await admin
      .from("club_memberships")
      .select(
        "id, role, status, joined_at, clubs:club_id (id, name, logo_url, location)"
      )
      .eq("user_id", user.id)
      .in("status", ["active", "pending"]);

    return jsonOk({
      profile: {
        ...profile,
        email: user.email ?? null,
      },
      memberships: memberships ?? [],
    });
  } catch (err) {
    console.error("[profile] GET error:", err);
    return jsonError("Internal server error", 500);
  }
}

// PATCH: Update current user's profile
export async function PATCH(request: Request) {
  const limited = rateLimit("profile-update", getClientIp(request), 15, 60_000);
  if (limited) return limited;

  try {
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

    const body = await request.json();
    const parsed = profileUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
    }

    const admin = createAdminClient();

    const { data: updated, error } = await admin
      .from("profiles")
      .update(parsed.data)
      .eq("id", user.id)
      .select(
        "id, display_name, role, bio, location, avatar_url, fishing_experience, favorite_species"
      )
      .maybeSingle();

    if (error) {
      console.error("[profile] PATCH error:", error);
      return jsonError("Failed to update profile", 500);
    }

    return jsonOk({ profile: updated });
  } catch (err) {
    console.error("[profile] PATCH unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}
