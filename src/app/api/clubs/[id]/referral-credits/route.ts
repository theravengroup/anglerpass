import { jsonError, jsonOk } from "@/lib/api/helpers";
import { createClient } from "@/lib/supabase/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/** Helper: raw PostgREST GET */
async function pgGet(path: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
  });
  if (!res.ok) return null;
  return res.json();
}

// GET: Retrieve referral credit history
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clubId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return jsonError("Unauthorized", 401);
    }

    // Check if user is club owner
    const clubs = await pgGet(
      `clubs?select=id,owner_id&id=eq.${clubId}&limit=1`
    );
    const club = clubs?.[0];

    if (!club) {
      return jsonError("Club not found", 404);
    }

    const isOwner = club.owner_id === user.id;

    // Get the user's membership in this club
    const memberships = await pgGet(
      `club_memberships?select=id&club_id=eq.${clubId}&user_id=eq.${user.id}&status=eq.active&limit=1`
    );
    const membership = memberships?.[0];

    if (!isOwner && !membership) {
      return jsonError("Forbidden", 403);
    }

    // Build query for credits
    let filter = `club_id=eq.${clubId}&order=created_at.desc&limit=50`;

    // Non-owners only see their own credits
    if (!isOwner && membership) {
      filter += `&referrer_membership_id=eq.${membership.id}`;
    }

    const credits = await pgGet(
      `referral_credits?select=id,amount,status,earned_at,paid_out_at,created_at,referred_membership_id&${filter}`
    );

    // Enrich credits with referred member names
    const enrichedCredits = await Promise.all(
      (credits ?? []).map(
        async (credit: {
          id: string;
          amount: number;
          status: string;
          earned_at: string | null;
          paid_out_at: string | null;
          created_at: string;
          referred_membership_id: string;
        }) => {
          let referredMemberName = "New member";

          // Look up the referred membership's profile
          const refMembers = await pgGet(
            `club_memberships?select=user_id&id=eq.${credit.referred_membership_id}&limit=1`
          );
          const refMember = refMembers?.[0];

          if (refMember?.user_id) {
            const profiles = await pgGet(
              `profiles?select=display_name&id=eq.${refMember.user_id}&limit=1`
            );
            referredMemberName =
              profiles?.[0]?.display_name ?? "New member";
          }

          return {
            id: credit.id,
            amount: credit.amount,
            status: credit.status,
            earned_at: credit.earned_at,
            paid_out_at: credit.paid_out_at,
            created_at: credit.created_at,
            referred_member_name: referredMemberName,
          };
        }
      )
    );

    return jsonOk({ credits: enrichedCredits });
  } catch (err) {
    console.error("[referral-credits] GET error:", err);
    return jsonError("Internal server error", 500);
  }
}
