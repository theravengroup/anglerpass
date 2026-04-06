/**
 * Notification service — creates in-app notifications and sends emails.
 *
 * Used by API routes (server-side only) via the admin Supabase client.
 */

import { Resend } from "resend";
import type { SupabaseClient } from "@supabase/supabase-js";

// Lazy-initialize Resend client to avoid holding a connection when not needed
let _resend: Resend | null = null;
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://anglerpass.com";

// ─── Types ──────────────────────────────────────────────────────────

export type NotificationType =
  | "booking_requested"
  | "booking_created"
  | "booking_confirmed"
  | "booking_declined"
  | "booking_cancelled"
  | "member_invited"
  | "member_approved"
  | "property_access_granted"
  | "guide_booking_created"
  | "guide_booking_cancelled"
  | "guide_water_approval_requested"
  | "guide_water_approved"
  | "guide_water_declined"
  | "guide_profile_approved"
  | "guide_profile_rejected"
  | "guide_review_received"
  | "guide_credential_expiring"
  | "guide_message_received"
  | "angler_review_received"
  | "referral_credit_earned"
  | "referral_invite_sent"
  | "membership_dues_failed"
  | "membership_cancelled"
  | "proposal_received"
  | "proposal_accepted"
  | "proposal_declined"
  | "proposal_expired"
  | "proposal_expiry_reminder"
  | "booking_reminder"
  | "booking_gate_code"
  | "booking_thank_you";

interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

/** Maps notification type → preference column in notification_preferences */
const EMAIL_PREF_MAP: Partial<Record<NotificationType, string>> = {
  booking_requested: "email_booking_requested",
  booking_created: "email_booking_requested",
  booking_confirmed: "email_booking_confirmed",
  booking_declined: "email_booking_declined",
  booking_cancelled: "email_booking_cancelled",
  member_invited: "email_member_invited",
  member_approved: "email_member_approved",
  property_access_granted: "email_property_access",
  guide_booking_created: "email_booking_confirmed",
  guide_booking_cancelled: "email_booking_cancelled",
  guide_water_approval_requested: "email_booking_requested",
  guide_water_approved: "email_booking_confirmed",
  guide_water_declined: "email_booking_declined",
  guide_profile_approved: "email_member_approved",
  guide_profile_rejected: "email_booking_declined",
  guide_review_received: "email_booking_confirmed",
  guide_credential_expiring: "email_booking_requested",
  guide_message_received: "email_booking_confirmed",
  angler_review_received: "email_booking_confirmed",
  membership_dues_failed: "email_booking_cancelled",
  membership_cancelled: "email_booking_cancelled",
  proposal_received: "email_booking_requested",
  proposal_accepted: "email_booking_confirmed",
  proposal_declined: "email_booking_declined",
  proposal_expired: "email_booking_cancelled",
  proposal_expiry_reminder: "email_booking_requested",
  booking_reminder: "email_booking_confirmed",
  booking_gate_code: "email_booking_confirmed",
  booking_thank_you: "email_booking_confirmed",
};

// ─── Core ───────────────────────────────────────────────────────────

/**
 * Create an in-app notification and optionally send an email
 * based on the user's preferences.
 */
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

  // 2. Check email preference (default to enabled)
  const prefCol = EMAIL_PREF_MAP[payload.type] ?? "email_booking_confirmed";
  const { data: prefs, error: prefErr } = await admin
    .from("notification_preferences")
    .select("*")
    .eq("user_id", payload.userId)
    .maybeSingle();

  if (prefErr) {
    console.error("[notify] Preference lookup error:", prefErr);
  }

  const shouldEmail =
    !prefs || (prefs as Record<string, unknown>)[prefCol] !== false;

  if (!shouldEmail) return;

  // 3. Resolve user email
  const { data: authData, error: authErr } =
    await admin.auth.admin.getUserById(payload.userId);

  if (authErr) {
    console.error("[notify] Auth lookup error:", authErr);
    return;
  }

  const email = authData?.user?.email;
  if (!email) return;

  // 4. Resolve display name
  const { data: profile } = await admin
    .from("profiles")
    .select("display_name")
    .eq("id", payload.userId)
    .single();

  const displayName = profile?.display_name ?? "there";

  // 5. Send email (fire-and-forget, errors logged)
  await sendNotificationEmail({
    to: email,
    displayName,
    title: payload.title,
    body: payload.body,
    link: payload.link,
    type: payload.type,
  });
}

