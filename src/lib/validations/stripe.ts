import { z } from "zod";

// ─── Payout ───────────────────────────────────────────────────────

export const payoutSchema = z.object({
  bookingId: z.string().uuid(),
});

export type PayoutInput = z.infer<typeof payoutSchema>;

// ─── Club Subscription ───────────────────────────────────────────

export const clubSubscriptionSchema = z.object({
  clubId: z.string().uuid(),
  /** Stripe Price ID for the selected tier */
  priceId: z.string(),
  /** Platform tier name for tracking */
  tier: z.enum(["starter", "standard", "pro"]),
});

export type ClubSubscriptionInput = z.infer<typeof clubSubscriptionSchema>;

// ─── Membership Checkout ──────────────────────────────────────────

export const membershipCheckoutSchema = z.object({
  clubId: z.string().uuid(),
  /** Stripe Price ID for the recurring dues (created by club admin) */
  duesPriceId: z.string().optional(),
  membershipType: z.enum(["individual", "corporate", "corporate_employee"]).default("individual"),
  invitationToken: z.string().optional(),
  companyName: z.string().optional(),
});

export type MembershipCheckoutInput = z.infer<typeof membershipCheckoutSchema>;

// ─── Create Payment Intent ────────────────────────────────────────

export const createPaymentIntentSchema = z.object({
  bookingId: z.string().uuid(),
  amountCents: z.number().int().positive(),
  platformFeeCents: z.number().int().nonnegative(),
});

export type CreatePaymentIntentInput = z.infer<typeof createPaymentIntentSchema>;

// ─── Capture Payment ──────────────────────────────────────────────

export const capturePaymentSchema = z.object({
  bookingId: z.string().uuid(),
});

export type CapturePaymentInput = z.infer<typeof capturePaymentSchema>;

// ─── Cancel Hold ──────────────────────────────────────────────────

export const cancelHoldSchema = z.object({
  bookingId: z.string().uuid(),
});

export type CancelHoldInput = z.infer<typeof cancelHoldSchema>;
