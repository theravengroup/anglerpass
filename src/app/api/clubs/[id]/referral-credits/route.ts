import { jsonError, jsonOk, requireAuth} from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createUntypedAdminClient } from "@/lib/supabase/untyped-admin";

// GET: Retrieve referral credit history
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clubId } = await params;
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

    const admin = createAdminClient();
    const db = createUntypedAdminClient();

    // Check if user is club owner
    const { data: club, error: clubErr } = await admin
      .from("clubs")
      .select("id, owner_id")
      .eq("id", clubId)
      .single();

    if (clubErr || !club) {
      return jsonError("Club not found", 404);
    }

    const isOwner = club.owner_id === user.id;

    // Get the user's membership in this club
    const { data: membership } = await admin
      .from("club_memberships")
      .select("id")
      .eq("club_id", clubId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (!isOwner && !membership) {
      return jsonError("Forbidden", 403);
    }

    // Build query for credits
    let query = db
      .from("referral_credits")
      .select("id, amount, status, earned_at, paid_out_at, created_at, referred_membership_id")
      .eq("club_id", clubId)
      .order("created_at", { ascending: false })
      .limit(50);

    // Non-owners only see their own credits
    if (!isOwner && membership) {
      query = query.eq("referrer_membership_id", membership.id);
    }

    const { data: credits } = await query;

    // Batch-fetch referred member names (avoids N+1)
    const referredMembershipIds = (
      (credits ?? []) as { referred_membership_id: string }[]
    ).map((c) => c.referred_membership_id);

    const nameMap: Record<string, string> = {};

    if (referredMembershipIds.length > 0) {
      const { data: memberships } = await admin
        .from("club_memberships")
        .select("id, user_id")
        .in("id", referredMembershipIds);

      const membershipUserMap: Record<string, string> = {};
      for (const m of memberships ?? []) {
        if (m.user_id) membershipUserMap[m.id] = m.user_id;
      }

      const userIds = Object.values(membershipUserMap);

      if (userIds.length > 0) {
        const { data: profiles } = await admin
          .from("profiles")
          .select("id, display_name")
          .in("id", userIds);

        const profileMap: Record<string, string> = {};
        for (const p of profiles ?? []) {
          profileMap[p.id] = p.display_name ?? "New member";
        }

        for (const [membershipId, userId] of Object.entries(membershipUserMap)) {
          nameMap[membershipId] = profileMap[userId] ?? "New member";
        }
      }
    }

    const enrichedCredits = (
      (credits ?? []) as {
        id: string;
        amount: number;
        status: string;
        earned_at: string | null;
        paid_out_at: string | null;
        created_at: string;
        referred_membership_id: string;
      }[]
    ).map((credit) => ({
      id: credit.id,
      amount: credit.amount,
      status: credit.status,
      earned_at: credit.earned_at,
      paid_out_at: credit.paid_out_at,
      created_at: credit.created_at,
      referred_member_name: nameMap[credit.referred_membership_id] ?? "New member",
    }));

    return jsonOk({ credits: enrichedCredits });
  } catch (err) {
    console.error("[referral-credits] GET error:", err);
    return jsonError("Internal server error", 500);
  }
}
