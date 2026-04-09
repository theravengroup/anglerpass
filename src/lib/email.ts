import "server-only";

import { Resend } from "resend";

/**
 * Shared Resend singleton. Import this instead of creating `new Resend()`
 * in each API route. Returns null if RESEND_API_KEY is not set (safe for
 * local dev without email configured).
 */
let _resend: Resend | null = null;

export function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}
