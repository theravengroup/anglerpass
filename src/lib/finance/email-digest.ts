import "server-only";

/**
 * Finance email digest — sends daily and weekly summary emails
 * to finance staff using the Resend API.
 */

import { getResend } from "@/lib/email";
import { createUntypedAdminClient } from "@/lib/supabase/untyped-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/constants";

function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

// ─── Daily Digest ───────────────────────────────────────────────────

export async function sendDailyDigest(): Promise<number> {
  const resend = getResend();
  if (!resend) return 0;

  const db = createUntypedAdminClient();
  const typedAdmin = createAdminClient();

  // Get latest snapshot
  const { data: snapshot } = await db
    .from("finance_daily_snapshots")
    .select("*")
    .order("snapshot_date", { ascending: false })
    .limit(1)
    .single();

  if (!snapshot) return 0;

  const s = snapshot as {
    snapshot_date: string;
    mercury_balance: number;
    stripe_available_balance: number;
    stripe_pending_balance: number;
    payouts_created: number;
    payouts_arrived: number;
    open_exceptions: number;
  };

  // Get open exception count by severity
  const { data: exceptions } = await db
    .from("finance_reconciliation_exceptions")
    .select("severity")
    .eq("status", "open");

  const criticalCount = ((exceptions ?? []) as Array<{ severity: string }>)
    .filter((e) => e.severity === "critical").length;
  const warningCount = ((exceptions ?? []) as Array<{ severity: string }>)
    .filter((e) => e.severity === "warning").length;

  // Build email HTML
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2d4a3e; border-bottom: 2px solid #2d4a3e; padding-bottom: 8px;">
        AnglerPass Daily Cash Summary — ${s.snapshot_date}
      </h2>

      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr>
          <td style="padding: 8px 0; color: #666;">Mercury Balance</td>
          <td style="padding: 8px 0; text-align: right; font-family: monospace; font-weight: bold; color: #2d4a3e;">
            ${formatUsd(s.mercury_balance)}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Stripe Available</td>
          <td style="padding: 8px 0; text-align: right; font-family: monospace;">
            ${formatUsd(s.stripe_available_balance)}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Stripe Pending</td>
          <td style="padding: 8px 0; text-align: right; font-family: monospace;">
            ${formatUsd(s.stripe_pending_balance)}
          </td>
        </tr>
        <tr style="border-top: 1px solid #e5e5e5;">
          <td style="padding: 8px 0; color: #666;">Payouts Created</td>
          <td style="padding: 8px 0; text-align: right; font-family: monospace;">
            ${formatUsd(s.payouts_created)}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Payouts Arrived</td>
          <td style="padding: 8px 0; text-align: right; font-family: monospace; color: #2d4a3e;">
            ${formatUsd(s.payouts_arrived)}
          </td>
        </tr>
      </table>

      ${
        s.open_exceptions > 0
          ? `
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; margin: 16px 0;">
          <strong style="color: #dc2626;">⚠ ${s.open_exceptions} Open Exception${s.open_exceptions > 1 ? "s" : ""}</strong>
          ${criticalCount > 0 ? `<br><span style="color: #dc2626;">${criticalCount} critical</span>` : ""}
          ${warningCount > 0 ? `<br><span style="color: #d97706;">${warningCount} warning</span>` : ""}
        </div>
      `
          : `
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; margin: 16px 0;">
          <strong style="color: #16a34a;">✓ No Open Exceptions</strong>
        </div>
      `
      }

      <p style="margin-top: 24px;">
        <a href="${SITE_URL}/admin/finance-ops" style="display: inline-block; background: #2d4a3e; color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 500;">
          View Finance Dashboard →
        </a>
      </p>

      <p style="color: #999; font-size: 12px; margin-top: 24px;">
        This is an automated daily summary from AnglerPass Finance Operations.
      </p>
    </div>
  `;

  // Send to finance staff
  const { data: staff } = await typedAdmin
    .from("platform_staff")
    .select("user_id, role")
    .in("role", ["super_admin", "finance_admin"]);

  if (!staff || staff.length === 0) return 0;

  const staffUserIds = staff.map((s) => s.user_id);
  let sent = 0;
  for (const member of staff) {
    try {
      const { data: { user } } = await typedAdmin.auth.admin.getUserById(member.user_id);
      if (!user?.email) continue;
      await resend.emails.send({
        from: "AnglerPass Finance <finance@anglerpass.com>",
        to: user.email,
        subject: `[AnglerPass] Daily Cash Summary — ${s.snapshot_date}`,
        html,
      });
      sent++;
    } catch {
      // Non-critical
    }
  }

  return sent;
}

// ─── Weekly Digest ──────────────────────────────────────────────────

export async function sendWeeklyDigest(): Promise<number> {
  const resend = getResend();
  if (!resend) return 0;

  const db = createUntypedAdminClient();
  const typedAdmin = createAdminClient();

  // Get last 7 daily snapshots
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const { data: snapshots } = await db
    .from("finance_daily_snapshots")
    .select("*")
    .gte("snapshot_date", sevenDaysAgo)
    .order("snapshot_date", { ascending: true });

  const snaps = (snapshots ?? []) as Array<{
    snapshot_date: string;
    mercury_balance: number;
    payouts_arrived: number;
    open_exceptions: number;
  }>;

  const totalArrived = snaps.reduce((s, snap) => s + snap.payouts_arrived, 0);
  const latestBalance = snaps.length > 0 ? snaps[snaps.length - 1].mercury_balance : 0;
  const earliestBalance = snaps.length > 0 ? snaps[0].mercury_balance : 0;
  const balanceChange = latestBalance - earliestBalance;

  // Week's exceptions
  const { data: weekExceptions } = await db
    .from("finance_reconciliation_exceptions")
    .select("id, status")
    .gte("created_at", `${sevenDaysAgo}T00:00:00Z`);

  const newExceptions = (weekExceptions ?? []).length;
  const resolvedThisWeek = ((weekExceptions ?? []) as Array<{ status: string }>)
    .filter((e) => e.status === "resolved").length;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2d4a3e; border-bottom: 2px solid #2d4a3e; padding-bottom: 8px;">
        AnglerPass Weekly Finance Summary
      </h2>

      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr>
          <td style="padding: 8px 0; color: #666;">Total Settled This Week</td>
          <td style="padding: 8px 0; text-align: right; font-family: monospace; font-weight: bold; color: #2d4a3e;">
            ${formatUsd(totalArrived)}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Mercury Balance</td>
          <td style="padding: 8px 0; text-align: right; font-family: monospace;">
            ${formatUsd(latestBalance)}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Balance Change (WoW)</td>
          <td style="padding: 8px 0; text-align: right; font-family: monospace; color: ${balanceChange >= 0 ? "#16a34a" : "#dc2626"};">
            ${balanceChange >= 0 ? "+" : ""}${formatUsd(balanceChange)}
          </td>
        </tr>
        <tr style="border-top: 1px solid #e5e5e5;">
          <td style="padding: 8px 0; color: #666;">New Exceptions</td>
          <td style="padding: 8px 0; text-align: right; font-weight: bold;">
            ${newExceptions}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Resolved This Week</td>
          <td style="padding: 8px 0; text-align: right; color: #16a34a; font-weight: bold;">
            ${resolvedThisWeek}
          </td>
        </tr>
      </table>

      <p style="margin-top: 24px;">
        <a href="${SITE_URL}/admin/finance-ops" style="display: inline-block; background: #2d4a3e; color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 500;">
          View Full Dashboard →
        </a>
      </p>

      <p style="color: #999; font-size: 12px; margin-top: 24px;">
        This is an automated weekly summary from AnglerPass Finance Operations.
      </p>
    </div>
  `;

  // Send to finance staff
  const { data: staff } = await typedAdmin
    .from("platform_staff")
    .select("user_id, role")
    .in("role", ["super_admin", "finance_admin"]);

  if (!staff || staff.length === 0) return 0;

  let sent = 0;
  const today = new Date().toISOString().split("T")[0];
  for (const member of staff) {
    try {
      const { data: { user } } = await typedAdmin.auth.admin.getUserById(member.user_id);
      if (!user?.email) continue;
      await resend.emails.send({
        from: "AnglerPass Finance <finance@anglerpass.com>",
        to: user.email,
        subject: `[AnglerPass] Weekly Finance Summary — Week of ${today}`,
        html,
      });
      sent++;
    } catch {
      // Non-critical
    }
  }

  return sent;
}