// ─── Email Rendering ────────────────────────────────────────────────

interface EmailParams {
  to: string;
  displayName: string;
  title: string;
  body: string;
  link?: string;
  type: NotificationType;
}

const SUBJECT_MAP: Partial<Record<NotificationType, string>> = {
  booking_requested: "New Booking Request",
  booking_created: "New Booking on Your Property",
  booking_confirmed: "Your Booking is Confirmed!",
  booking_declined: "Booking Update",
  booking_cancelled: "Booking Cancelled",
  member_invited: "You've Been Invited",
  member_approved: "Membership Approved!",
  property_access_granted: "Property Access Granted",
  guide_booking_created: "You've Been Added to a Booking",
  guide_booking_cancelled: "A Booking Has Been Cancelled",
  guide_water_approval_requested: "New Guide Approval Request",
  guide_water_approved: "Water Approval Granted",
  guide_water_declined: "Water Approval Update",
  guide_profile_approved: "Your Guide Profile is Approved!",
  guide_profile_rejected: "Guide Profile Update",
  guide_review_received: "You Have a New Review",
  guide_credential_expiring: "Credential Expiring Soon",
  guide_message_received: "New Message",
  angler_review_received: "Your Review is Now Visible",
  membership_dues_failed: "Dues Payment Failed",
  membership_cancelled: "Membership Cancelled",
  proposal_received: "New Trip Proposal",
  proposal_accepted: "Trip Proposal Accepted!",
  proposal_declined: "Trip Proposal Declined",
  proposal_expired: "Trip Proposal Expired",
  proposal_expiry_reminder: "Trip Proposal Expiring Soon",
  booking_reminder: "Your Trip is Tomorrow!",
  booking_gate_code: "Access Details for Today\u2019s Trip",
  booking_thank_you: "Thanks for Fishing with AnglerPass!",
};

const CTA_LABEL_MAP: Partial<Record<NotificationType, string>> = {
  booking_requested: "Review Booking →",
  booking_created: "View Bookings →",
  booking_confirmed: "View Booking Details →",
  booking_declined: "View Details →",
  booking_cancelled: "View Bookings →",
  member_invited: "View Membership →",
  member_approved: "Browse Properties →",
  property_access_granted: "View Properties →",
  guide_booking_created: "View Booking →",
  guide_booking_cancelled: "View Bookings →",
  guide_water_approval_requested: "Review Request →",
  guide_water_approved: "View Approvals →",
  guide_water_declined: "View Details →",
  guide_profile_approved: "View Profile →",
  guide_profile_rejected: "View Profile →",
  guide_review_received: "View Reviews →",
  guide_credential_expiring: "Update Credentials →",
  guide_message_received: "View Messages →",
  angler_review_received: "View Review →",
  membership_dues_failed: "Update Payment →",
  membership_cancelled: "View Membership →",
  proposal_received: "View Proposal →",
  proposal_accepted: "View Proposal →",
  proposal_declined: "View Proposal →",
  proposal_expired: "View Proposals →",
  proposal_expiry_reminder: "View Proposal →",
  booking_reminder: "View Booking Details →",
  booking_gate_code: "View Full Access Details →",
  booking_thank_you: "Leave a Review →",
};

const CTA_COLOR_MAP: Partial<Record<NotificationType, string>> = {
  booking_requested: "#2a5a3a",
  booking_created: "#2a5a3a",
  booking_confirmed: "#2a5a3a",
  booking_declined: "#3a6b7c",
  booking_cancelled: "#2a5a3a",
  member_invited: "#8b6914",
  member_approved: "#2a5a3a",
  property_access_granted: "#2a5a3a",
};

async function sendNotificationEmail(params: EmailParams) {
  const resend = getResend();
  if (!resend) return;

  const { to, displayName, title, body, link, type } = params;
  const subject = SUBJECT_MAP[type] ?? title;
  const ctaLabel = CTA_LABEL_MAP[type] ?? "View on AnglerPass →";
  const ctaColor = CTA_COLOR_MAP[type] ?? "#2a5a3a";

  // Validate link is a relative path (prevent javascript: or external URLs)
  const safePath = link && link.startsWith("/") ? link : "";
  const ctaUrl = safePath ? `${SITE_URL}${safePath}` : SITE_URL;

  try {
    await resend.emails.send({
      from: "AnglerPass <hello@anglerpass.com>",
      to,
      subject,
      html: buildEmailHtml({
        title: escapeHtml(title),
        displayName: escapeHtml(displayName),
        body: escapeHtml(body),
        ctaUrl,
        ctaLabel,
        ctaColor,
      }),
    });
  } catch (err) {
    console.error("[notify] Email send error:", err);
  }
}

