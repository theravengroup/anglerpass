import { jsonError, jsonOk } from "@/lib/api/helpers";
import { createClient } from "@/lib/supabase/server";
import { createUntypedAdminClient } from "@/lib/supabase/untyped-admin";
import { referralSettingsSchema } from "@/lib/validations/clubs";

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
      return jsonError("Unauthorized", 401);
    }

    const db = createUntypedAdminClient();

    // Get club with referral settings
    const { data: club, error: clubErr } = await db
      .from("clubs")
      .select("id, owner_id, referral_program_enabled, referral_reward, initiation_fee")
      .eq("id", id)
      .single();

    if (clubErr || !club) {
      return jsonError("Club not found", 404);
    }

    if ((club as { owner_id: string }).owner_id !== user.id) {
      return jsonError("Forbidden", 403);
    }

    // Get referral stats
    const { data: allCredits } = await db
      .from("referral_credits")
      .select("id, amount, status")
      .eq("club_id", id);

    const credits = (allCredits ?? []) as { id: string; amount: number; status: string }[];
    const totalReferrals = credits.length;
    const earnedCredits = credits.filter(
      (c) => c.status === "earned" || c.status === "paid_out"
    );
    const earnedReferrals = earnedCredits.length;
    const totalPaid = earnedCredits.reduce(
      (sum, c) => sum + Number(c.amount),
      0
    );

    const typedClub = club as {
      referral_program_enabled: boolean | null;
      referral_reward: number | null;
      initiation_fee: number | null;
    };

    return jsonOk({
      referral_program_enabled: typedClub.referral_program_enabled ?? false,
      referral_reward: Number(typedClub.referral_reward ?? 0),
      initiation_fee: Number(typedClub.initiation_fee ?? 0),
      stats: {
        total_referrals: totalReferrals,
        earned_referrals: earnedReferrals,
        total_paid: totalPaid,
      },
    });
  } catch (err) {
    console.error("[referral-settings] GET error:", err);
    return jsonError("Internal server error", 500);
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
      return jsonError("Unauthorized", 401);
    }

    const db = createUntypedAdminClient();

    // Get club
    const { data: club, error: clubErr } = await db
      .from("clubs")
      .select("id, owner_id, initiation_fee")
      .eq("id", id)
      .single();

    if (clubErr || !club) {
      return jsonError("Club not found", 404);
    }

    const typedClub = club as { owner_id: string; initiation_fee: number | null };

    if (typedClub.owner_id !== user.id) {
      return jsonError("Forbidden", 403);
    }

    const body = await request.json();
    const parsed = referralSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
    }

    // Validate reward doesn't exceed initiation fee
    const initiationFee = Number(typedClub.initiation_fee ?? 0);
    if (
      parsed.data.referral_program_enabled &&
      parsed.data.referral_reward > 0 &&
      initiationFee > 0 &&
      parsed.data.referral_reward > initiationFee
    ) {
      return jsonError(
        `Referral reward ($${parsed.data.referral_reward}) cannot exceed the initiation fee ($${initiationFee}).`,
        400
      );
    }

    const { error: updateErr } = await db
      .from("clubs")
      .update({
        referral_program_enabled: parsed.data.referral_program_enabled,
        referral_reward: parsed.data.referral_reward,
      })
      .eq("id", id);

    if (updateErr) {
      console.error("[referral-settings] Update error:", updateErr);
      return jsonError("Failed to update settings", 500);
    }

    return jsonOk({ success: true });
  } catch (err) {
    console.error("[referral-settings] PATCH error:", err);
    return jsonError("Internal server error", 500);
  }
}
