import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError } from "@/lib/api/helpers";
import { notify } from "@/lib/notifications";

/**
 * GET /api/cron/lease-renewal
 *
 * Daily cron that nudges landowners and clubs about upcoming lease
 * expirations and flips past-due leases to expired.
 *
 * Reminder windows: 30 days and 7 days out.
 * Past lease_paid_through → lease_status = 'expired' and property is
 * taken out of published status (trigger enforces this on the next
 * update — we just set status=draft here).
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return jsonError("Unauthorized", 401);
  }

  const admin = createAdminClient();
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  const in30 = new Date(now);
  in30.setDate(in30.getDate() + 30);
  const target30 = in30.toISOString().slice(0, 10);

  const in7 = new Date(now);
  in7.setDate(in7.getDate() + 7);
  const target7 = in7.toISOString().slice(0, 10);

  let reminded30 = 0;
  let reminded7 = 0;
  let expired = 0;
  const errors: string[] = [];

  async function sendReminder(
    property: { id: string; owner_id: string | null; name: string | null; lease_paid_through: string | null },
    daysOut: number,
  ) {
    if (!property.owner_id) return;
    await notify(admin, {
      userId: property.owner_id,
      type: "lease_renewal_reminder",
      title: `Lease renewal in ${daysOut} days`,
      body: `The upfront lease for ${property.name ?? "your property"} expires on ${property.lease_paid_through}. Propose a new lease amount so your club can renew on time.`,
      link: `/landowner/properties/${property.id}`,
    });
  }

  try {
    // 30-day reminders
    const { data: r30 } = await admin
      .from("properties")
      .select("id, owner_id, name, lease_paid_through")
      .eq("pricing_mode", "upfront_lease")
      .eq("lease_status", "active")
      .eq("lease_paid_through", target30);

    for (const p of r30 ?? []) {
      try {
        await sendReminder(p, 30);
        reminded30++;
      } catch (err) {
        errors.push(`30d ${p.id}: ${err instanceof Error ? err.message : "unknown"}`);
      }
    }

    // 7-day reminders
    const { data: r7 } = await admin
      .from("properties")
      .select("id, owner_id, name, lease_paid_through")
      .eq("pricing_mode", "upfront_lease")
      .eq("lease_status", "active")
      .eq("lease_paid_through", target7);

    for (const p of r7 ?? []) {
      try {
        await sendReminder(p, 7);
        reminded7++;
      } catch (err) {
        errors.push(`7d ${p.id}: ${err instanceof Error ? err.message : "unknown"}`);
      }
    }

    // Expire past-due leases
    const { data: expiredProps } = await admin
      .from("properties")
      .select("id, owner_id, name, lease_paid_through")
      .eq("pricing_mode", "upfront_lease")
      .eq("lease_status", "active")
      .lt("lease_paid_through", today);

    for (const p of expiredProps ?? []) {
      try {
        await admin
          .from("properties")
          .update({
            lease_status: "expired",
            status: "draft",
            updated_at: new Date().toISOString(),
          })
          .eq("id", p.id);

        if (p.owner_id) {
          await notify(admin, {
            userId: p.owner_id,
            type: "lease_expired",
            title: "Lease expired",
            body: `The lease for ${p.name ?? "your property"} has expired. Propose a renewal to get back online.`,
            link: `/landowner/properties/${p.id}`,
          });
        }
        expired++;
      } catch (err) {
        errors.push(`expire ${p.id}: ${err instanceof Error ? err.message : "unknown"}`);
      }
    }

    return jsonOk({
      reminded_30_day: reminded30,
      reminded_7_day: reminded7,
      expired,
      errors: errors.length ? errors : undefined,
    });
  } catch (err) {
    console.error("[cron/lease-renewal] Error:", err);
    return jsonError("Internal server error", 500);
  }
}
