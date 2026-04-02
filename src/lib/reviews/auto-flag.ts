import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

// ─── Auto-Flag Configuration ───────────────────────────────────────

/** Minimum profanity hits before flagging (configurable) */
const PROFANITY_THRESHOLD = 2;

/** Threat keywords and phrases */
const THREAT_PATTERNS = [
  /\bkill\b/i,
  /\bhurt\b/i,
  /\bdestroy\b/i,
  /\bruin you\b/i,
  /\bburn\s?(it\s)?down\b/i,
  /\bcome\s+for\s+you\b/i,
  /\byou('re|\sare)\s+dead\b/i,
  /\bi('ll|\swill)\s+(find|get|hurt|kill)\b/i,
  /\bwatch your back\b/i,
  /\byou('ll|\swill)\s+regret\b/i,
  /\bthreat(en)?\b/i,
];

/** Extortion patterns: "refund" near negative review language */
const EXTORTION_PATTERNS = [
  /refund.{0,60}(1[\s-]?star|one[\s-]?star|negative\s+review|bad\s+review)/i,
  /(1[\s-]?star|one[\s-]?star|negative\s+review|bad\s+review).{0,60}refund/i,
  /refund.{0,40}(or\s+else|unless\s+you)/i,
  /(or\s+else|unless\s+you).{0,40}refund/i,
  /\bunless\s+you.{0,40}(review|rating|star)/i,
];

/** Personal contact info patterns */
const CONTACT_INFO_PATTERNS = [
  // Phone numbers: (xxx) xxx-xxxx, xxx-xxx-xxxx, xxx.xxx.xxxx, etc.
  /\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4}/,
  // Email addresses
  /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/,
  // Street addresses (number + street name + common suffixes)
  /\d{1,5}\s+[A-Z][a-z]+\s+(St|Street|Ave|Avenue|Blvd|Boulevard|Rd|Road|Dr|Drive|Ln|Lane|Ct|Court|Way|Pl|Place)\b/i,
];

/** Configurable profanity list */
const PROFANITY_LIST = [
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "damn",
  "cunt",
  "dick",
  "bastard",
  "motherfucker",
  "bullshit",
  "horseshit",
  "piss",
];

// ─── Types ──────────────────────────────────────────────────────────

interface AutoFlagResult {
  shouldFlag: boolean;
  reason: string | null;
  notes: string | null;
}

// ─── Main Entry Point ───────────────────────────────────────────────

/**
 * Scans review text for auto-flag triggers.
 *
 * Returns whether the review should be flagged and which category matched.
 * Does NOT suppress the review — only flags for human review.
 */
export function scanForAutoFlag(reviewText: string): AutoFlagResult {
  // Check threats
  const threatMatch = THREAT_PATTERNS.find((p) => p.test(reviewText));
  if (threatMatch) {
    return {
      shouldFlag: true,
      reason: "threat",
      notes: `Auto-flagged: threatening language detected`,
    };
  }

  // Check extortion
  const extortionMatch = EXTORTION_PATTERNS.find((p) => p.test(reviewText));
  if (extortionMatch) {
    return {
      shouldFlag: true,
      reason: "extortion",
      notes: `Auto-flagged: extortion pattern detected`,
    };
  }

  // Check personal contact info
  const contactMatch = CONTACT_INFO_PATTERNS.find((p) => p.test(reviewText));
  if (contactMatch) {
    return {
      shouldFlag: true,
      reason: "doxxing",
      notes: `Auto-flagged: personal contact information detected`,
    };
  }

  // Check profanity threshold
  const profanityCount = countProfanity(reviewText);
  if (profanityCount >= PROFANITY_THRESHOLD) {
    return {
      shouldFlag: true,
      reason: "other",
      notes: `Auto-flagged: ${profanityCount} profanity instances detected (threshold: ${PROFANITY_THRESHOLD})`,
    };
  }

  return { shouldFlag: false, reason: null, notes: null };
}

/**
 * If a review should be auto-flagged, create the flag record.
 * Sets flagged_by_role = "anglerpass_staff" per spec.
 *
 * Does NOT suppress the review — only flags for human review.
 */
export async function autoFlagReviewIfNeeded(
  admin: SupabaseClient,
  reviewId: string,
  reviewText: string
): Promise<{ flagged: boolean; reason?: string }> {
  const result = scanForAutoFlag(reviewText);

  if (!result.shouldFlag || !result.reason) {
    return { flagged: false };
  }

  // Create flag record with anglerpass_staff role
  const { error: flagError } = await admin
    .from("review_flags")
    .insert({
      review_id: reviewId,
      flagged_by_user_id: null,
      flagged_by_role: "anglerpass_staff",
      flag_reason: result.reason,
      flag_notes: result.notes,
    });

  if (flagError) {
    console.error("[auto-flag] Failed to create flag:", flagError);
    return { flagged: false };
  }

  // Update review status to flagged (NOT suppressed)
  const { error: updateError } = await admin
    .from("trip_reviews")
    .update({
      status: "flagged",
      updated_at: new Date().toISOString(),
    })
    .eq("id", reviewId);

  if (updateError) {
    console.error("[auto-flag] Failed to update review status:", updateError);
  }

  return { flagged: true, reason: result.reason };
}

// ─── Utilities ──────────────────────────────────────────────────────

function countProfanity(text: string): number {
  const lower = text.toLowerCase();
  let count = 0;
  for (const word of PROFANITY_LIST) {
    // Match whole words or compound words containing profanity
    const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, "gi");
    const matches = lower.match(regex);
    if (matches) count += matches.length;
  }
  return count;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
