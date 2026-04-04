import { z } from "zod";
import { LODGING_TYPES, PET_POLICIES } from "@/lib/constants/lodging";

export const lodgingSchema = z
  .object({
    is_active: z.boolean().default(false),
    lodging_name: z.string().max(100, "Name must be 100 characters or less").optional().or(z.literal("")),
    lodging_type: z.enum(LODGING_TYPES).optional().or(z.literal("")),
    lodging_type_other: z.string().max(100).optional().or(z.literal("")),
    lodging_description: z.string().max(2000, "Description must be 2000 characters or less").optional().or(z.literal("")),
    sleeps: z.number().int().min(1).max(50).optional().nullable(),
    bedrooms: z.number().int().min(0).max(20).optional().nullable(),
    bathrooms: z.number().min(0).max(20).optional().nullable(),
    amenities: z.record(z.string(), z.boolean()).default({}),
    nightly_rate_min: z.number().int().min(1, "Rate must be at least $1").optional().nullable(),
    nightly_rate_max: z.number().int().min(1).optional().nullable(),
    min_nights: z.number().int().min(1).max(30).default(1),
    pet_policy: z.enum(PET_POLICIES).default("not_allowed"),
    checkin_time: z.string().optional().or(z.literal("")),
    checkout_time: z.string().optional().or(z.literal("")),
    external_listing_url: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      if (data.nightly_rate_min != null && data.nightly_rate_max != null) {
        return data.nightly_rate_max >= data.nightly_rate_min;
      }
      return true;
    },
    {
      message: "Maximum rate must be greater than or equal to minimum rate",
      path: ["nightly_rate_max"],
    }
  );

export type LodgingFormData = z.input<typeof lodgingSchema>;
