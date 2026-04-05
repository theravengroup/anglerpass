import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { referralInviteSchema } from "@/lib/validations/clubs";
import { rateLimit, getClientIp } from "@/lib/api/rate-limit";
import { generateReferralCode, buildReferralLink } from "@/lib/referral";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://anglerpass.com";
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

/** Helper: raw PostgREST PATCH */
async function pgPatch(
  table: string,
  filter: string,
  body: Record<string, unknown>
) {
  return fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: "PATCH",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(body),
  });
}

// POST: Send a referral invite email
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = rateLimit("referral-invite", getClientIp(request), 10, 60_000);
  if (limited) return limited;

  try {
    const { id: clubId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify club exists and has referral program enabled
    const clubs = await pgGet(
      `clubs?select=id,name,referral_program_enabled,referral_reward&id=eq.${clubId}&limit=1`
    );
    const club = clubs?.[0];

    if (!club) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    if (!club.referral_program_enabled) {
      return NextResponse.json(
        { error: "Referral program is not enabled for this club" },
        { status: 400 }
      );
    }

    // Verify caller is an active member with referral_code
    const memberships = await pgGet(
      `club_memberships?select=id,referral_code&club_id=eq.${clubId}&user_id=eq.${user.id}&status=eq.active&limit=1`
    );
    const membership = memberships?.[0];

    if (!membership) {
      return NextResponse.json(
        {
          error:
            "You must be an active member of this club to send referrals",
        },
        { status: 403 }
      );
    }

    // Parse input
    const body = await request.json();
    const parsed = referralInviteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    // Generate referral code if the member doesn't have one yet
    let referralCode: string | null = membership.referral_code;

    if (!referralCode) {
      for (let attempt = 0; attempt < 3; attempt++) {
        referralCode = generateReferralCode();
        const res = await pgPatch(
          "club_memberships",
          `id=eq.${membership.id}`,
          { referral_code: referralCode }
        );

        if (res.ok) break;

        if (attempt < 2) {
          referralCode = null;
          continue;
        }

        return NextResponse.json(
          { error: "Failed to generate referral code" },
          { status: 500 }
        );
      }
    }

    if (!referralCode) {
      return NextResponse.json(
        { error: "Failed to generate a unique referral code" },
        { status: 500 }
      );
    }

    const referralLink = buildReferralLink(clubId, referralCode);

    // Get referrer's display name
    const profiles = await pgGet(
      `profiles?select=display_name&id=eq.${user.id}&limit=1`
    );
    const referrerName = profiles?.[0]?.display_name ?? "A member";

    // Send email
    if (resend) {
      const personalMessage = parsed.data.message
        ? `<p style="font-size: 16px; line-height: 1.7; color: #5a5a52; font-style: italic; border-left: 3px solid #8b6914; padding-left: 16px; margin: 24px 0;">
            &ldquo;${parsed.data.message}&rdquo;
          </p>`
        : "";

      const rewardLine =
        Number(club.referral_reward) > 0
          ? `<p style="font-size: 14px; line-height: 1.7; color: #5a5a52;">
              As a referred member, your sponsor earns a referral reward &mdash; and you get a warm welcome from someone who already knows the club.
            </p>`
          : "";

      await resend.emails.send({
        from: "AnglerPass <hello@anglerpass.com>",
        to: parsed.data.email,
        subject: `${referrerName} invited you to join ${club.name} on AnglerPass`,
        html: `
<div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #1e1e1a;">
  <h2 style="font-size: 24px; font-weight: 500; margin-bottom: 16px;">You&rsquo;ve been invited to ${club.name}</h2>
  <p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">
    <strong>${referrerName}</strong> thinks you&rsquo;d be a great fit for <strong>${club.name}</strong> on AnglerPass &mdash;
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
      Join ${club.name} &rarr;
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

    return NextResponse.json({
      success: true,
      referralLink,
      referralCode,
    });
  } catch (err) {
    console.error("[referral-invite] POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET: Get the current user's referral link for this club
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify active membership
    const memberships = await pgGet(
      `club_memberships?select=id,referral_code&club_id=eq.${clubId}&user_id=eq.${user.id}&status=eq.active&limit=1`
    );
    const membership = memberships?.[0];

    if (!membership) {
      return NextResponse.json(
        { error: "Not an active member" },
        { status: 403 }
      );
    }

    // Generate code if needed
    let referralCode: string | null = membership.referral_code;

    if (!referralCode) {
      referralCode = generateReferralCode();
      await pgPatch("club_memberships", `id=eq.${membership.id}`, {
        referral_code: referralCode,
      });
    }

    return NextResponse.json({
      referralCode,
      referralLink: buildReferralLink(clubId, referralCode),
    });
  } catch (err) {
    console.error("[referral-invite] GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
