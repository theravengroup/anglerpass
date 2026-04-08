import "server-only";

import { Resend } from "resend";
import type { SupabaseClient } from "@supabase/supabase-js";
import { REVIEW_WINDOW_DAYS, LANDOWNER_FAULTS } from "@/lib/validations/reviews";

// ─── Constants ──────────────────────────────────────────────────────

/** Days after last fishing day to send the initial prompt */
const INITIAL_PROMPT_DAY = 0;
/** Days after last fishing day to send the reminder email */
const REMINDER_EMAIL_DAY = 14;
/** Days after last fishing day to send the reminder SMS */
const REMINDER_SMS_DAY = 18;

const PROMPT_TYPES = [
  "initial_email",
  "initial_sms",
  "reminder_email",
  "reminder_sms",
] as const;

type PromptType = (typeof PROMPT_TYPES)[number];

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://anglerpass.com";

// ─── Resend Client ──────────────────────────────────────────────────

let _resend: Resend | null = null;
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

// ─── Types ──────────────────────────────────────────────────────────

interface EligibleBooking {
  id: string;
  property_id: string;
  angler_id: string;
  booking_date: string;
  booking_end_date: string | null;
  property_name: string;
}

interface PromptContext {
  bookingId: string;
  propertyId: string;
  anglerId: string;
  anglerFirstName: string;
  anglerEmail: string;
  anglerPhone: string | null;
  propertyName: string;
  lastFishingDay: string;
  windowCloseDate: string;
  reviewUrl: string;
}

interface PromptResult {
  prompted: number;
  errors: number;
}

// ─── Main Entry Point ───────────────────────────────────────────────

/**
 * Process all eligible bookings and send review prompts.
 *
 * Called by the cron endpoint. Finds bookings where:
 * - Status is completed OR cancelled with landowner fault
 * - Last fishing day has passed
 * - Review window has NOT expired
 * - No review has been submitted yet
 *
 * Then sends the appropriate prompts based on timing.
 */
export async function processReviewPrompts(
  admin: SupabaseClient
): Promise<PromptResult> {
  const now = new Date();
  let prompted = 0;
  let errors = 0;

  // Find all eligible bookings
  const eligibleBookings = await findEligibleBookings(admin, now);

  for (const booking of eligibleBookings) {
    try {
      const sent = await processBookingPrompts(admin, booking, now);
      prompted += sent;
    } catch (err) {
      console.error(
        `[review-prompts] Error processing booking ${booking.id}:`,
        err
      );
      errors += 1;
    }
  }

  return { prompted, errors };
}

// ─── Find Eligible Bookings ─────────────────────────────────────────

async function findEligibleBookings(
  admin: SupabaseClient,
  now: Date
): Promise<EligibleBooking[]> {
  // Fetch completed bookings where last fishing day has passed
  // but review window is still open (within 21 days)
  const windowStart = new Date(now);
  windowStart.setDate(windowStart.getDate() - REVIEW_WINDOW_DAYS);

  const { data: completedBookings, error: completedError } = await admin
    .from("bookings")
    .select("id, property_id, angler_id, booking_date, booking_end_date, properties(name)")
    .eq("status", "completed")
    .lte("booking_date", now.toISOString().split("T")[0])
    .gte("booking_date", windowStart.toISOString().split("T")[0]);

  if (completedError) {
    console.error("[review-prompts] Error fetching completed bookings:", completedError);
  }

  // Fetch landowner-fault cancelled bookings in the same window
  const { data: cancelledBookings, error: cancelledError } = await admin
    .from("bookings")
    .select("id, property_id, angler_id, booking_date, booking_end_date, cancellation_fault, properties(name)")
    .eq("status", "cancelled")
    .lte("booking_date", now.toISOString().split("T")[0])
    .gte("booking_date", windowStart.toISOString().split("T")[0]);

  if (cancelledError) {
    console.error("[review-prompts] Error fetching cancelled bookings:", cancelledError);
  }

  // Filter cancelled to landowner-fault only
  const landownerFaultBookings = (cancelledBookings ?? []).filter(
    (b) =>
      b.cancellation_fault !== null &&
      (LANDOWNER_FAULTS as readonly string[]).includes(b.cancellation_fault)
  );

  // Normalize Supabase join shape into flat EligibleBooking.
  // Supabase queries with joins return loosely typed records, so we
  // safely extract each field with runtime checks instead of unsafe casts.
  function normalize(
    rows: Record<string, unknown>[]
  ): EligibleBooking[] {
    return rows.map((b) => {
      const props = b.properties;
      let name = "your booked property";
      if (Array.isArray(props) && props.length > 0) {
        const first = props[0] as Record<string, unknown> | undefined;
        if (first && typeof first.name === "string") name = first.name;
      } else if (props && typeof props === "object" && !Array.isArray(props)) {
        const obj = props as Record<string, unknown>;
        if (typeof obj.name === "string") name = obj.name;
      }

      return {
        id: b.id as string,
        property_id: b.property_id as string,
        angler_id: b.angler_id as string,
        booking_date: b.booking_date as string,
        booking_end_date: (b.booking_end_date as string | null) ?? null,
        property_name: name,
      };
    });
  }

  const allBookings = [
    ...normalize((completedBookings ?? []) as Record<string, unknown>[]),
    ...normalize(landownerFaultBookings as Record<string, unknown>[]),
  ];

  if (allBookings.length === 0) return [];

  // Filter out bookings that already have a submitted/published review
  const bookingIds = allBookings.map((b) => b.id);
  const { data: existingReviews } = await admin
    .from("trip_reviews")
    .select("booking_id, status")
    .in("booking_id", bookingIds);

  const reviewedBookingIds = new Set(
    (existingReviews ?? [])
      .filter((r) => r.status === "submitted" || r.status === "published")
      .map((r) => r.booking_id)
  );

  return allBookings.filter((b) => !reviewedBookingIds.has(b.id));
}

