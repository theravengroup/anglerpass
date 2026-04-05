import { jsonError, jsonOk, escapeIlike } from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// GET: Search for anglers by name (guide-only)
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return jsonError("Unauthorized", 401);
    }

    const admin = createAdminClient();

    // Verify user is an approved guide
    const { data: guideProfile } = await admin
      .from("guide_profiles")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "approved")
      .single();

    if (!guideProfile) {
      return jsonError("Only approved guides can search for anglers", 403);
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query")?.trim();

    if (!query || query.length < 1) {
      return jsonError("Search query is required", 400);
    }

    if (query.length > 200) {
      return jsonError("Search query is too long", 400);
    }

    const escaped = escapeIlike(query);

    // Search profiles that have 'angler' in their roles array
    // The profiles table has a `roles` text[] column (migration 00016)
    const { data: profiles, error } = await admin
      .from("profiles")
      .select("id, display_name")
      .contains("roles", ["angler"])
      .ilike("display_name", `%${escaped}%`)
      .limit(20);

    if (error) {
      console.error("[proposals] Angler search error:", error);
      return jsonError("Failed to search anglers", 500);
    }

    return jsonOk({ anglers: profiles ?? [] });
  } catch (err) {
    console.error("[proposals] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}
