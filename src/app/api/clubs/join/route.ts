import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const joinSchema = z.object({
  club_id: z.string().uuid(),
});

// POST: Request to join a club
export async function POST(request: Request) {
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

    const { club_id } = parsed.data;
    const admin = createAdminClient();

    // Check club exists
    const { data: club } = await admin
      .from("clubs")
      .select("id, name")
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

      return NextResponse.json({
        success: true,
        message: `Join request sent to ${club.name}`,
      });
    }

    // Create new membership request
    const { error: insertError } = await admin
      .from("club_memberships")
      .insert({
        club_id,
        user_id: user.id,
        role: "member",
        status: "pending",
        invited_email: user.email,
      });

    if (insertError) {
      console.error("[clubs/join] Insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to submit join request" },
        { status: 500 }
      );
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