// ─── Process Individual Booking ─────────────────────────────────────

async function processBookingPrompts(
  admin: SupabaseClient,
  booking: EligibleBooking,
  now: Date
): Promise<number> {
  const lastFishingDay = booking.booking_end_date ?? booking.booking_date;
  const lastDayDate = new Date(lastFishingDay + "T23:59:59Z");
  const daysSinceTrip = Math.floor(
    (now.getTime() - lastDayDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Review window expired — no prompts
  if (daysSinceTrip > REVIEW_WINDOW_DAYS) return 0;

  // Fetch already-sent prompts for this booking
  const { data: sentPrompts } = await admin
    .from("review_prompt_log")
    .select("prompt_type, status")
    .eq("booking_id", booking.id)
    .eq("status", "sent");

  const sentTypes = new Set(
    (sentPrompts ?? []).map((p) => p.prompt_type)
  );

  // Resolve angler info
  const context = await buildPromptContext(admin, booking, lastFishingDay);
  if (!context) return 0;

  let sent = 0;

  // Day 0+: Initial email
  if (
    daysSinceTrip >= INITIAL_PROMPT_DAY &&
    !sentTypes.has("initial_email")
  ) {
    const ok = await sendInitialEmail(admin, context);
    if (ok) sent += 1;
  }

  // Day 0+: Initial SMS
  if (
    daysSinceTrip >= INITIAL_PROMPT_DAY &&
    !sentTypes.has("initial_sms")
  ) {
    const ok = await sendInitialSms(admin, context);
    if (ok) sent += 1;
  }

  // Day 14+: Reminder email
  if (
    daysSinceTrip >= REMINDER_EMAIL_DAY &&
    !sentTypes.has("reminder_email")
  ) {
    const ok = await sendReminderEmail(admin, context);
    if (ok) sent += 1;
  }

  // Day 18+: Reminder SMS
  if (
    daysSinceTrip >= REMINDER_SMS_DAY &&
    !sentTypes.has("reminder_sms")
  ) {
    const ok = await sendReminderSms(admin, context);
    if (ok) sent += 1;
  }

  return sent;
}

// ─── Build Prompt Context ───────────────────────────────────────────

async function buildPromptContext(
  admin: SupabaseClient,
  booking: EligibleBooking,
  lastFishingDay: string
): Promise<PromptContext | null> {
  // Resolve angler profile + email
  const [{ data: profile }, { data: authData, error: authErr }] =
    await Promise.all([
      admin
        .from("profiles")
        .select("display_name, phone")
        .eq("id", booking.angler_id)
        .single(),
      admin.auth.admin.getUserById(booking.angler_id),
    ]);

  if (authErr || !authData?.user?.email) {
    console.error(
      `[review-prompts] Could not resolve angler ${booking.angler_id}:`,
      authErr
    );
    return null;
  }

  const displayName = profile?.display_name ?? "";
  const firstName = displayName.trim().split(/\s+/)[0] || "Angler";

  // Calculate window close date
  const windowClose = new Date(lastFishingDay + "T23:59:59Z");
  windowClose.setDate(windowClose.getDate() + REVIEW_WINDOW_DAYS);
  const windowCloseStr = windowClose.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const propertyName = booking.property_name;

  return {
    bookingId: booking.id,
    propertyId: booking.property_id,
    anglerId: booking.angler_id,
    anglerFirstName: firstName,
    anglerEmail: authData.user.email,
    anglerPhone: profile?.phone ?? null,
    propertyName,
    lastFishingDay,
    windowCloseDate: windowCloseStr,
    reviewUrl: `${SITE_URL}/reviews/submit/${booking.id}`,
  };
}

// ─── Log Prompt ─────────────────────────────────────────────────────

async function logPrompt(
  admin: SupabaseClient,
  ctx: PromptContext,
  promptType: PromptType,
  channel: "email" | "sms",
  status: "sent" | "failed" | "skipped",
  errorMessage?: string
): Promise<void> {
  const { error } = await admin.from("review_prompt_log").insert({
    booking_id: ctx.bookingId,
    angler_id: ctx.anglerId,
    property_id: ctx.propertyId,
    prompt_type: promptType,
    channel,
    status,
    error_message: errorMessage ?? null,
  });

  if (error) {
    console.error(`[review-prompts] Failed to log prompt:`, error);
  }
}

// ─── Initial Email ──────────────────────────────────────────────────

async function sendInitialEmail(
  admin: SupabaseClient,
  ctx: PromptContext
): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    await logPrompt(admin, ctx, "initial_email", "email", "skipped", "Resend not configured");
    return false;
  }

  const subject = `Your trip to ${ctx.propertyName} — leave your verified field report`;

  const html = buildReviewEmailHtml({
    firstName: escapeHtml(ctx.anglerFirstName),
    propertyName: escapeHtml(ctx.propertyName),
    reviewUrl: ctx.reviewUrl,
    windowCloseDate: ctx.windowCloseDate,
    isReminder: false,
  });

  try {
    await resend.emails.send({
      from: "AnglerPass <hello@anglerpass.com>",
      to: ctx.anglerEmail,
      subject,
      html,
    });

    await logPrompt(admin, ctx, "initial_email", "email", "sent");
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[review-prompts] Initial email error:", msg);
    await logPrompt(admin, ctx, "initial_email", "email", "failed", msg);
    return false;
  }
}

