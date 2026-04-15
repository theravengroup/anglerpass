import { z } from "zod";
import {
  PROPERTY_CLASSIFICATIONS,
  PRICING_MODES,
  LEASE_MIN_USD,
  LEASE_MAX_USD,
} from "@/lib/constants/fees";

export const WATER_TYPES = [
  "river",
  "stream",
  "lake",
  "pond",
  "spring_creek",
  "tailwater",
  "reservoir",
] as const;

export const COMMON_SPECIES = [
  "Rainbow Trout",
  "Brown Trout",
  "Brook Trout",
  "Cutthroat Trout",
  "Bull Trout",
  "Lake Trout",
  "Steelhead",
  "Largemouth Bass",
  "Smallmouth Bass",
  "Walleye",
  "Northern Pike",
  "Musky",
  "Salmon",
  "Grayling",
  "Carp",
] as const;

export const PROPERTY_STATUSES = [
  "draft",
  "pending_review",
  "changes_requested",
  "published",
  "archived",
] as const;

export const MIN_PHOTOS = 3;
export const MAX_PHOTOS = 10;

export const propertySchema = z
  .object({
    // Basic info
    name: z.string().min(1, "Property name is required").max(200),
    description: z.string().max(5000).optional().or(z.literal("")),
    location_description: z.string().max(1000).optional().or(z.literal("")),
    coordinates: z
      .string()
      .max(100)
      .optional()
      .or(z.literal(""))
      .refine(
        (val) => {
          if (!val) return true;
          const match = val.match(
            /^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/
          );
          if (!match) return false;
          const lat = parseFloat(match[1]);
          const lng = parseFloat(match[2]);
          return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
        },
        { message: "Enter coordinates as latitude, longitude (e.g. 39.2242, -105.9731)" }
      ),

    // Water & species
    water_type: z.enum(WATER_TYPES).optional().or(z.literal("")),
    species: z.array(z.string()).default([]),
    water_miles: z.number().min(0).optional().nullable(),

    // Guest capacity
    max_rods: z
      .number()
      .int()
      .min(1, "Must allow at least 1 rod")
      .optional()
      .nullable(),
    max_guests: z
      .number()
      .int()
      .min(1, "Must allow at least 1 person")
      .optional()
      .nullable(),

    // Booking limits (property-level)
    max_bookings_per_member_per_month: z
      .number()
      .int()
      .min(1, "Must allow at least 1 booking per month")
      .optional()
      .nullable(),
    advance_booking_days: z
      .number()
      .int()
      .min(1, "Must allow at least 1 day advance booking")
      .optional()
      .nullable(),

    // Regulations
    regulations: z.string().max(5000).optional().or(z.literal("")),

    // Photos (URLs stored after upload)
    photos: z.array(z.string()).default([]),

    // Pricing — structured
    rate_adult_full_day: z.number().min(0).optional().nullable(),
    rate_youth_full_day: z.number().min(0).optional().nullable(),
    rate_child_full_day: z.number().min(0).optional().nullable(),
    half_day_allowed: z.boolean().default(false),
    rate_adult_half_day: z.number().min(0).optional().nullable(),
    rate_youth_half_day: z.number().min(0).optional().nullable(),
    rate_child_half_day: z.number().min(0).optional().nullable(),

    // Lodging
    lodging_available: z.boolean().default(false),
    lodging_url: z.url("Please enter a valid URL").optional().or(z.literal("")),

    // Access (private — not displayed publicly)
    access_notes: z.string().max(2000).optional().or(z.literal("")),
    gate_code_required: z.boolean().default(false),
    gate_code: z.string().max(100).optional().or(z.literal("")),

    // ── Pricing model ────────────────────────────────────────────
    //
    // Every property is one of:
    //   • rod_fee_split + classification  — club & landowner share rod fees
    //     per classification ratio (Select 50/50, Premier 35/65, Signature
    //     25/75). Default model at onboarding.
    //   • upfront_lease — club pays the landowner an annual lease via ACH;
    //     rod-fee revenue goes 100% to the club thereafter.
    //
    // Lease fields are optional at draft time; the publish gate (enforced at
    // the DB trigger layer) requires a classification OR an active lease.
    pricing_mode: z.enum(PRICING_MODES).default("rod_fee_split"),
    classification: z.enum(PROPERTY_CLASSIFICATIONS).optional().nullable(),
    lease_amount_usd: z
      .number()
      .min(LEASE_MIN_USD, `Lease must be at least $${LEASE_MIN_USD.toLocaleString()}`)
      .max(LEASE_MAX_USD, `Lease must not exceed $${LEASE_MAX_USD.toLocaleString()}`)
      .optional()
      .nullable(),
    lease_term_months: z
      .number()
      .int()
      .min(1, "Lease term must be at least 1 month")
      .max(60, "Lease term cannot exceed 60 months")
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      if (data.half_day_allowed) {
        return (
          data.rate_adult_half_day != null &&
          data.rate_youth_half_day != null &&
          data.rate_child_half_day != null
        );
      }
      return true;
    },
    {
      message: "Half-day rates are required when half-day bookings are allowed",
      path: ["rate_adult_half_day"],
    }
  )
  .refine(
    (data) => {
      if (data.max_rods != null && data.max_guests != null) {
        return data.max_rods <= data.max_guests;
      }
      return true;
    },
    {
      message: "Max rods cannot exceed max guests (total people on property)",
      path: ["max_rods"],
    }
  )
  .refine(
    (data) => {
      // Lease mode needs both amount and term for publish; draft can skip.
      if (data.pricing_mode === "upfront_lease") {
        if (data.lease_amount_usd != null && data.lease_term_months == null) {
          return false;
        }
      }
      return true;
    },
    {
      message: "Lease term is required when a lease amount is set",
      path: ["lease_term_months"],
    }
  );

