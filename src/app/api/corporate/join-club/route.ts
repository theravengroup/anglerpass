import { createAdminClient } from "@/lib/supabase/admin";
import { jsonCreated, jsonError, requireAuth } from "@/lib/api/helpers";
import { z } from "zod";

const joinClubSchema = z.object({
  club_id: z.string().uuid(),
  company_name: z.string().min(1).max(300),
});

/**
 * POST /api/corporate/join-club
 *
 * Corporate user requests to join a club. Creates a club_membership with
 * membership_type='corporate' and status='pending'. Also creates a
 * membership_application if the club requires it.
 *
 * Body: { club_id: string, company_name: string }
 */
export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (!auth) return jsonError("Unauthorized", 401);

    const body = await request.json();
    const parsed = joinClubSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(
        parsed.error.issues[0]?.message ?? "Invalid input",
        400
      );
    }

    const { club_id, company_name } = parsed.data;
    const admin = createAdminClient();

    // Check if user already has an active or pending corporate membership
    const { data: existingMemberships } = await admin
      .from("club_memberships")
      .select("id, club_id, status")
      .eq("user_id", auth.user.id)
      .eq("membership_type", "corporate")
      .in("status", ["active", "pending"]);

    const activeMembership = (existingMemberships ?? []).find(
      (m) => m.status === "active"
    );
    if (activeMembership) {
      return jsonError("You already have an active corporate membership", 409);
    }

    const pendingMembership = (existingMemberships ?? []).find(
      (m) => m.status === "pending"
    );
    if (pendingMembership) {
      return jsonError(
        "You already have a pending corporate membership request. Please wait for it to be reviewed.",
        409
      );
    }

    // Check club exists and has corporate memberships enabled
    const { data: club } = await admin
      .from("clubs")
      .select(
        "id, name, corporate_memberships_enabled, membership_application_required"
      )
      .eq("id", club_id)
      .maybeSingle();

    if (!club) {
      return jsonError("Club not found", 404);
    }

    if (!club.corporate_memberships_enabled) {
      return jsonError(
        "This club does not offer corporate memberships",
        400
      );
    }

    // Create corporate membership record
    const { data: membership, error: insertError } = await admin
      .from("club_memberships")
      .insert({
        club_id,
        user_id: auth.user.id,
        role: "member",
        status: "pending",
        dues_status: "pending",
        membership_type: "corporate",
        company_name,
        invited_email: auth.user.email,
      })
      .select()
      .maybeSingle();

    if (insertError) {
      console.error("[corporate/join-club] Insert error:", insertError);
      return jsonError("Failed to submit corporate join request", 500);
    }

    // If club requires an application, create one
    if (club.membership_application_required && membership) {
      const { error: appError } = await admin
        .from("membership_applications")
        .insert({
          club_id,
          user_id: auth.user.id,
          membership_id: membership.id,
          status: "pending",
          application_type: "corporate",
        });

      if (appError) {
        console.error(
          "[corporate/join-club] Application insert error:",
          appError
        );
        // Membership was created successfully; log but don't fail the request
      }
    }

    return jsonCreated({ membership });
  } catch (err) {
    console.error("[corporate/join-club] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}
