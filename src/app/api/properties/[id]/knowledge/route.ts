import { jsonError, jsonOk, requireAuth} from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { propertyKnowledgeSchema } from "@/lib/validations/property-knowledge";
import { calculateCompleteness } from "@/lib/utils/knowledge-completeness";
import type { Json } from "@/types/supabase";

/**
 * Check if the user owns the property or is active club staff for a club-created property.
 */
async function canEditKnowledge(
  admin: ReturnType<typeof createAdminClient>,
  propertyId: string,
  userId: string
): Promise<boolean> {
  // Check direct ownership
  const { data: property } = await admin
    .from("properties")
    .select("owner_id, created_by_club_id")
    .eq("id", propertyId)
    .single();

  if (!property) return false;

  // Landowner owns it
  if (property.owner_id === userId) return true;

  // Club staff for club-created property
  if (property.created_by_club_id) {
    const { count } = await admin
      .from("club_memberships")
      .select("id", { count: "exact", head: true })
      .eq("club_id", property.created_by_club_id)
      .eq("user_id", userId)
      .eq("status", "active");

    if ((count ?? 0) > 0) return true;
  }

  // Admin check
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  return profile?.role === "admin";
}

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
      .from("property_knowledge")
      .select("*")
      .eq("property_id", id)
      .maybeSingle();

    if (error) {
      console.error("[knowledge] Fetch error:", error);
      return jsonError("Failed to fetch knowledge profile", 500);
    }

    return jsonOk({ knowledge: data });
  } catch (err) {
    console.error("[knowledge] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: propertyId } = await params;
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

    const admin = createAdminClient();

    // Verify permission
    const allowed = await canEditKnowledge(admin, propertyId, user.id);
    if (!allowed) {
      return jsonError("Forbidden", 403);
    }

    const body = await request.json();
    const result = propertyKnowledgeSchema.safeParse(body);

    if (!result.success) {
      return jsonError(result.error.issues[0]?.message ?? "Invalid input", 400);
    }

    const knowledgeData = result.data;

    // Calculate completeness score
    const completenessScore = calculateCompleteness(knowledgeData);

    const payload = {
      property_id: propertyId,
      water_characteristics: (knowledgeData.water_characteristics ?? null) as Json,
      species_detail: (knowledgeData.species_detail?.length ? knowledgeData.species_detail : null) as Json,
      hatches_and_patterns: (knowledgeData.hatches_and_patterns?.length ? knowledgeData.hatches_and_patterns : null) as Json,
      seasonal_conditions: (knowledgeData.seasonal_conditions ?? null) as Json,
      flow_and_gauge: (knowledgeData.flow_and_gauge ?? null) as Json,
      access_and_logistics: (knowledgeData.access_and_logistics ?? null) as Json,
      regulations_and_rules: (knowledgeData.regulations_and_rules ?? null) as Json,
      equipment_recommendations: (knowledgeData.equipment_recommendations ?? null) as Json,
      safety_and_hazards: (knowledgeData.safety_and_hazards ?? null) as Json,
      amenities: (knowledgeData.amenities ?? null) as Json,
      experience_profile: (knowledgeData.experience_profile ?? null) as Json,
      pressure_and_crowding: (knowledgeData.pressure_and_crowding ?? null) as Json,
      completeness_score: completenessScore,
    };

    // Upsert: insert if no row exists, update if it does
    const { data: existing } = await admin
      .from("property_knowledge")
      .select("id")
      .eq("property_id", propertyId)
      .maybeSingle();

    let data;
    let error;

    if (existing) {
      const res = await admin
        .from("property_knowledge")
        .update(payload)
        .eq("property_id", propertyId)
        .select()
        .single();
      data = res.data;
      error = res.error;
    } else {
      const res = await admin
        .from("property_knowledge")
        .insert(payload)
        .select()
        .single();
      data = res.data;
      error = res.error;
    }

    if (error) {
      console.error("[knowledge] Upsert error:", error);
      return jsonError("Failed to save knowledge profile", 500);
    }

    // Sync denormalized completeness to properties table
    await admin
      .from("properties")
      .update({ knowledge_completeness: completenessScore })
      .eq("id", propertyId);

    return jsonOk({ knowledge: data });
  } catch (err) {
    console.error("[knowledge] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}