// ─── Initial SMS ────────────────────────────────────────────────────

async function sendInitialSms(
  admin: SupabaseClient,
  ctx: PromptContext
): Promise<boolean> {
  if (!ctx.anglerPhone) {
    await logPrompt(admin, ctx, "initial_sms", "sms", "skipped", "No phone number on file");
    return false;
  }

  const shortDate = formatShortDate(ctx.windowCloseDate);
  const message = `AnglerPass: Your trip to ${ctx.propertyName} is done. Leave your verified field report: ${ctx.reviewUrl} — window closes ${shortDate}.`;

  return sendSmsMessage(admin, ctx, "initial_sms", ctx.anglerPhone, message);
}

// ─── Reminder Email ─────────────────────────────────────────────────

async function sendReminderEmail(
  admin: SupabaseClient,
  ctx: PromptContext
): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    await logPrompt(admin, ctx, "reminder_email", "email", "skipped", "Resend not configured");
    return false;
  }

  const subject = `Your review window closes in 7 days — ${ctx.propertyName}`;

  const html = buildReviewEmailHtml({
    firstName: escapeHtml(ctx.anglerFirstName),
    propertyName: escapeHtml(ctx.propertyName),
    reviewUrl: ctx.reviewUrl,
    windowCloseDate: ctx.windowCloseDate,
    isReminder: true,
  });

  try {
    await resend.emails.send({
      from: "AnglerPass <hello@anglerpass.com>",
      to: ctx.anglerEmail,
      subject,
      html,
    });

    await logPrompt(admin, ctx, "reminder_email", "email", "sent");
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[review-prompts] Reminder email error:", msg);
    await logPrompt(admin, ctx, "reminder_email", "email", "failed", msg);
    return false;
  }
}

// ─── Reminder SMS ───────────────────────────────────────────────────

async function sendReminderSms(
  admin: SupabaseClient,
  ctx: PromptContext
): Promise<boolean> {
  if (!ctx.anglerPhone) {
    await logPrompt(admin, ctx, "reminder_sms", "sms", "skipped", "No phone number on file");
    return false;
  }

  const message = `AnglerPass: 3 days left to review ${ctx.propertyName}. ${ctx.reviewUrl}`;

  return sendSmsMessage(admin, ctx, "reminder_sms", ctx.anglerPhone, message);
}

