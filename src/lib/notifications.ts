/**
 * Notification service — creates in-app notifications and sends emails
 *
 * Used by API routes (server-side only) via the admin Supabase client.
 */

import { Resend } from "resend";
import type { SupabaseClient } from "@supabase/supabase-js";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://anglerpass.com";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NotificationType =
  | "booking_requested"
  | "booking_confirmed"
  | "booking_declined"
  | "booking_cancelled"
  | "member_invited"
  | "member_approved"
  | "property_access_granted";

interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

// Map notification type → preference column name
const EMAIL_PREF_MAP: Record<NotificationType, string> = {
  booking_requested: "email_booking_requested",
  booking_confirmed: "email_booking_confirmed",
  booking_declined: "email_booking_declined",
  booking_cancelled: "email_booking_cancelled",
  member_invited: "email_member_invited",
  member_approved: "email_member_approved",
  property_access_granted: "email_property_access",
};

// ---------------------------------------------------------------------------
// Core: create in-app + send email
// ---------------------------------------------------------------------------

export async function notify(
  admin: SupabaseClient,
  payload: NotificationPayload
) {
  // 1. Create in-app notification
  const { error: insertErr } = await admin.from("notifications").insert({
    user_id: payload.userId,
    type: payload.type,
    title: payload.title,
    body: payload.body,
    link: payload.link ?? null,
    metadata: payload.metadata ?? {},
  });

  if (insertErr) {
    console.error("[notify] Insert error:", insertErr);
  }

  // 2. Check email preference
  const prefCol = EMAIL_PREF_MAP[payload.type];
  const { data: prefs } = await admin
    .from("notification_preferences")
    .select(prefCol)
    .eq("user_id", payload.userId)
    .maybeSingle();

  // Default to sending if no preference row exists
  const shouldEmail =
    !prefs || (prefs as unknown as Record<string, boolean>)[prefCol] !== false;

  if (!shouldEmail) return;

  // 3. Get user email
  const { data: authData } = await admin.auth.admin.getUserById(payload.userId);
  const email = authData?.user?.email;
  if (!email) return;

  // 4. Get display name
  const { data: profile } = await admin
    .from("profiles")
    .select("display_name")
    .eq("id", payload.userId)
    .single();

  const displayName = profile?.display_name ?? "there";

  // 5. Send email
  await sendNotificationEmail({
    to: email,
    displayName,
    title: payload.title,
    body: payload.body,
    link: payload.link,
    type: payload.type,
  });
}

// ---------------------------------------------------------------------------
// Email rendering
// ---------------------------------------------------------------------------

interface EmailParams {
  to: string;
  displayName: string;
  title: string;
  body: string;
  link?: string;
  type: NotificationType;
}

function getSubjectForType(type: NotificationType, title: string): string {
  switch (type) {
    case "booking_requested":
      return "New Booking Request";
    case "booking_confirmed":
      return "Booking Confirmed!";
    case "booking_declined":
      return "Booking Update";
    case "booking_cancelled":
      return "Booking Cancelled";
    case "member_invited":
      return "You've Been Invited";
    case "member_approved":
      return "Membership Approved!";
    case "property_access_granted":
      return "Property Access Granted";
    default:
      return title;
  }
}

function getCtaLabel(type: NotificationType): string {
  switch (type) {
    case "booking_requested":
      return "Review Booking →";
    case "booking_confirmed":
      return "View Booking Details →";
    case "booking_declined":
      return "View Details →";
    case "booking_cancelled":
      return "View Bookings →";
    case "member_invited":
      return "View Membership →";
    case "member_approved":
      return "Browse Properties →";
    case "property_access_granted":
      return "View Properties →";
    default:
      return "View on AnglerPass →";
  }
}

function getBrandColor(type: NotificationType): string {
  switch (type) {
    case "booking_requested":
    case "booking_cancelled":
      return "#2a5a3a"; // forest
    case "booking_confirmed":
    case "member_approved":
    case "property_access_granted":
      return "#2a5a3a"; // forest
    case "booking_declined":
      return "#3a6b7c"; // river
    case "member_invited":
      return "#8b6914"; // bronze
    default:
      return "#2a5a3a";
  }
}

