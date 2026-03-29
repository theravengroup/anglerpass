import { z } from "zod";

export const BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "declined",
  "cancelled",
  "completed",
] as const;

export const DURATIONS = ["full_day", "half_day"] as const;

export const PLATFORM_FEE_RATE = 0.05; // 5%

// ─── Create Booking ────────────────────────────────────────────────
export const bookingSchema = z.object({
  property_id: z.string().uuid(),
  club_membership_id: z.string().uuid(),
  booking_date: z.string().min(1, "Date is required"),
  duration: z.enum(DURATIONS).default("full_day"),
  party_size: z.number().int().min(1).max(20).default(1),
  message: z.string().max(2000).optional().or(z.literal("")),
});

export type BookingFormData = z.infer<typeof bookingSchema>;

// ─── Booking Status Update (landowner actions) ─────────────────────
export const bookingStatusSchema = z.object({
  status: z.enum(["confirmed", "declined"]),
  landowner_notes: z.string().max(2000).optional().or(z.literal("")),
});

export type BookingStatusData = z.infer<typeof bookingStatusSchema>;

// ─── Booking Cancellation (angler action) ──────────────────────────
export const bookingCancelSchema = z.object({
  status: z.literal("cancelled"),
});

// ─── Calculate fees ────────────────────────────────────────────────
export function calculateBookingFees(baseRate: number) {
  const platformFee = Math.round(baseRate * PLATFORM_FEE_RATE * 100) / 100;
  const totalAmount = Math.round((baseRate + platformFee) * 100) / 100;
  return { baseRate, platformFee, totalAmount };
}