function buildEmailHtml(params: {
  title: string;
  displayName: string;
  body: string;
  ctaUrl: string;
  ctaLabel: string;
  ctaColor: string;
}): string {
  return `
<div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #1e1e1a;">
  <h2 style="font-size: 22px; font-weight: 500; margin-bottom: 8px;">${params.title}</h2>
  <p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">
    Hi ${params.displayName},
  </p>
  <p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">
    ${params.body}
  </p>
  <div style="margin: 28px 0;">
    <a href="${params.ctaUrl}"
       style="display: inline-block; padding: 14px 32px; background: ${params.ctaColor}; color: #fff; text-decoration: none; border-radius: 6px; font-family: sans-serif; font-size: 14px; font-weight: 500; letter-spacing: 0.3px;">
      ${params.ctaLabel}
    </a>
  </div>
  <p style="font-size: 13px; line-height: 1.6; color: #9a9a8e;">
    You can manage your email preferences in your
    <a href="${SITE_URL}/dashboard/settings" style="color: #3a6b7c;">account settings</a>.
  </p>
  <p style="font-size: 13px; color: #9a9a8e; margin-top: 24px;">&mdash; The AnglerPass Team</p>
</div>`.trim();
}

// ─── HTML Escaping ──────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ─── Convenience Helpers ────────────────────────────────────────────

/** Notify landowner that a new booking was made on their property (informational, not action-required) */
export async function notifyBookingCreated(
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
    type: "booking_created",
    title: `New booking on ${opts.propertyName}`,
    body: `${opts.anglerName} has booked a ${durationLabel} for ${opts.partySize} angler${opts.partySize > 1 ? "s" : ""} on ${formatDate(opts.bookingDate)}. The booking is confirmed.`,
    link: "/landowner/bookings",
    metadata: {
      booking_id: opts.bookingId,
      property_name: opts.propertyName,
    },
  });
}

