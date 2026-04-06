import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError } from "@/lib/api/helpers";
import { notifyMembershipRenewalReminder } from "@/lib/notifications";

/**
 * GET /api/cron/membership-renewal
 *
 * Daily cron (runs at 8 AM UTC) that sends renewal reminder emails
 * for memberships with dues renewing in 14 days or 3 days.
 *
 * Uses `dues_paid_through` from club_memberships to determine renewal date.
 * Only targets active memberships with active dues.
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return jsonError("Unauthorized", 401);
  }

  const admin = createAdminClient();
  const now = new Date();

  // Calculate target dates: 14 days and 3 days from now
  const in14Days = new Date(now);
  in14Days.setDate(in14Days.getDate() + 14);
  const target14 = in14Days.toISOString().slice(0, 10);

  const in3Days = new Date(now);
  in3Days.setDate(in3Days.getDate() + 3);
  const target3 = in3Days.toISOString().slice(0, 10);

  let sent14 = 0;
  let sent3 = 0;
  const errors: string[] = [];

  try {
    // ── 14-day reminders ──────────────────────────────────────────
    const { data: renewals14, error: err14 } = await admin
      .from("club_memberships")
      .select("id, user_id, club_id, dues_paid_through")
      .eq("status", "active")
      .eq("dues_status", "active")
      .eq("dues_paid_through", target14) as {
      data: Array<{
        id: string;
        user_id: string;
        club_id: string;
        dues_paid_through: string;
      }> | null;
      error: { message: string } | null;
    };

    if (err14) {
      errors.push(`14-day query error: ${err14.message}`);
    }

    if (renewals14 && renewals14.length > 0) {
      // Fetch club details for all clubs
      const clubIds = [...new Set(renewals14.map((r) => r.club_id))];
      const { data: clubs } = await admin
        .from("clubs")
        .select("id, name, annual_dues")
        .in("id", clubIds);

      const clubMap = new Map(
        (clubs ?? []).map((c) => [c.id, c])
      );

      for (const membership of renewals14) {
        try {
          const club = clubMap.get(membership.club_id);
          if (!club) continue;

          await notifyMembershipRenewalReminder(admin, {
            userId: membership.user_id,
            clubName: club.name,
            renewalDate: membership.dues_paid_through,
            daysUntilRenewal: 14,
            annualDues: club.annual_dues ?? 0,
          });
          sent14++;
        } catch (err) {
          errors.push(
            `14d reminder for ${membership.id}: ${err instanceof Error ? err.message : "unknown"}`
          );
        }
      }
    }

    // ── 3-day reminders ───────────────────────────────────────────
    const { data: renewals3, error: err3 } = await admin
      .from("club_memberships")
      .select("id, user_id, club_id, dues_paid_through")
      .eq("status", "active")
      .eq("dues_status", "active")
      .eq("dues_paid_through", target3) as {
      data: Array<{
        id: string;
        user_id: string;
        club_id: string;
        dues_paid_through: string;
      }> | null;
      error: { message: string } | null;
    };

    if (err3) {
      errors.push(`3-day query error: ${err3.message}`);
    }

    if (renewals3 && renewals3.length > 0) {
      const clubIds = [...new Set(renewals3.map((r) => r.club_id))];
      const { data: clubs } = await admin
        .from("clubs")
        .select("id, name, annual_dues")
        .in("id", clubIds);

      const clubMap = new Map(
        (clubs ?? []).map((c) => [c.id, c])
      );

      for (const membership of renewals3) {
        try {
          const club = clubMap.get(membership.club_id);
          if (!club) continue;

          await notifyMembershipRenewalReminder(admin, {
            userId: membership.user_id,
            clubName: club.name,
            renewalDate: membership.dues_paid_through,
            daysUntilRenewal: 3,
            annualDues: club.annual_dues ?? 0,
          });
          sent3++;
        } catch (err) {
          errors.push(
            `3d reminder for ${membership.id}: ${err instanceof Error ? err.message : "unknown"}`
          );
        }
      }
    }

    return jsonOk({
      sent_14_day: sent14,
      sent_3_day: sent3,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error("[cron/membership-renewal] Error:", err);
    return jsonError("Internal server error", 500);
  }
}
