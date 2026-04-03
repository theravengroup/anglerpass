import { z } from "zod";

export const BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "declined",
  "cancelled",
  "completed",
] as const;

export const DURATIONS = ["full_day", "half_day"] as const;

// ─── Create Booking ────────────────────────────────────────────────
export const bookingSchema = z.object({
  property_id: z.uuid(),
  club_membership_id: z.uuid(),
  booking_date: z.string().min(1, "Date is required"),
  booking_end_date: z.string().optional(),
  duration: z.enum(DURATIONS).default("full_day"),
  party_size: z.number().int().min(1).max(20).default(1),
  non_fishing_guests: z.number().int().min(0).max(50).default(0),
  message: z.string().max(2000).optional().or(z.literal("")),
  guide_id: z.uuid().optional(),
});

export type BookingFormData = z.input<typeof bookingSchema>;

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

