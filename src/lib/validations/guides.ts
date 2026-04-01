import { z } from "zod";

// ─── Guide Profile ─────────────────────────────────────────────────

export const TECHNIQUES = [
  "walk_wade",
  "drift_boat",
  "raft",
  "euro_nymphing",
  "streamer",
  "dry_fly",
  "wet_fly",
  "tenkara",
  "bass",
  "stillwater",
] as const;

export const SKILL_LEVELS = ["beginner", "intermediate", "advanced"] as const;

export const GUIDE_STATUSES = [
  "draft",
  "pending_review",
  "approved",
  "suspended",
  "rejected",
] as const;

export const guideProfileSchema = z.object({
  display_name: z.string().min(2, "Display name is required").max(100),
  bio: z.string().max(5000).optional().or(z.literal("")),
  profile_photo_url: z.string().url().optional().or(z.literal("")),
  photos: z.array(z.string().url()).max(10).optional(),

  techniques: z.array(z.enum(TECHNIQUES)).optional(),
  species: z.array(z.string().max(50)).max(20).optional(),
  skill_levels: z.array(z.enum(SKILL_LEVELS)).optional(),
  max_anglers: z.number().int().min(1).max(20).default(2),
  gear_included: z.boolean().default(true),
  gear_details: z.string().max(1000).optional().or(z.literal("")),
  languages: z.array(z.string().max(50)).max(10).optional(),

  base_location: z.string().max(200).optional().or(z.literal("")),
  service_region: z.string().max(500).optional().or(z.literal("")),
  closest_airports: z.string().max(500).optional().or(z.literal("")),

  rate_full_day: z.number().min(0).max(10000).optional(),
  rate_half_day: z.number().min(0).max(10000).optional(),
  rate_description: z.string().max(500).optional().or(z.literal("")),

  lead_time_days: z.number().int().min(0).max(90).default(1),

  // Credential metadata (URLs handled by upload endpoint)
  license_state: z.string().max(50).optional().or(z.literal("")),
  license_expiry: z.string().optional().or(z.literal("")),
  insurance_expiry: z.string().optional().or(z.literal("")),
  insurance_amount: z.string().max(50).optional().or(z.literal("")),
  first_aid_expiry: z.string().optional().or(z.literal("")),
  has_motorized_vessel: z.boolean().default(false),
  uscg_license_expiry: z.string().optional().or(z.literal("")),
});

export type GuideProfileFormData = z.infer<typeof guideProfileSchema>;

// ─── Guide Credential Upload ────────────────────────────────────────

export const CREDENTIAL_TYPES = [
  "license",
  "insurance",
  "first_aid",
  "uscg_license",
] as const;

export const guideCredentialSchema = z.object({
  type: z.enum(CREDENTIAL_TYPES),
});

// ─── Guide Water Approval Request ───────────────────────────────────

export const guideWaterApprovalSchema = z.object({
  property_id: z.string().uuid(),
  club_id: z.string().uuid(),
});

export type GuideWaterApprovalData = z.infer<typeof guideWaterApprovalSchema>;

// ─── Guide Availability ─────────────────────────────────────────────

export const guideAvailabilitySchema = z.object({
  dates: z.array(z.string().min(1)).min(1, "At least one date is required"),
  status: z.enum(["available", "blocked"]),
});

export type GuideAvailabilityData = z.infer<typeof guideAvailabilitySchema>;

// ─── Review ─────────────────────────────────────────────────────────

export const reviewSchema = z.object({
  booking_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).optional().or(z.literal("")),
  body: z.string().max(2000).optional().or(z.literal("")),
});

export type ReviewFormData = z.infer<typeof reviewSchema>;

// ─── Message ────────────────────────────────────────────────────────

export const messageSchema = z.object({
  recipient_id: z.string().uuid(),
  body: z.string().min(1, "Message cannot be empty").max(5000),
  booking_id: z.string().uuid().optional(),
});

export type MessageFormData = z.infer<typeof messageSchema>;

// ─── Admin Guide Review ─────────────────────────────────────────────

export const adminGuideReviewSchema = z.object({
  action: z.enum(["approve", "reject", "suspend"]),
  reason: z.string().max(2000).optional().or(z.literal("")),
});

export type AdminGuideReviewData = z.infer<typeof adminGuideReviewSchema>;

// ─── Club Guide Approval ────────────────────────────────────────────

export const clubGuideApprovalSchema = z.object({
  action: z.enum(["approve", "decline", "revoke"]),
  decline_reason: z.string().max(2000).optional().or(z.literal("")),
});

export type ClubGuideApprovalData = z.infer<typeof clubGuideApprovalSchema>;

// ─── Technique Labels ───────────────────────────────────────────────

export const TECHNIQUE_LABELS: Record<string, string> = {
  walk_wade: "Walk & Wade",
  drift_boat: "Drift Boat",
  raft: "Raft",
  euro_nymphing: "Euro Nymphing",
  streamer: "Streamer",
  dry_fly: "Dry Fly",
  wet_fly: "Wet Fly",
  tenkara: "Tenkara",
  bass: "Bass",
  stillwater: "Stillwater",
};

export const SKILL_LEVEL_LABELS: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};
