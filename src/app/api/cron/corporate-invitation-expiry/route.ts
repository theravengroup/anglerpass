import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError } from "@/lib/api/helpers";
import { notify } from "@/lib/notifications";

/**
 * GET /api/cron/corporate-invitation-expiry
 *
 * Daily cron (runs at 5 AM UTC) that expires corporate invitations
 * older than 30 days and notifies the corporate sponsor.
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return jsonError("Unauthorized", 401);
  }

  const admin = createAdminClient();

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);

  let expired = 0;
  const errors: string[] = [];

  try {
    // ── Find pending invitations older than 30 days ────────────────
    const { data: staleInvitations, error: queryErr } = await admin
      .from("corporate_invitations")
      .select("id, email, corporate_member_id")
      .eq("status", "pending")
      .lt("invited_at", cutoff.toISOString()) as {
      data: Array<{
        id: string;
        email: string;
        corporate_member_id: string;
      }> | null;
      error: { message: string } | null;
    };

    if (queryErr) {
      console.error("[cron/corporate-invitation-expiry] Query error:", queryErr);
      return jsonError("Internal server error", 500);
    }

    if (!staleInvitations || staleInvitations.length === 0) {
      return jsonOk({ expired: 0 });
    }

    // ── Expire all matching invitations in bulk ─────────────────────
    const ids = staleInvitations.map((i) => i.id);
    const { error: updateErr } = await admin
      .from("corporate_invitations")
      .update({ status: "expired" })
      .in("id", ids);

    if (updateErr) {
      console.error("[cron/corporate-invitation-expiry] Bulk update error:", updateErr);
      return jsonError("Internal server error", 500);
    }

    expired = staleInvitations.length;

    // ── Resolve corporate member user_ids for notifications ─────────
    const membershipIds = [
      ...new Set(staleInvitations.map((i) => i.corporate_member_id)),
    ];

    const { data: memberships } = await admin
      .from("club_memberships")
      .select("id, user_id")
      .in("id", membershipIds) as {
      data: Array<{ id: string; user_id: string | null }> | null;
      error: unknown;
    };

    const membershipUserMap = new Map<string, string>();
    for (const m of memberships ?? []) {
      if (m.user_id) {
        membershipUserMap.set(m.id, m.user_id);
      }
    }

    // ── Notify each sponsor ─────────────────────────────────────────
    for (const inv of staleInvitations) {
      const sponsorUserId = membershipUserMap.get(inv.corporate_member_id);
      if (!sponsorUserId) continue;

      try {
        await notify(admin, {
          userId: sponsorUserId,
          type: "member_approved",
          title: "Corporate invitation expired",
          body: `Your invitation to ${inv.email} has expired after 30 days. You can resend it from your corporate dashboard.`,
          link: "/angler/corporate",
        });
      } catch (err) {
        errors.push(
          `Notify for invitation ${inv.id}: ${err instanceof Error ? err.message : "unknown"}`
        );
      }
    }

    return jsonOk({
      expired,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error("[cron/corporate-invitation-expiry] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}