export type PropertyFormData = z.input<typeof propertySchema>;

export const propertyStatusTransition = z.object({
  status: z.enum(["pending_review", "draft"]),
});

export type PropertyStatusTransition = z.infer<typeof propertyStatusTransition>;

// ─── Property Claim ───────────────────────────────────────────────

export const propertyClaimSchema = z.object({
  token: z.string().uuid("Invalid claim token"),
});

export type PropertyClaimInput = z.infer<typeof propertyClaimSchema>;

// ─── Bulk Availability ────────────────────────────────────────────

export const bulkAvailabilitySchema = z.object({
  dates: z
    .array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .min(1, "At least one date required")
    .max(365, "Cannot update more than 365 dates at once"),
  status: z.enum(["blocked", "available", "maintenance"]),
  reason: z.string().max(200).optional(),
});

export type BulkAvailabilityInput = z.infer<typeof bulkAvailabilitySchema>;

// ─── Pricing Model Selection ─────────────────────────────────────
//
// Used by the landowner pricing panel on the property form and by the
// pricing API. One of:
//   { pricing_mode: "rod_fee_split", classification: "select"|"premier"|"signature" }
//   { pricing_mode: "upfront_lease", lease_amount_usd, lease_term_months }

export const propertyPricingSchema = z
  .object({
    pricing_mode: z.enum(PRICING_MODES),
    classification: z.enum(PROPERTY_CLASSIFICATIONS).optional().nullable(),
    lease_amount_usd: z
      .number()
      .min(LEASE_MIN_USD)
      .max(LEASE_MAX_USD)
      .optional()
      .nullable(),
    lease_term_months: z.number().int().min(1).max(60).optional().nullable(),
  })
  .refine(
    (data) =>
      data.pricing_mode !== "rod_fee_split" || !!data.classification,
    {
      message: "Select a classification (Select / Premier / Signature)",
      path: ["classification"],
    },
  )
  .refine(
    (data) =>
      data.pricing_mode !== "upfront_lease" ||
      (data.lease_amount_usd != null && data.lease_term_months != null),
    {
      message: "Lease amount and term are required for upfront lease pricing",
      path: ["lease_amount_usd"],
    },
  );

export type PropertyPricingInput = z.infer<typeof propertyPricingSchema>;

// ─── Lease Proposal (landowner ↔ club negotiation) ───────────────

export const leaseProposalSchema = z.object({
  property_id: z.string().uuid(),
  amount_usd: z
    .number()
    .min(LEASE_MIN_USD, `Lease must be at least $${LEASE_MIN_USD.toLocaleString()}`)
    .max(LEASE_MAX_USD, `Lease must not exceed $${LEASE_MAX_USD.toLocaleString()}`),
  term_months: z.number().int().min(1).max(60),
  note: z.string().max(2000).optional(),
});

export type LeaseProposalInput = z.infer<typeof leaseProposalSchema>;

// ─── Invite Landowner ─────────────────────────────────────────────

export const inviteLandownerSchema = z.object({
  landowner_email: z.string().email("Valid email is required"),
});

export type InviteLandownerInput = z.infer<typeof inviteLandownerSchema>;
