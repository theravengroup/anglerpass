/**
 * Checkr API integration — raw fetch helpers (no SDK).
 *
 * Checkr handles background checks for guide verification.
 * Uses the hosted invitation flow so Checkr collects PII,
 * manages consent, and handles FCRA compliance.
 */

import { createHmac } from "crypto";

const CHECKR_API = "https://api.checkr.com/v1";
const CHECKR_KEY = () => process.env.CHECKR_API_KEY!;

// ─── API Helpers ───────────────────────────────────────────────────

async function checkrPost(path: string, body: Record<string, string>) {
  const res = await fetch(`${CHECKR_API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(CHECKR_KEY() + ":").toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body).toString(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(
      `Checkr API error (${res.status}): ${JSON.stringify(err)}`
    );
  }
  return res.json();
}

async function checkrGet(path: string) {
  const res = await fetch(`${CHECKR_API}${path}`, {
    headers: {
      Authorization: `Basic ${Buffer.from(CHECKR_KEY() + ":").toString("base64")}`,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(
      `Checkr API error (${res.status}): ${JSON.stringify(err)}`
    );
  }
  return res.json();
}

// ─── Public API ────────────────────────────────────────────────────

/**
 * Create a Checkr candidate (the person being screened).
 * Returns the candidate object with `id`.
 */
export async function createCandidate(params: {
  email: string;
  first_name?: string;
  last_name?: string;
}) {
  return checkrPost("/candidates", {
    email: params.email,
    ...(params.first_name ? { first_name: params.first_name } : {}),
    ...(params.last_name ? { last_name: params.last_name } : {}),
  });
}

/**
 * Create a Checkr invitation for the hosted flow.
 * The candidate fills in their PII on Checkr's hosted page,
 * which handles consent and FCRA compliance.
 *
 * Returns the invitation object with `invitation_url`.
 */
export async function createInvitation(
  candidateId: string,
  packageSlug: string = "tasker_standard"
) {
  return checkrPost("/invitations", {
    candidate_id: candidateId,
    package: packageSlug,
  });
}

/**
 * Retrieve a completed report by ID.
 */
export async function getReport(reportId: string) {
  return checkrGet(`/reports/${reportId}`);
}

// ─── Webhook Verification ──────────────────────────────────────────

/**
 * Verify a Checkr webhook signature using HMAC-SHA256.
 * Returns true if the signature is valid.
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const secret = process.env.CHECKR_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("[checkr] No CHECKR_WEBHOOK_SECRET configured");
    return false;
  }

  const expected = createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  // Timing-safe comparison
  if (expected.length !== signature.length) return false;
  let result = 0;
  for (let i = 0; i < expected.length; i++) {
    result |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return result === 0;
}
