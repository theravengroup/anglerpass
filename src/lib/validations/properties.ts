import { z } from "zod";

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
;

export type PropertyFormData = z.input<typeof propertySchema>;

export const propertyStatusTransition = z.object({
  status: z.enum(["pending_review", "draft"]),
});

export type PropertyStatusTransition = z.infer<typeof propertyStatusTransition>;
