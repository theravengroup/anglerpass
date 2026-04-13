import { z } from "zod";

// ─── Segment Filter Schema ─────────────────────────────────────────

export const segmentFiltersSchema = z.object({
  membership_tier: z.array(z.string().uuid()).optional(),
  status: z.array(z.enum(["active", "expired", "pending", "suspended"])).optional(),
  activity_level: z.array(z.enum(["active", "inactive", "dormant"])).optional(),
  member_group: z.array(z.string().uuid()).optional(),
  joined_after: z.string().date().optional(),
  joined_before: z.string().date().optional(),
});

export type SegmentFilters = z.infer<typeof segmentFiltersSchema>;

// ─── Campaign Schemas ──────────────────────────────────────────────

export const createClubCampaignSchema = z.object({
  type: z.enum(["broadcast", "targeted", "digest"]),
  subject: z.string().min(1, "Subject is required").max(500),
  body_html: z.string().min(1, "Email body is required").max(200_000),
  body_text: z.string().max(100_000).optional(),
  template_id: z.string().uuid().optional(),
  segment_filters: segmentFiltersSchema.optional(),
  group_id: z.string().uuid().optional(),
  scheduled_at: z.string().datetime().optional(),
  vertical_context: z.record(z.string(), z.unknown()).optional(),
});

export type CreateClubCampaignData = z.infer<typeof createClubCampaignSchema>;

export const updateClubCampaignSchema = createClubCampaignSchema.partial();

export type UpdateClubCampaignData = z.infer<typeof updateClubCampaignSchema>;

export const getCampaignsQuerySchema = z.object({
  status: z.enum(["draft", "scheduled", "sending", "sent", "partially_sent", "failed", "cancelled"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type GetCampaignsQuery = z.infer<typeof getCampaignsQuerySchema>;

// ─── Template Schemas ──────────────────────────────────────────────

const templateTypeSchema = z.enum([
  "broadcast", "event_notice", "season_opener", "season_closer",
  "tournament", "annual_meeting", "welcome", "renewal_reminder",
  "digest", "custom",
]);

export const createClubTemplateSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  type: templateTypeSchema,
  subject_template: z.string().max(500).default(""),
  body_template: z.string().max(200_000).default(""),
});

export type CreateClubTemplateData = z.infer<typeof createClubTemplateSchema>;

export const updateClubTemplateSchema = createClubTemplateSchema.partial();

export type UpdateClubTemplateData = z.infer<typeof updateClubTemplateSchema>;

// ─── Communication Preferences Schema ──────────────────────────────

export const updateCommPreferencesSchema = z.object({
  email_broadcasts: z.boolean().optional(),
  email_targeted: z.boolean().optional(),
  email_digest: z.boolean().optional(),
  email_event_notices: z.boolean().optional(),
});

export type UpdateCommPreferencesData = z.infer<typeof updateCommPreferencesSchema>;

// ─── Member Group Schemas ──────────────────────────────────────────

export const createMemberGroupSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(200),
    description: z.string().max(1000).optional(),
    is_smart: z.boolean().default(false),
    smart_filters: segmentFiltersSchema.optional(),
    member_ids: z.array(z.string().uuid()).optional(),
  })
  .refine(
    (data) => !data.is_smart || data.smart_filters,
    { message: "Smart groups require smart_filters", path: ["smart_filters"] }
  )
  .refine(
    (data) => data.is_smart || !data.smart_filters,
    { message: "Static groups should not have smart_filters", path: ["smart_filters"] }
  );

export type CreateMemberGroupData = z.infer<typeof createMemberGroupSchema>;

export const updateMemberGroupSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  smart_filters: segmentFiltersSchema.optional(),
  member_ids: z.array(z.string().uuid()).optional(),
});

export type UpdateMemberGroupData = z.infer<typeof updateMemberGroupSchema>;

// ─── Segment Preview Schema ────────────────────────────────────────

export const segmentPreviewRequestSchema = z.object({
  filters: segmentFiltersSchema,
});

export type SegmentPreviewRequest = z.infer<typeof segmentPreviewRequestSchema>;
