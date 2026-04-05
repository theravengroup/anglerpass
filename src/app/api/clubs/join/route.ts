import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = joinSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid club ID" },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: "Club not found" },
        { status: 404 }
      );
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
      return NextResponse.json(
        {
          error:
            "You already have a home club. Through the Cross-Club Network, you can fish at partner clubs without needing to join them.",
        },
        { status: 409 }
      );
    }

    if (pendingClub && pendingClub.club_id !== club_id) {
      return NextResponse.json(
        {
          error:
            "You already have a pending club request. Please wait for it to be approved or contact the club to withdraw it first.",
        },
        { status: 409 }
      );
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
        return NextResponse.json(
          { error: "You are already a member of this club" },
          { status: 409 }
        );
      }
      if (existing.status === "pending") {
        return NextResponse.json(
          { error: "Your request to join is already pending" },
          { status: 409 }
        );
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

      return NextResponse.json({
        success: true,
        message: `Join request sent to ${club.name}`,
      });
    }

    // Resolve referral code if provided
    // Uses raw PostgREST because referral_code column is added by migration 00041
    let referredBy: string | null = null;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (referral_code && supabaseUrl && serviceKey) {
      try {
        const refUrl = new URL(`${supabaseUrl}/rest/v1/club_memberships`);
        refUrl.searchParams.set("select", "id,user_id");
        refUrl.searchParams.set("referral_code", `eq.${referral_code}`);
        refUrl.searchParams.set("club_id", `eq.${club_id}`);
        refUrl.searchParams.set("status", "eq.active");
        refUrl.searchParams.set("limit", "1");

        const refRes = await fetch(refUrl.toString(), {
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
          },
        });

        if (refRes.ok) {
          const rows = await refRes.json();
          const referrer = rows?.[0];
          if (referrer && referrer.user_id !== user.id) {
            referredBy = referrer.id;
          }
        }
      } catch (err) {
        console.error("[clubs/join] Referral lookup error:", err);
      }
    }

    // Create new membership request
    const insertPayload: Record<string, unknown> = {
      club_id,
      user_id: user.id,
      role: "member",
      status: "pending",
      invited_email: user.email,
    };

    // Add referred_by if resolved (column added by migration 00041)
    if (referredBy) {
      insertPayload.referred_by = referredBy;
    }

    // Insert via raw PostgREST to include referred_by column
    let newMembershipId: string | null = null;

    if (referredBy && supabaseUrl && serviceKey) {
      // Use raw insert when we have referral data (to include referred_by column)
      const insertRes = await fetch(`${supabaseUrl}/rest/v1/club_memberships`, {
        method: "POST",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(insertPayload),
      });

      if (!insertRes.ok) {
        console.error("[clubs/join] Insert error:", await insertRes.text());
        return NextResponse.json(
          { error: "Failed to submit join request" },
          { status: 500 }
        );
      }

      const inserted = await insertRes.json();
      newMembershipId = inserted?.[0]?.id ?? null;
    } else {
      // Standard typed insert when no referral
      const { data: newMembership, error: insertError } = await admin
        .from("club_memberships")
        .insert({
          club_id,
          user_id: user.id,
          role: "member",
          status: "pending",
          invited_email: user.email,
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("[clubs/join] Insert error:", insertError);
        return NextResponse.json(
          { error: "Failed to submit join request" },
          { status: 500 }
        );
      }

      newMembershipId = newMembership?.id ?? null;
    }

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
    if (referredBy && newMembershipId && supabaseUrl && serviceKey) {
      try {
        // Look up club referral settings
        const settingsUrl = new URL(`${supabaseUrl}/rest/v1/clubs`);
        settingsUrl.searchParams.set("select", "referral_program_enabled,referral_reward");
        settingsUrl.searchParams.set("id", `eq.${club_id}`);
        settingsUrl.searchParams.set("limit", "1");

        const settingsRes = await fetch(settingsUrl.toString(), {
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
          },
        });

        if (settingsRes.ok) {
          const clubs = await settingsRes.json();
          const clubSettings = clubs?.[0];

          if (clubSettings?.referral_program_enabled && Number(clubSettings.referral_reward) > 0) {
            await fetch(`${supabaseUrl}/rest/v1/referral_credits`, {
              method: "POST",
              headers: {
                apikey: serviceKey,
                Authorization: `Bearer ${serviceKey}`,
                "Content-Type": "application/json",
                Prefer: "return=minimal",
              },
              body: JSON.stringify({
                club_id,
                referrer_membership_id: referredBy,
                referred_membership_id: newMembershipId,
                amount: Number(clubSettings.referral_reward),
                status: "pending",
              }),
            });
          }
        }
      } catch (err) {
        console.error("[clubs/join] Referral credit creation error:", err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Join request sent to ${club.name}`,
    });
  } catch (err) {
    console.error("[clubs/join] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
