import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { clubSchema } from "@/lib/validations/clubs";

// POST: Create a new club
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
    const result = clubSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Check if user already owns a club
    const { data: existingClub } = await admin
      .from("clubs")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (existingClub) {
      return NextResponse.json(
        { error: "You already have a club. You can manage it from your dashboard." },
        { status: 409 }
      );
    }

    const { name, description, location, rules, website } = result.data;

    // Create the club
    const { data: club, error: insertError } = await admin
      .from("clubs")
      .insert({
        owner_id: user.id,
        name,
        description: description || null,
        location: location || null,
        rules: rules || null,
        website: website || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("[clubs] Insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to create club" },
        { status: 500 }
      );
    }

    // Auto-create admin membership for the owner
    const { error: memberError } = await admin
      .from("club_memberships")
      .insert({
        club_id: club.id,
        user_id: user.id,
        role: "admin",
        status: "active",
        joined_at: new Date().toISOString(),
      });

    if (memberError) {
      console.error("[clubs] Membership insert error:", memberError);
      // Don't fail — club was created, membership is a secondary concern
    }

    // If an invitation token was provided, link the club to the invitation
    // and create a pending property association
    const invitationToken = body.invitation_token;
    if (invitationToken) {
      const { data: invitation } = await admin
        .from("club_invitations")
        .select("id, property_id, invited_by, status")
        .eq("token", invitationToken)
        .eq("status", "sent")
        .maybeSingle();

      if (invitation) {
        // Update the invitation: link to club and mark accepted
        await admin
          .from("club_invitations")
          .update({
            club_id: club.id,
            status: "accepted",
            updated_at: new Date().toISOString(),
          })
          .eq("id", invitation.id);

        // Create a club–property access record (auto-approved since landowner invited)
        await admin
          .from("club_property_access")
          .insert({
            club_id: club.id,
            property_id: invitation.property_id,
            status: "approved",
            requested_by: invitation.invited_by,
            approved_at: new Date().toISOString(),
          });
      }
    }

    // Check for angler club invitations: anglers who invited this club admin
    // and auto-link them as members
    try {
      const clubAdminEmail = user.email;
      if (clubAdminEmail) {
        const { data: anglerInvitations } = await admin
          .from("angler_club_invitations")
          .select("id, angler_id")
          .eq("admin_email", clubAdminEmail)
          .eq("status", "sent");

        if (anglerInvitations && anglerInvitations.length > 0) {
          for (const inv of anglerInvitations) {
            // Mark invitation as accepted
            await admin
              .from("angler_club_invitations")
              .update({
                status: "accepted",
                club_id: club.id,
                updated_at: new Date().toISOString(),
              })
              .eq("id", inv.id);

            // Create active membership for the angler
            await admin
              .from("club_memberships")
              .insert({
                club_id: club.id,
                user_id: inv.angler_id,
                role: "member",
                status: "active",
                joined_at: new Date().toISOString(),
              })
              .select()
              .single()
              .then(({ error: memErr }) => {
                if (memErr) {
                  // May fail if duplicate — that's fine
                  console.error("[clubs] Angler membership insert:", memErr.message);
                }
              });

            // Notify the angler that their club joined
            await admin.from("notifications").insert({
              user_id: inv.angler_id,
              type: "membership_activated",
              title: `${club.name} joined AnglerPass!`,
              body: `Great news — ${club.name} just set up their club on AnglerPass. Your membership is now active and you can start booking fishing days.`,
              link: "/angler",
              metadata: { club_id: club.id },
            });
          }
        }
      }
    } catch (anglerErr) {
      console.error("[clubs] Angler invitation linking error:", anglerErr);
      // Don't fail club creation for this
    }

    return NextResponse.json({ club }, { status: 201 });
  } catch (err) {
    console.error("[clubs] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET: List clubs for the current user (owned or member of)
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // Get clubs the user owns
    const { data: ownedClubs, error: ownedError } = await admin
      .from("clubs")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    if (ownedError) {
      console.error("[clubs] Fetch owned error:", ownedError);
      return NextResponse.json(
        { error: "Failed to fetch clubs" },
        { status: 500 }
      );
    }

    // Get clubs the user is a member/staff of (but doesn't own)
    const { data: memberships, error: memberError } = await admin
      .from("club_memberships")
      .select("club_id, role, status, clubs(*)")
      .eq("user_id", user.id)
      .eq("status", "active")
      .neq("role", "admin"); // Skip admin memberships since those are the owned clubs

    if (memberError) {
      console.error("[clubs] Fetch memberships error:", memberError);
    }

    const staffClubs = (memberships ?? [])
      .filter((m) => m.role === "staff")
      .map((m) => m.clubs)
      .filter(Boolean);

    const memberClubs = (memberships ?? [])
      .filter((m) => m.role === "member")
      .map((m) => m.clubs)
      .filter(Boolean);

    return NextResponse.json({
      owned: ownedClubs ?? [],
      staff_of: staffClubs,
      member_of: memberClubs,
    });
  } catch (err) {
    console.error("[clubs] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
