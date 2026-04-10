import { jsonError, jsonOk, requireAuth} from "@/lib/api/helpers";
import { SITE_URL } from "@/lib/constants";
import { getResend } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";
import { referralInviteSchema } from "@/lib/validations/clubs";
import { rateLimit, getClientIp } from "@/lib/api/rate-limit";
import { generateReferralCode, buildReferralLink } from "@/lib/referral";

// POST: Send a referral invite email
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = rateLimit("referral-invite", getClientIp(request), 10, 60_000);
  if (limited) return limited;

  try {
    const { id: clubId } = await params;
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

    const db = createAdminClient();
    const admin = createAdminClient();

    // Verify club exists and has referral program enabled
    const { data: club, error: clubErr } = await db
      .from("clubs")
      .select("id, name, referral_program_enabled, referral_reward")
      .eq("id", clubId)
      .maybeSingle();

    if (clubErr || !club) {
      return jsonError("Club not found", 404);
    }

    const typedClub = club as {
      id: string;
      name: string;
      referral_program_enabled: boolean;
      referral_reward: number;
    };

    if (!typedClub.referral_program_enabled) {
      return jsonError("Referral program is not enabled for this club", 400);
    }

    // Verify caller is an active member with referral_code
    const { data: membership, error: memErr } = await db
      .from("club_memberships")
      .select("id, referral_code")
      .eq("club_id", clubId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (memErr || !membership) {
      return jsonError("You must be an active member of this club to send referrals", 403);
    }

    const typedMembership = membership as { id: string; referral_code: string | null };

    // Parse input
    const body = await request.json();
    const parsed = referralInviteSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
    }

    // Generate referral code if the member doesn't have one yet
    let referralCode: string | null = typedMembership.referral_code;

    if (!referralCode) {
      for (let attempt = 0; attempt < 3; attempt++) {
        referralCode = generateReferralCode();
        const { error: updateErr } = await db
          .from("club_memberships")
          .update({ referral_code: referralCode })
          .eq("id", typedMembership.id);

        if (!updateErr) break;

        if (attempt < 2) {
          referralCode = null;
          continue;
        }

        return jsonError("Failed to generate referral code", 500);
      }
    }

    if (!referralCode) {
      return jsonError("Failed to generate a unique referral code", 500);
    }

    const referralLink = buildReferralLink(clubId, referralCode);

    // Get referrer's display name
    const { data: profile } = await admin
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();

    const referrerName = profile?.display_name ?? "A member";

    // Send email
    const resend = getResend();
    if (resend) {
      const personalMessage = parsed.data.message
        ? `<p style="font-size: 16px; line-height: 1.7; color: #5a5a52; font-style: italic; border-left: 3px solid #8b6914; padding-left: 16px; margin: 24px 0;">
            &ldquo;${parsed.data.message}&rdquo;
          </p>`
        : "";

      const rewardLine =
        Number(typedClub.referral_reward) > 0
          ? `<p style="font-size: 14px; line-height: 1.7; color: #5a5a52;">
              As a referred member, your sponsor earns a referral reward &mdash; and you get a warm welcome from someone who already knows the club.
            </p>`
          : "";

      await resend.emails.send({
        from: "AnglerPass <hello@anglerpass.com>",
        to: parsed.data.email,
        subject: `${referrerName} invited you to join ${typedClub.name} on AnglerPass`,
        html: `
<div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #1e1e1a;">
  <h2 style="font-size: 24px; font-weight: 500; margin-bottom: 16px;">You&rsquo;ve been invited to ${typedClub.name}</h2>
  <p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">
    <strong>${referrerName}</strong> thinks you&rsquo;d be a great fit for <strong>${typedClub.name}</strong> on AnglerPass &mdash;
    a platform for managing private fly fishing access.
  </p>
  ${personalMessage}
  <p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">
    Join through their personal link to get started:
  </p>
  ${rewardLine}
  <div style="margin: 32px 0;">
    <a href="${referralLink}"
       style="display: inline-block; padding: 14px 32px; background: #1a3a2a; color: #fff; text-decoration: none; border-radius: 6px; font-family: sans-serif; font-size: 14px; font-weight: 500; letter-spacing: 0.3px;">
      Join ${typedClub.name} &rarr;
    </a>
  </div>
  <p style="font-size: 14px; line-height: 1.7; color: #9a9a8e;">
    If you have questions, reply to this email or visit <a href="${SITE_URL}" style="color: #3a6b7c;">anglerpass.com</a>.
  </p>
  <p style="font-size: 14px; color: #9a9a8e; margin-top: 32px;">&mdash; The AnglerPass Team</p>
</div>
        `.trim(),
      });
    }

    return jsonOk({
      success: true,
      referralLink,
      referralCode,
    });
  } catch (err) {
    console.error("[referral-invite] POST error:", err);
    return jsonError("Internal server error", 500);
  }
}

// GET: Get the current user's referral link for this club
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clubId } = await params;
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

    const db = createAdminClient();

    // Verify active membership
    const { data: membership, error: memErr } = await db
      .from("club_memberships")
      .select("id, referral_code")
      .eq("club_id", clubId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (memErr || !membership) {
      return jsonError("Not an active member", 403);
    }

    const typedMembership = membership as { id: string; referral_code: string | null };

    // Generate code if needed
    let referralCode: string | null = typedMembership.referral_code;

    if (!referralCode) {
      referralCode = generateReferralCode();
      await db
        .from("club_memberships")
        .update({ referral_code: referralCode })
        .eq("id", typedMembership.id);
    }

    return jsonOk({
      referralCode,
      referralLink: buildReferralLink(clubId, referralCode),
    });
  } catch (err) {
    console.error("[referral-invite] GET error:", err);
    return jsonError("Internal server error", 500);
  }
}
