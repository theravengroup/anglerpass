import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError, requireAuth } from "@/lib/api/helpers";

const claimSchema = z.object({
  token: z.string().uuid("Invalid claim token"),
});

/**
 * POST /api/properties/claim
 * Claim ownership of a property using an invitation token.
 * The authenticated user becomes the property owner.
 */
export async function POST(request: Request) {
  const auth = await requireAuth();
  if (!auth) return jsonError("Unauthorized", 401);

  const body = await request.json();
  const result = claimSchema.safeParse(body);
  if (!result.success) {
    return jsonError(result.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const admin = createAdminClient();

  // Find the invitation
  const { data: invitation } = await admin
    .from("property_claim_invitations")
    .select("id, property_id, club_id, status")
    .eq("token", result.data.token)
    .single();

  if (!invitation) {
    return jsonError("Invalid or expired invitation", 404);
  }

  if (invitation.status !== "pending") {
    return jsonError("This invitation has already been used", 400);
  }

  // Verify the property still has no owner
  const { data: property } = await admin
    .from("properties")
    .select("id, name, owner_id")
    .eq("id", invitation.property_id)
    .single();

  if (!property) {
    return jsonError("Property not found", 404);
  }

  if (property.owner_id) {
    return jsonError("This property already has an owner", 400);
  }

  // Claim the property — assign ownership to current user
  const { error: updateError } = await admin
    .from("properties")
    .update({ owner_id: auth.user.id })
    .eq("id", invitation.property_id);

  if (updateError) {
    console.error("[claim] Property update error:", updateError);
    return jsonError("Failed to claim property", 500);
  }

  // Mark the invitation as claimed
  await admin
    .from("property_claim_invitations")
    .update({
      status: "claimed",
      claimed_at: new Date().toISOString(),
      claimed_by: auth.user.id,
    })
    .eq("id", invitation.id);

  // Ensure the user has a profile with landowner role
  const { data: profile } = await admin
    .from("profiles")
    .select("id, role, roles")
    .eq("id", auth.user.id)
    .single();

  if (profile) {
    const roles = (profile.roles as string[]) ?? [];
    if (!roles.includes("landowner")) {
      await admin
        .from("profiles")
        .update({
          roles: [...roles, "landowner"],
          // If no primary role set, default to landowner
          ...(profile.role === "angler" ? { role: "landowner" } : {}),
        })
        .eq("id", auth.user.id);
    }
  }

  return jsonOk({
    property: { id: property.id, name: property.name },
    message: "Property claimed successfully. Complete Stripe Connect onboarding to go live.",
  });
}

/**
 * GET /api/properties/claim?token=xxx
 * Look up invitation details by token (public, no auth required).
 * Used by the claim page to show property info before sign-in.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) return jsonError("Token is required", 400);

  const admin = createAdminClient();

  const { data: invitation } = await admin
    .from("property_claim_invitations")
    .select("id, property_id, club_id, status, landowner_email")
    .eq("token", token)
    .single();

  if (!invitation) {
    return jsonError("Invalid or expired invitation", 404);
  }

  // Get property and club details
  const [{ data: property }, { data: club }] = await Promise.all([
    admin
      .from("properties")
      .select("id, name, location_description, photos, water_type")
      .eq("id", invitation.property_id)
      .single(),
    admin
      .from("clubs")
      .select("id, name")
      .eq("id", invitation.club_id)
      .single(),
  ]);

  return jsonOk({
    invitation: {
      status: invitation.status,
      landowner_email: invitation.landowner_email,
    },
    property: property
      ? {
          id: property.id,
          name: property.name,
          location_description: property.location_description,
          photo: (property.photos as string[])?.[0] ?? null,
          water_type: property.water_type,
        }
      : null,
    club: club ? { name: club.name } : null,
  });
}
