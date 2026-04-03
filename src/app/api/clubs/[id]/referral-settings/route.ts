import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { referralSettingsSchema } from "@/lib/validations/clubs";

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

// GET: Retrieve referral program settings for a club
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get club with referral settings
    const clubs = await pgGet(
      `clubs?select=id,owner_id,referral_program_enabled,referral_reward,initiation_fee&id=eq.${id}&limit=1`
    );
    const club = clubs?.[0];

    if (!club) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    if (club.owner_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get referral stats
    const allCredits = await pgGet(
      `referral_credits?select=id,amount,status&club_id=eq.${id}`
    );

    const credits = allCredits ?? [];
    const totalReferrals = credits.length;
    const earnedReferrals = credits.filter(
      (c: { status: string }) =>
        c.status === "earned" || c.status === "paid_out"
    ).length;
    const totalPaid = credits
      .filter(
        (c: { status: string }) =>
          c.status === "earned" || c.status === "paid_out"
      )
      .reduce((sum: number, c: { amount: number }) => sum + Number(c.amount), 0);

    return NextResponse.json({
      referral_program_enabled: club.referral_program_enabled ?? false,
      referral_reward: Number(club.referral_reward ?? 0),
      initiation_fee: Number(club.initiation_fee ?? 0),
      stats: {
        total_referrals: totalReferrals,
        earned_referrals: earnedReferrals,
        total_paid: totalPaid,
      },
    });
  } catch (err) {
    console.error("[referral-settings] GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH: Update referral program settings
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get club
    const clubs = await pgGet(
      `clubs?select=id,owner_id,initiation_fee&id=eq.${id}&limit=1`
    );
    const club = clubs?.[0];

    if (!club) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    if (club.owner_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = referralSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    // Validate reward doesn't exceed initiation fee
    const initiationFee = Number(club.initiation_fee ?? 0);
    if (
      parsed.data.referral_program_enabled &&
      parsed.data.referral_reward > 0 &&
      initiationFee > 0 &&
      parsed.data.referral_reward > initiationFee
    ) {
      return NextResponse.json(
        {
          error: `Referral reward ($${parsed.data.referral_reward}) cannot exceed the initiation fee ($${initiationFee}).`,
        },
        { status: 400 }
      );
    }

    const res = await pgPatch("clubs", `id=eq.${id}`, {
      referral_program_enabled: parsed.data.referral_program_enabled,
      referral_reward: parsed.data.referral_reward,
    });

    if (!res.ok) {
      console.error("[referral-settings] Update error:", await res.text());
      return NextResponse.json(
        { error: "Failed to update settings" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[referral-settings] PATCH error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
