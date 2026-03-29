import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET: Fetch invitation details by token (public — used during signup flow)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data: invitation, error } = await admin
      .from("club_invitations")
      .select("club_name, status, properties(name)")
      .eq("token", token)
      .single();

    if (error || !invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    if (invitation.status !== "sent") {
      return NextResponse.json(
        { error: "This invitation has already been used" },
        { status: 410 }
      );
    }

    return NextResponse.json({
      club_name: invitation.club_name,
      property_name:
        (invitation.properties as { name: string } | null)?.name ?? null,
    });
  } catch (err) {
    console.error("[clubs/invitation-details] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
