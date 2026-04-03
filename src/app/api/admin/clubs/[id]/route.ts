import { requireAdmin, jsonError, jsonOk } from "@/lib/api/helpers";
import { z } from "zod";
import type { Json } from "@/types/supabase";

const updateClubSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  location: z.string().max(500).nullable().optional(),
  rules: z.string().max(5000).nullable().optional(),
  website: z.string().url().max(500).nullable().optional(),
  subscription_tier: z.enum(["starter", "standard", "pro"]).optional(),
});

// ─── GET: Single club with members and properties ────────────────────

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth) return jsonError("Forbidden", 403);

    const { admin } = auth;
    const { id } = await params;

    // Fetch club
    const { data: club, error: clubError } = await admin
      .from("clubs")
      .select("*")
      .eq("id", id)
      .single();

    if (clubError || !club) {
      return jsonError("Club not found", 404);
    }

    // Resolve owner info
    let ownerName: string | null = null;
    let ownerEmail: string | null = null;

    const { data: ownerProfile } = await admin
      .from("profiles")
      .select("display_name")
      .eq("id", club.owner_id)
      .single();

    ownerName = ownerProfile?.display_name ?? null;

    const { data: ownerAuth } = await admin.auth.admin.getUserById(club.owner_id);
    ownerEmail = ownerAuth?.user?.email ?? null;

    // Fetch members with profile info
    const { data: memberships } = await admin
      .from("club_memberships")
      .select("id, user_id, role, status, invited_email, joined_at, created_at")
      .eq("club_id", id)
      .order("created_at", { ascending: false });

    // Resolve member display names and emails
    const memberUserIds = [
      ...new Set(
        (memberships ?? [])
          .map((m: { user_id: string | null }) => m.user_id)
          .filter((uid): uid is string => uid !== null)
      ),
    ];

    let memberProfileMap: Record<string, string> = {};
    if (memberUserIds.length > 0) {
      const { data: profiles } = await admin
        .from("profiles")
        .select("id, display_name")
        .in("id", memberUserIds);

      memberProfileMap = (profiles ?? []).reduce(
        (acc: Record<string, string>, p: { id: string; display_name: string | null }) => {
          acc[p.id] = p.display_name ?? "Unknown";
          return acc;
        },
        {}
      );
    }

    const memberEmailMap: Record<string, string> = {};
    for (const uid of memberUserIds) {
      const { data: authData } = await admin.auth.admin.getUserById(uid);
      if (authData?.user?.email) {
        memberEmailMap[uid] = authData.user.email;
      }
    }

    const members = (memberships ?? []).map((m) => ({
        id: m.id,
        user_id: m.user_id,
        display_name: m.user_id ? memberProfileMap[m.user_id] ?? null : null,
        email: m.user_id
          ? memberEmailMap[m.user_id] ?? null
          : m.invited_email ?? null,
        role: m.role,
        status: m.status,
        joined_at: m.joined_at,
        created_at: m.created_at,
      })
    );

    // Fetch property access records
    const { data: propertyAccess } = await admin
      .from("club_property_access")
      .select("id, property_id, status, approved_at, created_at")
      .eq("club_id", id)
      .order("created_at", { ascending: false });

    // Resolve property names
    const propertyIds = [
      ...new Set(
        (propertyAccess ?? [])
          .map((pa: { property_id: string }) => pa.property_id)
          .filter((pid): pid is string => pid !== null)
      ),
    ];

    let propertyMap: Record<string, { name: string; status: string }> = {};
    if (propertyIds.length > 0) {
      const { data: properties } = await admin
        .from("properties")
        .select("id, name, status")
        .in("id", propertyIds);

      propertyMap = (properties ?? []).reduce(
        (
          acc: Record<string, { name: string; status: string }>,
          p: { id: string; name: string; status: string }
        ) => {
          acc[p.id] = { name: p.name, status: p.status };
          return acc;
        },
        {}
      );
    }

    const properties = (propertyAccess ?? []).map(
      (pa: {
        id: string;
        property_id: string;
        status: string;
        approved_at: string | null;
        created_at: string;
      }) => ({
        id: pa.id,
        property_id: pa.property_id,
        property_name: propertyMap[pa.property_id]?.name ?? "Unknown",
        property_status: propertyMap[pa.property_id]?.status ?? "unknown",
        access_status: pa.status,
        approved_at: pa.approved_at,
        created_at: pa.created_at,
      })
    );

    return jsonOk({
      club: {
        ...club,
        owner_name: ownerName,
        owner_email: ownerEmail,
      },
      members,
      properties,
    });
  } catch (err) {
    console.error("[admin/clubs] Error:", err);
    return jsonError("Internal server error", 500);
  }
}

// ─── PATCH: Update club details ──────────────────────────────────────

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth) return jsonError("Forbidden", 403);

    const { user, admin } = auth;
    const { id } = await params;

    // Parse and validate body
    const body = await request.json();
    const parsed = updateClubSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid input", 400);
    }

    const updates = parsed.data;

    if (Object.keys(updates).length === 0) {
      return jsonError("No fields to update", 400);
    }

    // Fetch current club for audit log
    const { data: existing, error: fetchError } = await admin
      .from("clubs")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return jsonError("Club not found", 404);
    }

    // Build old_data for audit
    const oldData: Record<string, string | number | boolean | null> = {};
    for (const key of Object.keys(updates)) {
      oldData[key] = existing[key as keyof typeof existing];
    }

    // Update the club
    const { data: updated, error: updateError } = await admin
      .from("clubs")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("[admin/clubs] Update error:", updateError);
      return jsonError("Failed to update club", 500);
    }

    // Create audit log entry
    await admin.from("audit_log").insert({
      actor_id: user.id,
      action: "club.updated",
      entity_type: "club",
      entity_id: id,
      old_data: oldData as Json,
      new_data: updates as Json,
    });

    return jsonOk({ club: updated });
  } catch (err) {
    console.error("[admin/clubs] Error:", err);
    return jsonError("Internal server error", 500);
  }
}
