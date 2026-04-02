import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * GET: Return the authenticated user's active corporate membership (if any).
 * Used by the angler dashboard to conditionally show the employee invite section.
 */
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

    // Find active corporate membership for this user
    const { data: membership } = await admin
      .from("club_memberships")
      .select("id, club_id, company_name, clubs(name)")
      .eq("user_id", user.id)
      .eq("membership_type", "corporate")
      .eq("status", "active")
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ membership: null });
    }

    return NextResponse.json({
      membership: {
        membership_id: membership.id,
        club_id: membership.club_id,
        club_name: membership.clubs?.name ?? "Unknown Club",
        company_name: membership.company_name ?? "",
      },
    });
  } catch (err) {
    console.error("[anglers/corporate-membership] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
