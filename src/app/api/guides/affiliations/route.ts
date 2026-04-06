import { jsonCreated, jsonError, jsonOk } from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { guideAffiliationSchema } from "@/lib/validations/guides";
import { notifyGuideAffiliationRequested } from "@/lib/notifications";

// GET: List current guide's affiliations with club details
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return jsonError("Unauthorized", 401);
    }

    const admin = createAdminClient();

    const { data: profile } = await admin
      .from("guide_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return jsonError("Guide profile not found", 404);
    }

    const { data: affiliations, error } = await admin
      .from("guide_club_affiliations")
      .select(
        "id, club_id, status, label, created_at, updated_at, clubs(id, name, logo_url, location)"
      )
      .eq("guide_id", profile.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[guides/affiliations] Fetch error:", error);
      return jsonError("Failed to fetch affiliations", 500);
    }

    return jsonOk({ affiliations: affiliations ?? [] });
  } catch (err) {
    console.error("[guides/affiliations] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}

// POST: Request affiliation with a club
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return jsonError("Unauthorized", 401);
    }

    const body = await request.json();
    const result = guideAffiliationSchema.safeParse(body);

    if (!result.success) {
      return jsonError(
        result.error.issues[0]?.message ?? "Invalid input",
        400
      );
    }

    const admin = createAdminClient();

    // Verify guide profile exists
    const { data: profile } = await admin
      .from("guide_profiles")
      .select("id, display_name, status")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return jsonError("Guide profile not found", 404);
    }

    const { club_id } = result.data;

    // Verify club exists
    const { data: club } = await admin
      .from("clubs")
      .select("id, owner_id, name")
      .eq("id", club_id)
      .single();

    if (!club) {
      return jsonError("Club not found", 404);
    }

    // Check for existing affiliation
    const { data: existing } = await admin
      .from("guide_club_affiliations")
      .select("id, status")
      .eq("guide_id", profile.id)
      .eq("club_id", club_id)
      .maybeSingle();

    if (existing) {
      return jsonError(
        `You already have a ${existing.status} affiliation with this club`,
        409
      );
    }

    // Create affiliation
    const { data: affiliation, error } = await admin
      .from("guide_club_affiliations")
      .insert({
        guide_id: profile.id,
        club_id,
        status: "pending",
      })
      .select(
        "id, club_id, status, label, created_at, clubs(id, name, logo_url, location)"
      )
      .single();

    if (error) {
      console.error("[guides/affiliations] Insert error:", error);
      return jsonError("Failed to create affiliation request", 500);
    }

    // Notify club manager
    notifyGuideAffiliationRequested(admin, {
      clubOwnerId: club.owner_id,
      guideName: profile.display_name,
      clubName: club.name,
    }).catch((err) =>
      console.error("[guides/affiliations] Notification error:", err)
    );

    return jsonCreated({ affiliation });
  } catch (err) {
    console.error("[guides/affiliations] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}
