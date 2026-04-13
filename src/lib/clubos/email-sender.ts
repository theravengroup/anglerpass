/**
 * ClubOS email sender — handles club-level campaign emails via Resend.
 *
 * Distinct from the platform CRM sender (`src/lib/crm/email-sender.ts`).
 * Club campaigns send from the club's identity, target club members only,
 * and respect club-level communication preferences.
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getResend } from "@/lib/email";
import { getUnsubscribeUrl } from "@/lib/unsubscribe";
import { renderTemplate, buildTemplateData } from "@/lib/crm/template-engine";
import { SITE_URL } from "@/lib/constants";

// ─── Types ──────────────────────────────────────────────────────────

interface ClubEmailPayload {
  recipientId: string;
  campaignId: string;
  to: string;
  subject: string;
  bodyHtml: string;
  recipientName?: string;
  clubName: string;
  clubId: string;
  membershipId: string;
}

interface ClubSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ─── Preference Checks ─────────────────────────────────────────────

/**
 * Check if a member has opted out of a specific campaign type.
 * Returns true if the member has opted out.
 */
export async function hasClubOptOut(
  admin: SupabaseClient,
  membershipId: string,
  campaignType: "broadcast" | "targeted" | "digest"
): Promise<boolean> {
  const { data: prefs } = await admin
    .from("club_communication_preferences")
    .select("email_broadcasts, email_targeted, email_digest")
    .eq("membership_id", membershipId)
    .maybeSingle();

  // No row = all defaults enabled
  if (!prefs) return false;

  const row = prefs as Record<string, unknown>;
  switch (campaignType) {
    case "broadcast":
      return row.email_broadcasts === false;
    case "targeted":
      return row.email_targeted === false;
    case "digest":
      return row.email_digest === false;
    default:
      return false;
  }
}

// ─── Tracking ───────────────────────────────────────────────────────

function injectTrackingPixel(html: string, recipientId: string): string {
  const pixelUrl = `${SITE_URL}/api/clubos/track/open/${recipientId}`;
  const pixel = `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;" />`;

  const lastDivClose = html.lastIndexOf("</div>");
  if (lastDivClose !== -1) {
    return html.slice(0, lastDivClose) + pixel + html.slice(lastDivClose);
  }
  return html + pixel;
}

function wrapClickLinks(html: string, recipientId: string): string {
  const trackBase = `${SITE_URL}/api/clubos/track/click/${recipientId}`;

  return html.replace(
    /<a\s([^>]*?)href="([^"]+)"([^>]*?)>/gi,
    (_match, before: string, href: string, after: string) => {
      if (
        href.includes("/unsubscribe") ||
        href.startsWith("mailto:") ||
        href.includes("List-Unsubscribe")
      ) {
        return `<a ${before}href="${href}"${after}>`;
      }

      const wrapped = `${trackBase}?url=${encodeURIComponent(href)}`;
      return `<a ${before}href="${wrapped}"${after}>`;
    }
  );
}

// ─── Email HTML Builder ─────────────────────────────────────────────

function buildClubEmailHtml(payload: ClubEmailPayload): string {
  const displayName = escapeHtml(payload.recipientName ?? "there");
  const unsubscribeUrl = getUnsubscribeUrl(payload.recipientId);
  const preferencesUrl = `${SITE_URL}/club/settings/email-preferences`;

  const templateCtx = buildTemplateData(
    {
      userId: payload.recipientId,
      email: payload.to,
      displayName: payload.recipientName,
    },
    {
      club_name: payload.clubName,
      unsubscribe_url: unsubscribeUrl,
      preferences_url: preferencesUrl,
    }
  );

  let body = renderTemplate(payload.bodyHtml, templateCtx);
  body = body.replace(/\{\{member_name\}\}/g, displayName);
  body = body.replace(/\{\{club_name\}\}/g, escapeHtml(payload.clubName));

  const rawHtml = `
<div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #1e1e1a;">
  <p style="font-size: 12px; color: #9a9a8e; margin-bottom: 16px;">
    Sent by ${escapeHtml(payload.clubName)} via AnglerPass
  </p>
  <p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">
    Hi ${displayName},
  </p>
  ${body}
  <p style="font-size: 13px; line-height: 1.6; color: #9a9a8e; margin-top: 32px;">
    <a href="${unsubscribeUrl}" style="color: #9a9a8e; text-decoration: underline;">Unsubscribe from all</a>
    &middot;
    <a href="${preferencesUrl}" style="color: #9a9a8e; text-decoration: underline;">Manage email preferences</a>
  </p>
  <p style="font-size: 11px; color: #c0c0b8; margin-top: 16px;">
    ${escapeHtml(payload.clubName)} &middot; Sent via <a href="${SITE_URL}" style="color: #c0c0b8;">AnglerPass</a>
  </p>
</div>`.trim();

  const tracked = injectTrackingPixel(rawHtml, payload.recipientId);
  return wrapClickLinks(tracked, payload.recipientId);
}

