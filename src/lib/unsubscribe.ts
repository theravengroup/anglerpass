/**
 * Unsubscribe token utilities.
 *
 * Generates and verifies HMAC-signed tokens so users can one-click
 * unsubscribe from emails without logging in.
 *
 * Token format:  base64url(userId) + "." + base64url(hmac)
 */

import { createHmac } from "crypto";

function getSecret(): string {
  const secret =
    process.env.UNSUBSCRIBE_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === "development") return "dev-only-secret";
    throw new Error(
      "Missing UNSUBSCRIBE_SECRET or SUPABASE_SERVICE_ROLE_KEY — cannot sign unsubscribe tokens"
    );
  }
  return secret;
}

const SECRET = getSecret();

function sign(userId: string): string {
  return createHmac("sha256", SECRET).update(userId).digest("base64url");
}

/** Generate a signed unsubscribe token for a user. */
export function generateUnsubscribeToken(userId: string): string {
  const encodedId = Buffer.from(userId).toString("base64url");
  const signature = sign(userId);
  return `${encodedId}.${signature}`;
}

/** Verify a token and return the userId, or null if invalid. */
export function verifyUnsubscribeToken(token: string): string | null {
  const dotIndex = token.indexOf(".");
  if (dotIndex === -1) return null;

  const encodedId = token.slice(0, dotIndex);
  const signature = token.slice(dotIndex + 1);

  try {
    const userId = Buffer.from(encodedId, "base64url").toString("utf8");
    const expected = sign(userId);
    // Constant-time comparison
    if (signature.length !== expected.length) return null;
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return null;
    let diff = 0;
    for (let i = 0; i < a.length; i++) {
      diff |= a[i] ^ b[i];
    }
    return diff === 0 ? userId : null;
  } catch {
    return null;
  }
}

/** Build the full unsubscribe URL for a user. */
export function getUnsubscribeUrl(userId: string): string {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://anglerpass.com";
  const token = generateUnsubscribeToken(userId);
  return `${siteUrl}/api/notifications/unsubscribe?token=${token}`;
}
