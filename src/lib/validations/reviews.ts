import { z } from "zod";

// ─── Enums ────────────────────────────────────────────────────────────

export const REVIEW_STATUSES = [
  "draft",
  "submitted",
  "published",
  "flagged",
  "suppressed",
  "removed",
] as const;

export const CATEGORY_KEYS = [
  "accuracy_of_listing",
  "ease_of_access",
  "property_condition",
  "quality_of_fishing_experience",
  "privacy_crowding",
  "host_communication",
  "value_for_price",
] as const;

/** Categories required when trip_completed = false (landowner-fault cancellation) */
export const INCOMPLETE_TRIP_CATEGORIES = [
  "accuracy_of_listing",
  "ease_of_access",
  "host_communication",
] as const;

export const FLAG_REASONS = [
  "threat",
  "hate_speech",
  "doxxing",
  "illegal_conduct",
  "extortion",
  "irrelevant",
  "factually_impossible",
  "other",
] as const;

export const FLAG_RESOLUTIONS = [
  "removed",
  "suppressed",
  "upheld",
  "dismissed",
] as const;

export const FLAGGED_BY_ROLES = [
  "landowner",
  "club_admin",
  "angler",
  "anglerpass_staff",
] as const;

export const RESPONDER_ROLES = ["landowner", "club_admin"] as const;

export const RESPONSE_STATUSES = ["published", "flagged", "removed"] as const;

export const CANCELLATION_FAULTS = [
  "none",
  "landowner_gate_failure",
  "landowner_no_response",
  "landowner_access_denied",
  "landowner_initiated",
] as const;

export const LANDOWNER_FAULTS = [
  "landowner_gate_failure",
  "landowner_no_response",
  "landowner_access_denied",
  "landowner_initiated",
] as const;

// ─── Review Window Constants ──────────────────────────────────────────

/** Days after last fishing day that the review window remains open */
export const REVIEW_WINDOW_DAYS = 21;

/** Days added when an extension is granted */
export const REVIEW_EXTENSION_DAYS = 7;

/** Hours after submission before a review can be published */
export const PUBLICATION_DELAY_HOURS = 48;

/** Hours after response submission before editing is locked */
export const RESPONSE_EDIT_LOCK_HOURS = 24;

/** Minimum number of published reviews before ranking penalties apply */
export const RANKING_IMMUNITY_THRESHOLD = 5;

// ─── Category Rating Schema ──────────────────────────────────────────

const categoryRatingSchema = z.object({
  category_key: z.enum(CATEGORY_KEYS),
  rating_value: z.number().int().min(1).max(5),
});

export type CategoryRating = z.infer<typeof categoryRatingSchema>;

// ─── Create / Submit Review ──────────────────────────────────────────

export const tripReviewCreateSchema = z.object({
  booking_id: z.uuid("Invalid booking ID"),
  overall_rating: z.number().int().min(1).max(5),
  review_text: z.string().min(50, "Review must be at least 50 characters"),
  would_fish_again: z.boolean(),
  private_feedback_text: z.string().max(5000).optional().or(z.literal("")),
  category_ratings: z.array(categoryRatingSchema).min(3),
  is_anonymous: z
    .boolean()
    .optional()
    .refine((val) => val !== true, {
      message: "Anonymous reviews are not allowed",
    }),
});

export type TripReviewCreateData = z.infer<typeof tripReviewCreateSchema>;

// ─── Update Draft Review ─────────────────────────────────────────────

export const tripReviewUpdateSchema = z.object({
  overall_rating: z.number().int().min(1).max(5).optional(),
  review_text: z
    .string()
    .min(50, "Review must be at least 50 characters")
    .optional(),
  would_fish_again: z.boolean().optional(),
  private_feedback_text: z.string().max(5000).optional().or(z.literal("")),
  category_ratings: z.array(categoryRatingSchema).min(3).optional(),
});

export type TripReviewUpdateData = z.infer<typeof tripReviewUpdateSchema>;

// ─── Submit Review (transition from draft to submitted) ──────────────

export const tripReviewSubmitSchema = z.object({
  action: z.literal("submit"),
});

// ─── Extension Request ───────────────────────────────────────────────

export const reviewExtensionSchema = z.object({
  action: z.literal("request_extension"),
});

// ─── Flag Review ─────────────────────────────────────────────────────

export const reviewFlagSchema = z.object({
  flag_reason: z.enum(FLAG_REASONS),
  flag_notes: z.string().max(2000).optional().or(z.literal("")),
});

export type ReviewFlagData = z.infer<typeof reviewFlagSchema>;

// ─── Resolve Flag (admin only) ───────────────────────────────────────

export const reviewFlagResolveSchema = z.object({
  resolution: z.enum(FLAG_RESOLUTIONS),
  moderation_reason: z.string().max(2000).optional().or(z.literal("")),
});

export type ReviewFlagResolveData = z.infer<typeof reviewFlagResolveSchema>;

// ─── Review Response (landowner / club admin) ────────────────────────

export const reviewResponseSchema = z.object({
  response_text: z
    .string()
    .min(1, "Response cannot be empty")
    .max(5000, "Response must be under 5000 characters"),
});

export type ReviewResponseData = z.infer<typeof reviewResponseSchema>;

// ─── Review Response Update ──────────────────────────────────────────

export const reviewResponseUpdateSchema = z.object({
  response_text: z
    .string()
    .min(1, "Response cannot be empty")
    .max(5000, "Response must be under 5000 characters"),
});

export type ReviewResponseUpdateData = z.infer<
  typeof reviewResponseUpdateSchema
>;
