import { z } from "zod";
import { PLATFORM_ROLES, ASSIGNABLE_CLUB_ROLES, DELEGATE_LEVELS } from "@/lib/permissions/constants";

// ─── Platform Staff ──────────────────────────────────────────────────

export const platformStaffAssignSchema = z.object({
  user_id: z.string().uuid("Invalid user ID"),
  role: z.enum(PLATFORM_ROLES),
});

export const platformStaffRevokeSchema = z.object({
  user_id: z.string().uuid("Invalid user ID"),
  reason: z.string().max(500).optional(),
});

// ─── Club Role Assignment ────────────────────────────────────────────

export const clubRoleAssignSchema = z.object({
  member_id: z.string().uuid("Invalid member ID"),
  role: z.enum(ASSIGNABLE_CLUB_ROLES),
});

// ─── Angler Delegates ─────────────────────────────────────��──────────

export const delegateInviteSchema = z.object({
  email: z.string().email("Valid email required"),
  access_level: z.enum(DELEGATE_LEVELS),
});

export const delegateUpdateSchema = z.object({
  access_level: z.enum(DELEGATE_LEVELS),
});

// ─── On-Behalf-Of Booking ────────────────────────────────────────────

export const onBehalfBookingSchema = z.object({
  angler_id: z.string().uuid("Invalid angler ID"),
  property_id: z.string().uuid("Invalid property ID"),
  club_membership_id: z.string().uuid("Invalid membership ID"),
  booking_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  booking_end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD").optional(),
  duration: z.enum(["full_day", "half_day"]),
  party_size: z.number().int().min(1).max(20),
  non_fishing_guests: z.number().int().min(0).max(50).default(0),
  message: z.string().max(1000).optional(),
  guide_id: z.string().uuid().optional(),
});