async function sendNotificationEmail(params: EmailParams) {
  if (!resend) return;

  const { to, displayName, title, body, link, type } = params;
  const subject = getSubjectForType(type, title);
  const ctaLabel = getCtaLabel(type);
  const ctaColor = getBrandColor(type);
  const ctaUrl = link ? `${SITE_URL}${link}` : SITE_URL;

  try {
    await resend.emails.send({
      from: "AnglerPass <hello@anglerpass.com>",
      to,
      subject,
      html: `
<div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #1e1e1a;">
  <h2 style="font-size: 22px; font-weight: 500; margin-bottom: 8px;">${escapeHtml(title)}</h2>
  <p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">
    Hi ${escapeHtml(displayName)},
  </p>
  <p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">
    ${escapeHtml(body)}
  </p>
  <div style="margin: 28px 0;">
    <a href="${ctaUrl}"
       style="display: inline-block; padding: 14px 32px; background: ${ctaColor}; color: #fff; text-decoration: none; border-radius: 6px; font-family: sans-serif; font-size: 14px; font-weight: 500; letter-spacing: 0.3px;">
      ${ctaLabel}
    </a>
  </div>
  <p style="font-size: 13px; line-height: 1.6; color: #9a9a8e;">
    You can manage your email preferences in your
    <a href="${SITE_URL}/dashboard/settings" style="color: #3a6b7c;">account settings</a>.
  </p>
  <p style="font-size: 13px; color: #9a9a8e; margin-top: 24px;">— The AnglerPass Team</p>
</div>
      `.trim(),
    });
  } catch (err) {
    console.error("[notify] Email send error:", err);
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ---------------------------------------------------------------------------
// Convenience helpers for common notification types
// ---------------------------------------------------------------------------

/** Notify landowner that a new booking was requested */
export async function notifyBookingRequested(
  admin: SupabaseClient,
  opts: {
    landownerId: string;
    anglerName: string;
    propertyName: string;
    bookingDate: string;
    duration: string;
    partySize: number;
    bookingId: string;
  }
) {
  const durationLabel =
    opts.duration === "half_day" ? "half day" : "full day";

  await notify(admin, {
    userId: opts.landownerId,
    type: "booking_requested",
    title: `New booking request for ${opts.propertyName}`,
    body: `${opts.anglerName} has requested a ${durationLabel} booking for ${opts.partySize} angler${opts.partySize > 1 ? "s" : ""} on ${formatDate(opts.bookingDate)}.`,
    link: "/landowner/bookings",
    metadata: {
      booking_id: opts.bookingId,
      property_name: opts.propertyName,
    },
  });
}

/** Notify angler that their booking was confirmed */
export async function notifyBookingConfirmed(
  admin: SupabaseClient,
  opts: {
    anglerId: string;
    propertyName: string;
    bookingDate: string;
    bookingId: string;
    landownerNotes?: string;
  }
) {
  let body = `Your booking at ${opts.propertyName} on ${formatDate(opts.bookingDate)} has been confirmed! Access details are now available in your booking.`;
  if (opts.landownerNotes) {
    body += ` Note from the landowner: "${opts.landownerNotes}"`;
  }

  await notify(admin, {
    userId: opts.anglerId,
    type: "booking_confirmed",
    title: `Booking confirmed — ${opts.propertyName}`,
    body,
    link: "/angler/bookings",
    metadata: {
      booking_id: opts.bookingId,
      property_name: opts.propertyName,
    },
  });
}

/** Notify angler that their booking was declined */
export async function notifyBookingDeclined(
  admin: SupabaseClient,
  opts: {
    anglerId: string;
    propertyName: string;
    bookingDate: string;
    bookingId: string;
    landownerNotes?: string;
  }
) {
  let body = `Your booking request at ${opts.propertyName} on ${formatDate(opts.bookingDate)} was not approved.`;
  if (opts.landownerNotes) {
    body += ` Reason: "${opts.landownerNotes}"`;
  }

  await notify(admin, {
    userId: opts.anglerId,
    type: "booking_declined",
    title: `Booking declined — ${opts.propertyName}`,
    body,
    link: "/angler/bookings",
    metadata: {
      booking_id: opts.bookingId,
      property_name: opts.propertyName,
    },
  });
}

/** Notify landowner that a booking was cancelled by the angler */
export async function notifyBookingCancelled(
  admin: SupabaseClient,
  opts: {
    landownerId: string;
    anglerName: string;
    propertyName: string;
    bookingDate: string;
    bookingId: string;
  }
) {
  await notify(admin, {
    userId: opts.landownerId,
    type: "booking_cancelled",
    title: `Booking cancelled — ${opts.propertyName}`,
    body: `${opts.anglerName} has cancelled their booking at ${opts.propertyName} on ${formatDate(opts.bookingDate)}.`,
    link: "/landowner/bookings",
    metadata: {
      booking_id: opts.bookingId,
      property_name: opts.propertyName,
    },
  });
}

/** Notify user that their club membership was approved */
export async function notifyMemberApproved(
  admin: SupabaseClient,
  opts: {
    userId: string;
    clubName: string;
    clubId: string;
  }
) {
  await notify(admin, {
    userId: opts.userId,
    type: "member_approved",
    title: `Welcome to ${opts.clubName}!`,
    body: `Your membership in ${opts.clubName} has been approved. You can now browse and book access to the club's private waters.`,
    link: "/angler/discover",
    metadata: { club_id: opts.clubId },
  });
}

/** Notify club admin that property access was granted */
export async function notifyPropertyAccessGranted(
  admin: SupabaseClient,
  opts: {
    clubAdminId: string;
    propertyName: string;
    clubName: string;
    propertyId: string;
  }
) {
  await notify(admin, {
    userId: opts.clubAdminId,
    type: "property_access_granted",
    title: `${opts.propertyName} access approved`,
    body: `Your club ${opts.clubName} now has access to ${opts.propertyName}. Club members can book this property.`,
    link: "/club/properties",
    metadata: {
      property_id: opts.propertyId,
      club_name: opts.clubName,
    },
  });
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}