/** Notify angler that their booking is confirmed (instant-book) */
export async function notifyBookingConfirmed(
  admin: SupabaseClient,
  opts: {
    anglerId: string;
    propertyName: string;
    bookingDate: string;
    bookingEndDate?: string;
    bookingId: string;
    duration: string;
    partySize: number;
    totalAmount?: number;
    landownerNotes?: string;
    guideName?: string;
  }
) {
  const dateRange = opts.bookingEndDate
    ? `${formatDate(opts.bookingDate)} \u2013 ${formatDate(opts.bookingEndDate)}`
    : formatDate(opts.bookingDate);
  const durationLabel = opts.duration === "half_day" ? "Half day" : "Full day";

  let body = `Your booking at ${opts.propertyName} is confirmed!\n\n`;
  body += `\u2022 Date: ${dateRange}\n`;
  body += `\u2022 Duration: ${durationLabel}\n`;
  body += `\u2022 Party size: ${opts.partySize} angler${opts.partySize > 1 ? "s" : ""}`;
  if (opts.totalAmount) {
    body += `\n\u2022 Total: $${(opts.totalAmount / 100).toFixed(2)}`;
  }
  if (opts.guideName) {
    body += `\n\u2022 Guide: ${opts.guideName}`;
  }
  body += `\n\nAccess details will be sent the morning of your trip.`;
  if (opts.landownerNotes) {
    body += ` Note from the landowner: \u201C${opts.landownerNotes}\u201D`;
  }

  await notify(admin, {
    userId: opts.anglerId,
    type: "booking_confirmed",
    title: `Booking confirmed \u2014 ${opts.propertyName}`,
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
    body += ` Reason: \u201C${opts.landownerNotes}\u201D`;
  }

  await notify(admin, {
    userId: opts.anglerId,
    type: "booking_declined",
    title: `Booking declined \u2014 ${opts.propertyName}`,
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
    title: `Booking cancelled \u2014 ${opts.propertyName}`,
    body: `${opts.anglerName} has cancelled their booking at ${opts.propertyName} on ${formatDate(opts.bookingDate)}.`,
    link: "/landowner/bookings",
    metadata: {
      booking_id: opts.bookingId,
      property_name: opts.propertyName,
    },
  });
}

// ─── Booking Lifecycle Notifications ────────────────────────────────

/** 24h pre-trip reminder — sent by daily cron for tomorrow's bookings */
export async function notifyBookingReminder(
  admin: SupabaseClient,
  opts: {
    anglerId: string;
    propertyName: string;
    propertyLocation: string;
    bookingDate: string;
    duration: string;
    partySize: number;
    guideName?: string;
    bookingId: string;
  }
) {
  const durationLabel = opts.duration === "half_day" ? "half day" : "full day";

  let body = `Reminder: your ${durationLabel} trip to ${opts.propertyName} is tomorrow, ${formatDate(opts.bookingDate)}.\n\n`;
  body += `\u2022 Location: ${opts.propertyLocation}\n`;
  body += `\u2022 Party size: ${opts.partySize} angler${opts.partySize > 1 ? "s" : ""}`;
  if (opts.guideName) {
    body += `\n\u2022 Guide: ${opts.guideName}`;
  }
  body += `\n\nAccess details including any gate codes will be sent tomorrow morning. Check the weather and make sure your gear is ready!`;

  await notify(admin, {
    userId: opts.anglerId,
    type: "booking_reminder",
    title: `Trip tomorrow \u2014 ${opts.propertyName}`,
    body,
    link: "/angler/bookings",
    metadata: {
      booking_id: opts.bookingId,
      property_name: opts.propertyName,
    },
  });
}

/** Morning-of gate code and access delivery — sent by daily cron for today's bookings */
export async function notifyBookingGateCode(
  admin: SupabaseClient,
  opts: {
    anglerId: string;
    propertyName: string;
    propertyLocation: string;
    bookingDate: string;
    gateCode?: string;
    accessNotes?: string;
    bookingId: string;
  }
) {
  let body = `Here are your access details for today\u2019s trip to ${opts.propertyName}:\n\n`;
  body += `\u2022 Location: ${opts.propertyLocation}`;
  if (opts.gateCode) {
    body += `\n\u2022 Gate code: ${opts.gateCode}`;
  }
  if (opts.accessNotes) {
    body += `\n\u2022 Access notes: ${opts.accessNotes}`;
  }
  if (!opts.gateCode && !opts.accessNotes) {
    body += `\n\nNo special access instructions on file. Check your booking details for any additional notes from the landowner.`;
  }
  body += `\n\nTight lines and enjoy your day on the water!`;

  await notify(admin, {
    userId: opts.anglerId,
    type: "booking_gate_code",
    title: `Access details \u2014 ${opts.propertyName}`,
    body,
    link: "/angler/bookings",
    metadata: {
      booking_id: opts.bookingId,
      property_name: opts.propertyName,
    },
  });
}

/** Post-trip thank-you — sent by daily cron for yesterday's completed bookings */
export async function notifyBookingThankYou(
  admin: SupabaseClient,
  opts: {
    anglerId: string;
    propertyName: string;
    bookingDate: string;
    bookingId: string;
    guideName?: string;
  }
) {
  let body = `Thanks for fishing at ${opts.propertyName} on ${formatDate(opts.bookingDate)}! We hope you had a great time on the water.`;
  if (opts.guideName) {
    body += ` Your guide ${opts.guideName} would love to hear how the trip went.`;
  }
  body += `\n\nYour review helps other anglers find great water and keeps the community strong. You have 21 days to submit a review.`;

  await notify(admin, {
    userId: opts.anglerId,
    type: "booking_thank_you",
    title: `How was your trip to ${opts.propertyName}?`,
    body,
    link: `/angler/bookings`,
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
    body: `Your membership in ${opts.clubName} has been approved. You can now browse and book access to the club\u2019s private waters.`,
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

// ─── Guide Notifications ────────────────────────────────────────────

/** Notify guide that they've been added to a booking */
export async function notifyGuideBookingCreated(
  admin: SupabaseClient,
  opts: {
    guideUserId: string;
    anglerName: string;
    propertyName: string;
    bookingDate: string;
    bookingId: string;
  }
) {
  await notify(admin, {
    userId: opts.guideUserId,
    type: "guide_booking_created",
    title: `New guided trip \u2014 ${opts.propertyName}`,
    body: `${opts.anglerName} has booked you for a guided trip at ${opts.propertyName} on ${formatDate(opts.bookingDate)}.`,
    link: "/guide/bookings",
    metadata: { booking_id: opts.bookingId },
  });
}

/** Notify guide that a booking with them was cancelled */
export async function notifyGuideBookingCancelled(
  admin: SupabaseClient,
  opts: {
    guideUserId: string;
    anglerName: string;
    propertyName: string;
    bookingDate: string;
    bookingId: string;
  }
) {
  await notify(admin, {
    userId: opts.guideUserId,
    type: "guide_booking_cancelled",
    title: `Booking cancelled \u2014 ${opts.propertyName}`,
    body: `${opts.anglerName} has cancelled their booking at ${opts.propertyName} on ${formatDate(opts.bookingDate)}.`,
    link: "/guide/bookings",
    metadata: { booking_id: opts.bookingId },
  });
}

/** Notify guide that their profile was approved by admin */
export async function notifyGuideProfileApproved(
  admin: SupabaseClient,
  opts: { guideUserId: string }
) {
  await notify(admin, {
    userId: opts.guideUserId,
    type: "guide_profile_approved",
    title: "Your guide profile is approved!",
    body: "Congratulations! Your guide profile has been reviewed and approved. You can now be added to bookings on waters you're approved for.",
    link: "/guide/profile",
  });
}

/** Notify guide that their profile was rejected by admin */
export async function notifyGuideProfileRejected(
  admin: SupabaseClient,
  opts: { guideUserId: string; reason: string }
) {
  await notify(admin, {
    userId: opts.guideUserId,
    type: "guide_profile_rejected",
    title: "Guide profile update needed",
    body: `Your guide profile was not approved. Reason: \u201C${opts.reason}\u201D. Please update your profile and resubmit.`,
    link: "/guide/profile",
  });
}

/** Notify club admin of a new guide water approval request */
export async function notifyGuideWaterApprovalRequested(
  admin: SupabaseClient,
  opts: {
    clubAdminId: string;
    guideName: string;
    propertyName: string;
  }
) {
  await notify(admin, {
    userId: opts.clubAdminId,
    type: "guide_water_approval_requested",
    title: `Guide approval request for ${opts.propertyName}`,
    body: `${opts.guideName} has requested approval to guide on ${opts.propertyName}.`,
    link: "/club/guide-approvals",
  });
}

/** Notify guide that their water approval was granted */
export async function notifyGuideWaterApproved(
  admin: SupabaseClient,
  opts: {
    guideUserId: string;
    propertyName: string;
    clubName: string;
  }
) {
  await notify(admin, {
    userId: opts.guideUserId,
    type: "guide_water_approved",
    title: `Approved to guide on ${opts.propertyName}`,
    body: `${opts.clubName} has approved your request to guide on ${opts.propertyName}. Anglers can now add you to bookings at this water.`,
    link: "/guide/profile",
  });
}

/** Notify guide that their water approval was declined */
export async function notifyGuideWaterDeclined(
  admin: SupabaseClient,
  opts: {
    guideUserId: string;
    propertyName: string;
    reason?: string;
  }
) {
  let body = `Your request to guide on ${opts.propertyName} was not approved.`;
  if (opts.reason) {
    body += ` Reason: \u201C${opts.reason}\u201D`;
  }

  await notify(admin, {
    userId: opts.guideUserId,
    type: "guide_water_declined",
    title: `Water approval update \u2014 ${opts.propertyName}`,
    body,
    link: "/guide/profile",
  });
}

// ─── Credential Expiry Notifications ────────────────────────────────

/** Notify guide that a credential is expiring soon */
export async function notifyGuideCredentialExpiring(
  admin: SupabaseClient,
  opts: {
    guideUserId: string;
    credential: string;
    daysLeft: number;
  }
) {
  await notify(admin, {
    userId: opts.guideUserId,
    type: "guide_credential_expiring",
    title: `${opts.credential} expiring in ${opts.daysLeft} days`,
    body: `Your ${opts.credential} expires in ${opts.daysLeft} days. Please update it to keep your guide profile active.`,
    link: "/guide/profile",
  });
}

/** Notify guide that a credential has expired */
export async function notifyGuideCredentialExpired(
  admin: SupabaseClient,
  opts: {
    guideUserId: string;
    credential: string;
  }
) {
  await notify(admin, {
    userId: opts.guideUserId,
    type: "guide_credential_expiring",
    title: `${opts.credential} has expired`,
    body: `Your ${opts.credential} has expired. Your guide profile has been suspended until you upload a current document.`,
    link: "/guide/profile",
  });
}

/** Notify guide that their profile was auto-suspended due to credential expiry */
export async function notifyGuideAutoSuspended(
  admin: SupabaseClient,
  opts: {
    guideUserId: string;
    expiredCredentials: string[];
  }
) {
  const credList = opts.expiredCredentials.join(", ");
  await notify(admin, {
    userId: opts.guideUserId,
    type: "guide_credential_expiring",
    title: "Guide profile suspended \u2014 expired credentials",
    body: `Your guide profile has been suspended because the following credentials have expired: ${credList}. Upload renewed documents to be automatically reinstated.`,
    link: "/guide/profile",
  });
}

/** Notify guide that their profile was auto-reinstated after credential renewal */
export async function notifyGuideAutoReinstated(
  admin: SupabaseClient,
  opts: {
    guideUserId: string;
  }
) {
  await notify(admin, {
    userId: opts.guideUserId,
    type: "guide_profile_approved",
    title: "Guide profile reinstated!",
    body: "Your credentials have been renewed and your guide profile is live again. You can now accept bookings.",
    link: "/guide",
  });
}

// ─── Proposal Notifications ─────────────────────────────────────

/** Notify angler that a guide has sent them a trip proposal */
export async function notifyProposalReceived(
  admin: SupabaseClient,
  opts: {
    anglerId: string;
    guideName: string;
    propertyName: string;
    proposedDate: string;
    proposalId: string;
  }
) {
  await notify(admin, {
    userId: opts.anglerId,
    type: "proposal_received",
    title: `Trip proposal from ${opts.guideName}`,
    body: `${opts.guideName} has proposed a guided trip at ${opts.propertyName} on ${formatDate(opts.proposedDate)}. Review the proposal and respond before it expires.`,
    link: `/angler/proposals/${opts.proposalId}`,
    metadata: { proposal_id: opts.proposalId },
  });
}

/** Notify guide that an angler accepted their proposal */
export async function notifyProposalAccepted(
  admin: SupabaseClient,
  opts: {
    guideUserId: string;
    anglerName: string;
    propertyName: string;
    proposalId: string;
  }
) {
  await notify(admin, {
    userId: opts.guideUserId,
    type: "proposal_accepted",
    title: `Proposal accepted \u2014 ${opts.propertyName}`,
    body: `${opts.anglerName} has accepted your trip proposal at ${opts.propertyName}. A confirmed booking has been created.`,
    link: "/guide/proposals",
    metadata: { proposal_id: opts.proposalId },
  });
}

/** Notify guide that an angler declined their proposal */
export async function notifyProposalDeclined(
  admin: SupabaseClient,
  opts: {
    guideUserId: string;
    anglerName: string;
    propertyName: string;
    proposalId: string;
  }
) {
  await notify(admin, {
    userId: opts.guideUserId,
    type: "proposal_declined",
    title: `Proposal declined \u2014 ${opts.propertyName}`,
    body: `${opts.anglerName} has declined your trip proposal at ${opts.propertyName}.`,
    link: "/guide/proposals",
    metadata: { proposal_id: opts.proposalId },
  });
}

/** Notify guide that a proposal expired without full response */
export async function notifyProposalExpired(
  admin: SupabaseClient,
  opts: {
    guideUserId: string;
    propertyName: string;
    proposalId: string;
  }
) {
  await notify(admin, {
    userId: opts.guideUserId,
    type: "proposal_expired",
    title: `Proposal expired \u2014 ${opts.propertyName}`,
    body: `Your trip proposal at ${opts.propertyName} has expired without a response from all invitees.`,
    link: "/guide/proposals",
    metadata: { proposal_id: opts.proposalId },
  });
}

/** Remind angler 24 hours before proposal expires if still pending */
export async function notifyProposalExpiryReminder(
  admin: SupabaseClient,
  opts: {
    anglerId: string;
    guideName: string;
    propertyName: string;
    proposalId: string;
  }
) {
  await notify(admin, {
    userId: opts.anglerId,
    type: "proposal_expiry_reminder",
    title: `Trip proposal expiring soon`,
    body: `The trip proposal from ${opts.guideName} at ${opts.propertyName} expires in 24 hours. Review and respond before it\u2019s too late.`,
    link: `/angler/proposals/${opts.proposalId}`,
    metadata: { proposal_id: opts.proposalId },
  });
}

// ─── Utilities ──────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  } catch {
    console.warn("[notify] Failed to parse date:", dateStr);
    return dateStr;
  }
}