// ─── Core Send Function ─────────────────────────────────────────────

export async function sendClubEmail(
  admin: SupabaseClient,
  payload: ClubEmailPayload
): Promise<ClubSendResult> {
  const resend = getResend();
  if (!resend) {
    return { success: false, error: "Resend not configured" };
  }

  // Mark as sending
  await admin
    .from("club_campaign_recipients")
    .update({ status: "sent" })
    .eq("campaign_id", payload.campaignId)
    .eq("membership_id", payload.membershipId);

  const unsubscribeUrl = getUnsubscribeUrl(payload.recipientId);

  try {
    const html = buildClubEmailHtml(payload);

    const templateCtx = buildTemplateData({
      userId: payload.recipientId,
      email: payload.to,
      displayName: payload.recipientName,
    }, { club_name: payload.clubName });

    const renderedSubject = renderTemplate(payload.subject, templateCtx);

    const result = await resend.emails.send({
      from: `${payload.clubName} via AnglerPass <clubs@anglerpass.com>`,
      to: payload.to,
      subject: renderedSubject,
      html,
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        "X-ClubOS-Campaign-Id": payload.campaignId,
        "X-ClubOS-Recipient-Id": payload.membershipId,
      },
    });

    const messageId =
      result.data && "id" in result.data ? result.data.id : undefined;

    await admin
      .from("club_campaign_recipients")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        esp_message_id: messageId ?? null,
      })
      .eq("campaign_id", payload.campaignId)
      .eq("membership_id", payload.membershipId);

    return { success: true, messageId };
  } catch (err) {
    const errorMsg =
      err instanceof Error ? err.message : "Unknown send error";
    console.error(
      `[clubos/email-sender] Send failed for campaign ${payload.campaignId}, member ${payload.membershipId}:`,
      err
    );

    await admin
      .from("club_campaign_recipients")
      .update({
        status: "failed",
        error_message: errorMsg,
      })
      .eq("campaign_id", payload.campaignId)
      .eq("membership_id", payload.membershipId);

    return { success: false, error: errorMsg };
  }
}

// ─── Segment Evaluation ─────────────────────────────────────────────

interface SegmentFilters {
  membership_tier?: string[];
  status?: string[];
  activity_level?: string[];
  member_group?: string[];
  joined_after?: string;
  joined_before?: string;
}

/**
 * Build a Supabase query that matches members based on segment filters.
 * Returns matching membership rows with user profile info.
 */