// ─── SMS Sender ─────────────────────────────────────────────────────

/**
 * Send an SMS message. Currently uses Twilio if configured.
 * Falls back to logging when TWILIO_ACCOUNT_SID is not set.
 *
 * TCPA guard: skips the send if the user has not opted in to SMS.
 */
async function sendSmsMessage(
  admin: SupabaseClient,
  ctx: PromptContext,
  promptType: PromptType,
  phone: string,
  message: string
): Promise<boolean> {
  // ── TCPA consent check ────────────────────────────────────────────
  const { data: consentProfile } = await admin
    .from("profiles")
    .select("sms_consent")
    .eq("id", ctx.anglerId)
    .single();

  if (!consentProfile?.sms_consent) {
    await logPrompt(admin, ctx, promptType, "sms", "skipped", "No SMS consent (TCPA)");
    return false;
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    await logPrompt(admin, ctx, promptType, "sms", "skipped", "Twilio not configured");
    return false;
  }

  try {
    // Twilio REST API — no SDK dependency needed
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

    const body = new URLSearchParams({
      To: phone,
      From: fromNumber,
      Body: message,
    });

    const response = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Twilio API error ${response.status}: ${errBody}`);
    }

    await logPrompt(admin, ctx, promptType, "sms", "sent");
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(`[review-prompts] SMS (${promptType}) error:`, msg);
    await logPrompt(admin, ctx, promptType, "sms", "failed", msg);
    return false;
  }
}

// ─── Email HTML Builder ─────────────────────────────────────────────

function buildReviewEmailHtml(params: {
  firstName: string;
  propertyName: string;
  reviewUrl: string;
  windowCloseDate: string;
  isReminder: boolean;
}): string {
  const { firstName, propertyName, reviewUrl, windowCloseDate, isReminder } =
    params;

  if (isReminder) {
    return `
<div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #1e1e1a;">
  <p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">
    Hi ${firstName},
  </p>
  <p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">
    Just a reminder &mdash; your verified review window for ${propertyName} closes
    on ${windowCloseDate}. You have 7 days left.
  </p>
  <p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">
    Your field report helps other anglers make better decisions about where
    to fish.
  </p>
  <div style="margin: 28px 0;">
    <a href="${reviewUrl}"
       style="display: inline-block; padding: 14px 32px; background: #8b6914; color: #fff; text-decoration: none; border-radius: 6px; font-family: sans-serif; font-size: 14px; font-weight: 500; letter-spacing: 0.3px;">
      Leave Your Review &rarr;
    </a>
  </div>
  <p style="font-size: 13px; color: #9a9a8e; margin-top: 24px;">&mdash; The AnglerPass Team</p>
</div>`.trim();
  }

  return `
<div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #1e1e1a;">
  <p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">
    Hi ${firstName},
  </p>
  <p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">
    Your trip to ${propertyName} is complete. As a verified angler on that
    booking, you&rsquo;re invited to leave a field report.
  </p>
  <p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">
    Your review is tied to your booking &mdash; it&rsquo;s verified, it&rsquo;s permanent, and
    future anglers will rely on it.
  </p>
  <div style="margin: 28px 0;">
    <a href="${reviewUrl}"
       style="display: inline-block; padding: 14px 32px; background: #8b6914; color: #fff; text-decoration: none; border-radius: 6px; font-family: sans-serif; font-size: 14px; font-weight: 500; letter-spacing: 0.3px;">
      Leave Your Verified Review &rarr;
    </a>
  </div>
  <p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">
    Your review window is open for 21 days, closing on ${windowCloseDate}.
  </p>
  <p style="font-size: 15px; line-height: 1.7; color: #7a7a6e;">
    If you need more time, you can request a one-time 7-day extension before
    your window closes.
  </p>
  <p style="font-size: 13px; color: #9a9a8e; margin-top: 24px;">&mdash; The AnglerPass Team</p>
</div>`.trim();
}

// ─── Utilities ──────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Shorten a long date like "January 15, 2026" to "Jan 15" for SMS brevity.
 */
function formatShortDate(longDate: string): string {
  // longDate comes from toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
  // e.g. "January 15, 2026"
  const parts = longDate.split(" ");
  if (parts.length >= 2) {
    const month = parts[0].slice(0, 3);
    const day = parts[1].replace(",", "");
    return `${month} ${day}`;
  }
  return longDate;
}
