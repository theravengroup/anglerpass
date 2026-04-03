/**
 * Referral code generation and link building utilities.
 */

const REFERRAL_CODE_LENGTH = 8;

/** Character set excluding ambiguous characters (0/O, 1/l/I) */
const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * Generate a random referral code (8 alphanumeric characters).
 * Uses crypto.getRandomValues for uniform randomness.
 */
export function generateReferralCode(): string {
  const values = new Uint8Array(REFERRAL_CODE_LENGTH);
  crypto.getRandomValues(values);
  return Array.from(values)
    .map((v) => CHARSET[v % CHARSET.length])
    .join("");
}

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://anglerpass.com";

/**
 * Build the full referral join link for a club.
 */
export function buildReferralLink(
  clubId: string,
  referralCode: string
): string {
  return `${SITE_URL}/join/${clubId}?ref=${referralCode}`;
}
