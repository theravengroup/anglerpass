import { jsonError, jsonOk, requireAuth} from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/supabase";
import { z } from "zod";
import { rateLimit, getClientIp } from "@/lib/api/rate-limit";

const joinSchema = z.object({
  club_id: z.uuid(),
  referral_code: z.string().max(20).optional(),
  application_note: z.string().max(2000).optional(),
});

// POST: Request to join a club
export async function POST(request: Request) {
  const limited = rateLimit("clubs-join", getClientIp(request), 5, 60_000);
  if (limited) return limited;

  try {
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

    const body = await request.json();
    const parsed = joinSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError("Invalid club ID", 400);
    }

    const { club_id, referral_code, application_note } = parsed.data;
    const admin = createAdminClient();

    // Check club exists (include application settings)
    const { data: club } = await admin
      .from("clubs")
      .select("id, name, membership_application_required")
      .eq("id", club_id)
      .single();

    if (!club) {
      return jsonError("Club not found", 404);
    }

    // Enforce one home club: check if user already has an active or pending membership
    const { data: allMemberships } = await admin
      .from("club_memberships")
      .select("id, club_id, status")
      .eq("user_id", user.id)
      .in("status", ["active", "pending"]);

    const activeClub = (allMemberships ?? []).find(
      (m) => m.status === "active"
    );
    const pendingClub = (allMemberships ?? []).find(
      (m) => m.status === "pending"
    );

    if (activeClub && activeClub.club_id !== club_id) {
      return jsonError("You already have a home club. Through the Cross-Club Network, you can fish at partner clubs without needing to join them.", 409);
    }

    if (pendingClub && pendingClub.club_id !== club_id) {
      return jsonError("You already have a pending club request. Please wait for it to be approved or contact the club to withdraw it first.", 409);
    }

    // Check if already a member of THIS club
    const { data: existing } = await admin
      .from("club_memberships")
      .select("id, status")
      .eq("club_id", club_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      if (existing.status === "active") {
        return jsonError("You are already a member of this club", 409);
      }
      if (existing.status === "pending") {
        return jsonError("Your request to join is already pending", 409);
      }
      // If declined or inactive, update to pending
      await admin
        .from("club_memberships")
        .update({ status: "pending", updated_at: new Date().toISOString() })
        .eq("id", existing.id);

      // Also create/update application record
      if (club.membership_application_required !== false) {
        const { data: existingApp } = await admin
          .from("membership_applications")
          .select("id")
          .eq("club_id", club_id)
          .eq("user_id", user.id)
          .maybeSingle();

        if (existingApp) {
          await admin
            .from("membership_applications")
            .update({
              status: "pending",
              application_note: application_note ?? null,
              reviewed_by: null,
              reviewed_at: null,
              declined_reason: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingApp.id);
        } else {
          await admin.from("membership_applications").insert({
            club_id,
            user_id: user.id,
            status: "pending",
            application_note: application_note ?? null,
          });
        }
      }

      return jsonOk({
        success: true,
        message: `Join request sent to ${club.name}`,
      });
    }

    // Resolve referral code if provided
    let referredBy: string | null = null;
    const db = createAdminClient();

    if (referral_code) {
      try {
        const { data: referrerRows } = await db
          .from("club_memberships")
          .select("id, user_id")
          .eq("referral_code", referral_code)
          .eq("club_id", club_id)
          .eq("status", "active")
          .limit(1);

        const referrer = (referrerRows as { id: string; user_id: string }[] | null)?.[0];
        if (referrer && referrer.user_id !== user.id) {
          referredBy = referrer.id;
        }
      } catch (err) {
        console.error("[clubs/join] Referral lookup error:", err);
      }
    }

    // Create new membership request
    const insertPayload: Database["public"]["Tables"]["club_memberships"]["Insert"] = {
      club_id,
      user_id: user.id,
      role: "member",
      status: "pending",
      invited_email: user.email,
      ...(referredBy ? { referred_by: referredBy } : {}),
    };

    // Insert membership
    let newMembershipId: string | null = null;

    const { data: insertedRows, error: insertError } = await db
      .from("club_memberships")
      .insert(insertPayload)
      .select("id");

    if (insertError) {
      console.error("[clubs/join] Insert error:", insertError);
      return jsonError("Failed to submit join request", 500);
    }

    newMembershipId = (insertedRows as { id: string }[] | null)?.[0]?.id ?? null;

    // Create membership_application record for clubs that require vetting
    if (club.membership_application_required !== false) {
      // Check if application already exists
      const { data: existingApp } = await admin
        .from("membership_applications")
        .select("id")
        .eq("club_id", club_id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!existingApp) {
        await admin.from("membership_applications").insert({
          club_id,
          user_id: user.id,
          status: "pending",
          application_note: application_note ?? null,
        });
      }
    }

    // Create pending referral credit if referred
    if (referredBy && newMembershipId) {
      try {
        const { data: clubSettings } = await db
          .from("clubs")
          .select("referral_program_enabled, referral_reward")
          .eq("id", club_id)
          .single();

        const settings = clubSettings as {
          referral_program_enabled: boolean;
          referral_reward: number;
        } | null;

        if (settings?.referral_program_enabled && Number(settings.referral_reward) > 0) {
          await db.from("referral_credits").insert({
            club_id,
            referrer_membership_id: referredBy,
            referred_membership_id: newMembershipId,
            amount: Number(settings.referral_reward),
            status: "pending",
          });
        }
      } catch (err) {
        console.error("[clubs/join] Referral credit creation error:", err);
      }
    }

    return jsonOk({
      success: true,
      message: `Join request sent to ${club.name}`,
    });
  } catch (err) {
    console.error("[clubs/join] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}
