import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError } from "@/lib/api/helpers";
import { sendWelcomeEmail } from "@/lib/welcome-emails";

interface WelcomeProfile {
  id: string;
  role: string;
}

/**
 * GET /api/cron/welcome-emails
 *
 * Daily cron (runs at 9 AM UTC) that sends welcome email sequence:
 *   - Email 2: profiles created 2 days ago (welcome_email_step = 1)
 *   - Email 3: profiles created 5 days ago (welcome_email_step = 2)
 *
 * Email 1 is sent immediately from the auth callback on signup.
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

  // Calculate target dates
  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const targetDay2 = twoDaysAgo.toISOString().slice(0, 10);

  const fiveDaysAgo = new Date(now);
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
  const targetDay5 = fiveDaysAgo.toISOString().slice(0, 10);

  let sentEmail2 = 0;
  let sentEmail3 = 0;
  const errors: string[] = [];

  try {
    // ── Email 2: profiles created 2 days ago with step = 1 ─────────
    // Use .filter() for the welcome_email_step column since it is not
    // yet in the generated Supabase types (migration added it).
    const { data: day2Profiles, error: err2 } = await admin
      .from("profiles")
      .select("id, role")
      .filter("welcome_email_step", "eq", 1)
      .gte("created_at", `${targetDay2}T00:00:00Z`)
      .lt("created_at", `${targetDay2}T23:59:59Z`)
      .returns<WelcomeProfile[]>();

    if (err2) {
      errors.push(`Day 2 query error: ${err2.message}`);
    }

    if (day2Profiles) {
      for (const profile of day2Profiles) {
        try {
          const sent = await sendWelcomeEmail(admin, profile.id, profile.role, 2);
          if (sent) sentEmail2++;
        } catch (err) {
          errors.push(
            `Email 2 for ${profile.id}: ${err instanceof Error ? err.message : "unknown"}`
          );
        }
      }
    }

    // ── Email 3: profiles created 5 days ago with step = 2 ─────────
    const { data: day5Profiles, error: err5 } = await admin
      .from("profiles")
      .select("id, role")
      .filter("welcome_email_step", "eq", 2)
      .gte("created_at", `${targetDay5}T00:00:00Z`)
      .lt("created_at", `${targetDay5}T23:59:59Z`)
      .returns<WelcomeProfile[]>();

    if (err5) {
      errors.push(`Day 5 query error: ${err5.message}`);
    }

    if (day5Profiles) {
      for (const profile of day5Profiles) {
        try {
          const sent = await sendWelcomeEmail(admin, profile.id, profile.role, 3);
          if (sent) sentEmail3++;
        } catch (err) {
          errors.push(
            `Email 3 for ${profile.id}: ${err instanceof Error ? err.message : "unknown"}`
          );
        }
      }
    }

    return jsonOk({
      sent_email_2: sentEmail2,
      sent_email_3: sentEmail3,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error("[cron/welcome-emails] Error:", err);
    return jsonError("Internal server error", 500);
  }
}
