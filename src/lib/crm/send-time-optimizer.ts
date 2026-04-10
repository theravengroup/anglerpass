/**
 * Send-time optimization — determines the best time to send emails
 * to each recipient based on their engagement history and timezone.
 *
 * Three strategies:
 * 1. immediate — send now (default)
 * 2. timezone_optimal — send at 10am in the recipient's local timezone
 * 3. engagement_optimal — send at the hour with highest engagement score
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export type SendTimeStrategy =
  | "immediate"
  | "timezone_optimal"
  | "engagement_optimal";

// Default "optimal" local hours to try, in order of preference
const OPTIMAL_LOCAL_HOURS = [10, 9, 11, 14, 15, 8];
const DEFAULT_TIMEZONE = "America/New_York";

/**
 * Compute the optimal send time for a recipient.
 * Returns a Date representing when the email should be sent.
 */
export async function getOptimalSendTime(
  admin: SupabaseClient,
  opts: {
    email: string;
    userId?: string;
    strategy: SendTimeStrategy;
  }
): Promise<Date> {
  if (opts.strategy === "immediate") {
    return new Date();
  }

  if (opts.strategy === "timezone_optimal") {
    return getTimezoneOptimalTime(admin, opts.userId);
  }

  if (opts.strategy === "engagement_optimal") {
    return getEngagementOptimalTime(admin, opts.email, opts.userId);
  }

  return new Date();
}

/**
 * Send at 10am local time (or the next available slot).
 */
async function getTimezoneOptimalTime(
  admin: SupabaseClient,
  userId?: string
): Promise<Date> {
  const tz = await getUserTimezone(admin, userId);
  const now = new Date();

  // Find the next occurrence of 10am in the user's timezone
  for (const hour of OPTIMAL_LOCAL_HOURS) {
    const candidate = getNextLocalHour(now, tz, hour);
    if (candidate > now) {
      return candidate;
    }
  }

  // If all preferred hours have passed today, try 10am tomorrow
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return getNextLocalHour(tomorrow, tz, 10);
}

/**
 * Send at the hour with highest historical engagement for this contact.
 */
async function getEngagementOptimalTime(
  admin: SupabaseClient,
  email: string,
  userId?: string
): Promise<Date> {
  const tz = await getUserTimezone(admin, userId);
  const now = new Date();
  const dayOfWeek = getDayOfWeekInTz(now, tz);

  // Get engagement scores for today's day of week
  const { data: windows } = await admin.from("crm_engagement_windows")
    .select("hour_utc, score")
    .eq("email", email)
    .eq("day_of_week", dayOfWeek)
    .order("score", { ascending: false })
    .limit(5)
    .returns<{ hour_utc: number; score: number }[]>();

  if (windows && windows.length > 0) {
    // Try each top-scoring hour, find the next one that's in the future
    for (const w of windows) {
      const candidate = getNextUTCHour(now, w.hour_utc);
      if (candidate > now) {
        return candidate;
      }
    }

    // If all have passed, use the top hour tomorrow
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return getNextUTCHour(tomorrow, windows[0].hour_utc);
  }

  // No engagement data — fall back to timezone_optimal
  return getTimezoneOptimalTime(admin, userId);
}

/**
 * Update engagement windows based on a new open or click event.
 * Called from the engagement tracking webhook handler.
 */
export async function recordEngagement(
  admin: SupabaseClient,
  email: string,
  eventType: "open" | "click",
  eventTime: Date = new Date()
): Promise<void> {
  const dayOfWeek = eventTime.getUTCDay();
  const hourUtc = eventTime.getUTCHours();

  const openInc = eventType === "open" ? 1 : 0;
  const clickInc = eventType === "click" ? 1 : 0;

  // Upsert the engagement window
  const { data: existing } = await admin.from("crm_engagement_windows")
    .select("id, open_count, click_count")
    .eq("email", email)
    .eq("day_of_week", dayOfWeek)
    .eq("hour_utc", hourUtc)
    .maybeSingle()
    .returns<{ id: string; open_count: number; click_count: number } | null>();

  if (existing) {
    const newOpens = (existing.open_count ?? 0) + openInc;
    const newClicks = (existing.click_count ?? 0) + clickInc;
    const score = newOpens * 1 + newClicks * 3;

    await admin.from("crm_engagement_windows")
      .update({
        open_count: newOpens,
        click_count: newClicks,
        score,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    const score = openInc * 1 + clickInc * 3;

    await admin.from("crm_engagement_windows").insert({
      email,
      day_of_week: dayOfWeek,
      hour_utc: hourUtc,
      open_count: openInc,
      click_count: clickInc,
      score,
    });
  }
}

/**
 * Get aggregated engagement pattern for an email (for admin display).
 * Returns a 7x24 grid of scores.
 */
export async function getEngagementHeatmap(
  admin: SupabaseClient,
  email: string
): Promise<Array<{ day: number; hour: number; score: number }>> {
  const { data } = await admin.from("crm_engagement_windows")
    .select("day_of_week, hour_utc, score")
    .eq("email", email)
    .returns<Array<{ day_of_week: number; hour_utc: number; score: number }>>();

  return (data ?? []).map((d) => ({
    day: d.day_of_week,
    hour: d.hour_utc,
    score: d.score,
  }));
}

// ─── Helpers ───────────────────────────────────────────────────────

async function getUserTimezone(
  admin: SupabaseClient,
  userId?: string
): Promise<string> {
  if (!userId) return DEFAULT_TIMEZONE;

  const { data } = await admin
    .from("profiles")
    .select("timezone")
    .eq("id", userId)
    .maybeSingle();

  return ((data as Record<string, unknown> | null)?.timezone as string) ?? DEFAULT_TIMEZONE;
}

/**
 * Get the next occurrence of a specific local hour in a timezone.
 */
function getNextLocalHour(baseDate: Date, timezone: string, localHour: number): Date {
  try {
    // Get current local time in the timezone
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const parts = formatter.formatToParts(baseDate);
    const localYear = Number(parts.find((p) => p.type === "year")?.value ?? 2026);
    const localMonth = Number(parts.find((p) => p.type === "month")?.value ?? 1);
    const localDay = Number(parts.find((p) => p.type === "day")?.value ?? 1);

    // Create a date string in the target timezone at the desired hour
    const targetStr = `${localYear}-${String(localMonth).padStart(2, "0")}-${String(localDay).padStart(2, "0")}T${String(localHour).padStart(2, "0")}:00:00`;

    // Convert from local to UTC by finding the offset
    const utcEstimate = new Date(targetStr + "Z");
    const localAtEstimate = new Date(
      utcEstimate.toLocaleString("en-US", { timeZone: timezone })
    );
    const offsetMs = localAtEstimate.getTime() - utcEstimate.getTime();

    return new Date(utcEstimate.getTime() - offsetMs);
  } catch {
    // Fallback if timezone parsing fails
    const result = new Date(baseDate);
    result.setUTCHours(localHour + 5, 0, 0, 0); // Rough EST offset
    return result;
  }
}

function getNextUTCHour(baseDate: Date, utcHour: number): Date {
  const result = new Date(baseDate);
  result.setUTCHours(utcHour, 0, 0, 0);
  return result;
}

function getDayOfWeekInTz(date: Date, timezone: string): number {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      weekday: "short",
    });
    const dayStr = formatter.format(date);
    const dayMap: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };
    return dayMap[dayStr] ?? date.getUTCDay();
  } catch {
    return date.getUTCDay();
  }
}
