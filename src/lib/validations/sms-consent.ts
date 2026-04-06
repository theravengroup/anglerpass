import { z } from "zod";

/** US phone number: 10 digits, optionally with +1 prefix, parens, dashes, spaces */
const US_PHONE_REGEX = /^\+?1?\s*\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;

export const smsConsentSchema = z.object({
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(US_PHONE_REGEX, "Enter a valid US phone number"),
  consented: z.boolean(),
});

export type SmsConsentInput = z.infer<typeof smsConsentSchema>;

/**
 * The exact TCPA disclosure text users agree to.
 * Stored as a snapshot in the database at time of consent for legal audit.
 */
export const SMS_CONSENT_DISCLOSURE =
  "I agree to receive text messages from AnglerPass including booking confirmations, " +
  "trip reminders, and account notifications. Message frequency varies. Message and " +
  "data rates may apply. Reply STOP to unsubscribe at any time.";

/**
 * Strip a phone string down to E.164 format (+1XXXXXXXXXX).
 */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}