export async function evaluateSegment(
  admin: SupabaseClient,
  clubId: string,
  filters: SegmentFilters,
  opts?: { limit?: number; offset?: number; countOnly?: boolean }
) {
  const selectColumns = opts?.countOnly
    ? "id"
    : "id, user_id, role, status, created_at, profiles!inner(id, email, display_name)";

  const selectOpts = opts?.countOnly
    ? { count: "exact" as const, head: true }
    : undefined;

  let query = admin
    .from("club_memberships")
    .select(selectColumns, selectOpts)
    .eq("club_id", clubId);

  // Status filter
  if (filters.status && filters.status.length > 0) {
    query = query.in("status", filters.status);
  } else {
    // Default to active members only
    query = query.eq("status", "active");
  }

  // Membership tier filter (role-based for now)
  if (filters.membership_tier && filters.membership_tier.length > 0) {
    query = query.in("membership_plan_id", filters.membership_tier);
  }

  // Joined date filters
  if (filters.joined_after) {
    query = query.gte("created_at", filters.joined_after);
  }
  if (filters.joined_before) {
    query = query.lte("created_at", filters.joined_before);
  }

  // Pagination
  if (opts?.limit) {
    query = query.limit(opts.limit);
  }
  if (opts?.offset) {
    query = query.range(opts.offset, opts.offset + (opts?.limit ?? 20) - 1);
  }

  const result = await query;

  // Post-query filtering for activity level (requires booking data)
  if (filters.activity_level && filters.activity_level.length > 0 && result.data) {
    const memberIds = (result.data as unknown as Array<{ user_id: string }>).map(
      (m) => m.user_id
    );
    if (memberIds.length > 0) {
      const { data: bookings } = await admin
        .from("bookings")
        .select("user_id, booking_date")
        .in("user_id", memberIds)
        .order("booking_date", { ascending: false });

      const lastBookingMap = new Map<string, string>();
      for (const b of bookings ?? []) {
        if (!lastBookingMap.has(b.user_id)) {
          lastBookingMap.set(b.user_id, b.booking_date);
        }
      }

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      (result as { data: unknown }).data = (result.data as unknown as Array<{ user_id: string }>).filter((m) => {
        const lastBooking = lastBookingMap.get(m.user_id);
        const lastDate = lastBooking ? new Date(lastBooking) : null;

        const level = !lastDate || lastDate < ninetyDaysAgo
          ? "dormant"
          : lastDate < thirtyDaysAgo
            ? "inactive"
            : "active";

        return filters.activity_level!.includes(level);
      });
    }
  }

  // Post-query filtering for member_group
  if (filters.member_group && filters.member_group.length > 0 && result.data) {
    const { data: assignments } = await admin
      .from("club_member_group_assignments")
      .select("membership_id")
      .in("group_id", filters.member_group);

    const groupMemberIds = new Set(
      (assignments ?? []).map((a) => a.membership_id)
    );

    (result as { data: unknown }).data = (result.data as unknown as Array<{ id: string }>).filter((m) =>
      groupMemberIds.has(m.id)
    );
  }

  return result;
}

// ─── Batch Send ─────────────────────────────────────────────────────

/**
 * Process a batch of pending recipients for a campaign.
 * Returns count of successfully sent, skipped, and failed.
 */
export async function processClubCampaignBatch(
  admin: SupabaseClient,
  campaignId: string,
  batchSize = 50
): Promise<{ sent: number; skipped: number; failed: number }> {
  // Load campaign
  const { data: campaign } = await admin
    .from("club_campaigns")
    .select("id, club_id, type, subject, body_html, status")
    .eq("id", campaignId)
    .single();

  if (!campaign || !["sending", "scheduled"].includes(campaign.status)) {
    return { sent: 0, skipped: 0, failed: 0 };
  }

  // Load club name
  const { data: club } = await admin
    .from("clubs")
    .select("name")
    .eq("id", campaign.club_id)
    .single();

  if (!club) {
    return { sent: 0, skipped: 0, failed: 0 };
  }

  // Fetch pending recipients
  const { data: recipients } = await admin
    .from("club_campaign_recipients")
    .select("id, campaign_id, membership_id, email, status")
    .eq("campaign_id", campaignId)
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(batchSize);

  if (!recipients || recipients.length === 0) {
    return { sent: 0, skipped: 0, failed: 0 };
  }

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const recipient of recipients) {
    // Check club-level opt-out
    const optedOut = await hasClubOptOut(
      admin,
      recipient.membership_id,
      campaign.type as "broadcast" | "targeted" | "digest"
    );

    if (optedOut) {
      await admin
        .from("club_campaign_recipients")
        .update({ status: "skipped", error_message: "Opted out of this campaign type" })
        .eq("id", recipient.id);
      skipped++;
      continue;
    }

    // Get member profile
    const { data: membership } = await admin
      .from("club_memberships")
      .select("user_id, profiles!inner(id, display_name)")
      .eq("id", recipient.membership_id)
      .single();

    if (!membership) {
      await admin
        .from("club_campaign_recipients")
        .update({ status: "failed", error_message: "Membership not found" })
        .eq("id", recipient.id);
      failed++;
      continue;
    }

    const profile = membership.profiles as unknown as {
      id: string;
      display_name: string | null;
    };

    const result = await sendClubEmail(admin, {
      recipientId: profile.id,
      campaignId: recipient.campaign_id,
      to: recipient.email,
      subject: campaign.subject,
      bodyHtml: campaign.body_html,
      recipientName: profile.display_name ?? undefined,
      clubName: club.name,
      clubId: campaign.club_id,
      membershipId: recipient.membership_id,
    });

    if (result.success) {
      sent++;
    } else {
      failed++;
    }
  }

  return { sent, skipped, failed };
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
