/**
 * Welcome email sequence — 3 emails per role, sent after signup.
 *
 * Email 1: Immediate (sent from auth callback on first login)
 * Email 2: Day 2 (sent by daily cron)
 * Email 3: Day 5 (sent by daily cron)
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getResend } from "@/lib/email";
import { getUnsubscribeUrl } from "@/lib/unsubscribe";
import { SITE_URL } from "@/lib/constants";

// ─── Types ──────────────────────────────────────────────────────────

type WelcomeRole = "angler" | "guide" | "club_admin" | "landowner";

interface WelcomeEmailContent {
  subject: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  ctaColor: string;
}

// ─── Email Content ──────────────────────────────────────────────────

const WELCOME_CONTENT: Record<WelcomeRole, [WelcomeEmailContent, WelcomeEmailContent, WelcomeEmailContent]> = {
  angler: [
    {
      subject: "Welcome to AnglerPass",
      body: "You now have access to a growing network of private fly fishing waters across the country. The best way to get started is to find a club that manages water near you.\n\nBrowse clubs on the platform, request membership, and once accepted you can book your first trip on private water.",
      ctaLabel: "Find a Club",
      ctaUrl: "/angler",
      ctaColor: "#8b6914",
    },
    {
      subject: "Complete Your Angler Profile",
      body: "A complete profile helps clubs evaluate your membership application and helps guides tailor trips to your skill level.\n\nAdd your experience level, the species you target, your home water region, and a short bio. It only takes a minute and makes a real difference.",
      ctaLabel: "Complete Your Profile",
      ctaUrl: "/angler",
      ctaColor: "#8b6914",
    },
    {
      subject: "Explore Private Water Near You",
      body: "AnglerPass connects you with private waters that most anglers never get to fish. Club-managed properties mean well-maintained access, limited pressure, and healthy fisheries.\n\nBrowse available clubs, check out their affiliated waters, and start planning your next trip. New properties are added regularly.",
      ctaLabel: "Browse Clubs",
      ctaUrl: "/angler",
      ctaColor: "#8b6914",
    },
  ],
  guide: [
    {
      subject: "Welcome to AnglerPass",
      body: "AnglerPass helps professional guides connect with quality anglers on private water. To start receiving bookings, you will need to complete our verification process.\n\nVerification includes a background check, identity confirmation, and credential review. Once approved, you will appear in our guide directory and can be added to bookings.",
      ctaLabel: "Start Verification",
      ctaUrl: "/guide",
      ctaColor: "#1e1e1a",
    },
    {
      subject: "Complete Your Guide Profile",
      body: "A strong profile is how anglers find and choose you. Add your daily rate, the species and water types you specialize in, your years of experience, and a bio that reflects your guiding style.\n\nUpload your credentials \u2014 fishing license, CPR certification, and insurance \u2014 to move through verification quickly.",
      ctaLabel: "Build Your Profile",
      ctaUrl: "/guide/profile",
      ctaColor: "#1e1e1a",
    },
    {
      subject: "Get Verified and Start Guiding",
      body: "Once your profile and credentials are reviewed, you will be approved to guide on the platform. From there, clubs can approve you for their waters and anglers can add you to bookings.\n\nYou can also send trip proposals directly to anglers \u2014 a great way to fill your calendar and build repeat clients.",
      ctaLabel: "Check Verification Status",
      ctaUrl: "/guide",
      ctaColor: "#1e1e1a",
    },
  ],
  club_admin: [
    {
      subject: "Welcome to AnglerPass",
      body: "AnglerPass gives your club a modern platform for managing members, properties, and bookings. Start by setting up your club profile so anglers can find you.\n\nAdd your club description, set membership fees, and configure how new members can join.",
      ctaLabel: "Set Up Your Club",
      ctaUrl: "/club",
      ctaColor: "#3a6b7c",
    },
    {
      subject: "Complete Your Club Setup",
      body: "A fully set up club attracts quality members and runs more smoothly. Here is what to do next:\n\nAdd a description and cover photo. Invite your existing members by email. Connect with landowner properties or register club-owned water. Set your initiation fee and annual dues.",
      ctaLabel: "Continue Setup",
      ctaUrl: "/club",
      ctaColor: "#3a6b7c",
    },
    {
      subject: "Grow Your Club on AnglerPass",
      body: "AnglerPass is more than a booking tool \u2014 it is a network. Cross-club agreements let your members access water from partnering clubs, and member referrals help you grow organically.\n\nAs more clubs join the platform, the value of membership increases for everyone. Consider reaching out to neighboring clubs about joining.",
      ctaLabel: "Explore Your Dashboard",
      ctaUrl: "/club",
      ctaColor: "#3a6b7c",
    },
  ],
  landowner: [
    {
      subject: "Welcome to AnglerPass",
      body: "AnglerPass helps landowners earn revenue from their water while maintaining control over access. The first step is registering your property on the platform.\n\nAdd your property details, set pricing and availability, and decide how you want access managed \u2014 through a club, directly, or both.",
      ctaLabel: "Register Your Property",
      ctaUrl: "/landowner",
      ctaColor: "#2a5a3a",
    },
    {
      subject: "Complete Your Property Listing",
      body: "A complete listing helps anglers understand what makes your water special and drives more bookings.\n\nAdd photos of the water and access points. Describe the fishery \u2014 species, habitat, and what makes it unique. Set your daily rates and seasonal availability. Include any access instructions or gate codes.",
      ctaLabel: "Update Your Listing",
      ctaUrl: "/landowner/properties",
      ctaColor: "#2a5a3a",
    },
    {
      subject: "Start Earning from Your Water",
      body: "Properties on AnglerPass earn passive income from day-access bookings while clubs handle angler vetting and quality control.\n\nAffiliate with a local club to let their vetted members book your water. You maintain full control \u2014 set blackout dates, capacity limits, and pricing. Payouts are handled automatically through Stripe.",
      ctaLabel: "View Your Dashboard",
      ctaUrl: "/landowner",
      ctaColor: "#2a5a3a",
    },
  ],
};

// ─── Public API ─────────────────────────────────────────────────────

/**
 * Get the email content for a specific role and email number (1, 2, or 3).
 */
export function getWelcomeEmailContent(
  role: string,
  emailNumber: 1 | 2 | 3
): WelcomeEmailContent | null {
  const welcomeRole = normalizeRole(role);
  if (!welcomeRole) return null;
  return WELCOME_CONTENT[welcomeRole][emailNumber - 1];
}

/**
 * Send a welcome email for a specific step.
 * Updates the welcome_email_step on the profile to prevent duplicates.
 */
export async function sendWelcomeEmail(
  admin: SupabaseClient,
  userId: string,
  role: string,
  emailNumber: 1 | 2 | 3
): Promise<boolean> {
  const content = getWelcomeEmailContent(role, emailNumber);
  if (!content) return false;

  const resend = getResend();
  if (!resend) return false;

  // Get user email
  const { data: authData, error: authErr } =
    await admin.auth.admin.getUserById(userId);

  if (authErr || !authData?.user?.email) {
    console.error("[welcome-emails] Auth lookup error:", authErr);
    return false;
  }

  const email = authData.user.email;

  // Get display name
  const { data: profile } = await admin
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .single();

  const displayName = profile?.display_name ?? "there";

  // Check email preferences (respect global unsubscribe)
  const { data: prefs } = await admin
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  // If user has explicitly unsubscribed from member emails, skip
  if (prefs && (prefs as Record<string, unknown>)["email_member_approved"] === false) {
    return false;
  }

  // Generate unsubscribe URL
  const unsubscribeUrl = getUnsubscribeUrl(userId);

  // Validate CTA URL
  const safePath = content.ctaUrl.startsWith("/") ? content.ctaUrl : "";
  const ctaUrl = safePath ? `${SITE_URL}${safePath}` : SITE_URL;

  try {
    await resend.emails.send({
      from: "AnglerPass <hello@anglerpass.com>",
      to: email,
      subject: content.subject,
      html: buildWelcomeEmailHtml({
        title: escapeHtml(content.subject),
        displayName: escapeHtml(displayName),
        body: escapeHtml(content.body),
        ctaUrl,
        ctaLabel: content.ctaLabel,
        ctaColor: content.ctaColor,
        unsubscribeUrl,
      }),
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });

    // Update tracking column
    // welcome_email_step is added by migration but not yet in generated types,
    // so we cast the update payload to satisfy TypeScript.
    await admin
      .from("profiles")
      .update({ welcome_email_step: emailNumber } as Record<string, unknown>)
      .eq("id", userId);

    return true;
  } catch (err) {
    console.error("[welcome-emails] Send error:", err);
    return false;
  }
}

// ─── Email HTML Builder ─────────────────────────────────────────────

function buildWelcomeEmailHtml(params: {
  title: string;
  displayName: string;
  body: string;
  ctaUrl: string;
  ctaLabel: string;
  ctaColor: string;
  unsubscribeUrl: string;
}): string {
  // Convert newlines in body to HTML paragraphs
  const bodyHtml = params.body
    .split("\n\n")
    .map((p) => `<p style="font-size: 16px; line-height: 1.7; color: #5a5a52; margin-bottom: 16px;">${p.replace(/\n/g, "<br/>")}</p>`)
    .join("");

  return `
<div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #1e1e1a;">
  <h2 style="font-size: 22px; font-weight: 500; margin-bottom: 8px;">${params.title}</h2>
  <p style="font-size: 16px; line-height: 1.7; color: #5a5a52;">
    Hi ${params.displayName},
  </p>
  ${bodyHtml}
  <div style="margin: 28px 0;">
    <a href="${params.ctaUrl}"
       style="display: inline-block; padding: 14px 32px; background: ${params.ctaColor}; color: #fff; text-decoration: none; border-radius: 6px; font-family: sans-serif; font-size: 14px; font-weight: 500; letter-spacing: 0.3px;">
      ${params.ctaLabel}
    </a>
  </div>
  <p style="font-size: 13px; line-height: 1.6; color: #9a9a8e;">
    <a href="${params.unsubscribeUrl}" style="color: #9a9a8e; text-decoration: underline;">Unsubscribe from all emails</a> &middot; <a href="${SITE_URL}/dashboard/settings" style="color: #9a9a8e; text-decoration: underline;">Email preferences</a>
  </p>
  <p style="font-size: 13px; color: #9a9a8e; margin-top: 24px;">&mdash; The AnglerPass Team</p>
</div>`.trim();
}

// ─── Utilities ──────────────────────────────────────────────────────

function normalizeRole(role: string): WelcomeRole | null {
  const map: Record<string, WelcomeRole> = {
    angler: "angler",
    guide: "guide",
    club_admin: "club_admin",
    landowner: "landowner",
  };
  return map[role] ?? null;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
