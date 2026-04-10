import { z } from "zod";

// ─── Segment Schemas ────────────────────────────────────────────────

const segmentOperatorSchema = z.enum([
  "eq", "neq", "gt", "gte", "lt", "lte",
  "in", "not_in", "contains", "not_contains",
  "is_null", "not_null", "between",
]);

const segmentFieldSchema = z.enum([
  "role",
  "created_at",
  "location",
  "fishing_experience",
  "favorite_species",
  "club_membership.club_id",
  "club_membership.status",
  "booking_count",
  "last_booking_at",
  "has_booking",
  "lead.interest_type",
  "lead.source",
  "engagement.last_opened_at",
  "engagement.total_opens",
  "welcome_email_step",
  "suspended_at",
]);

const segmentConditionSchema = z.object({
  field: segmentFieldSchema,
  op: segmentOperatorSchema,
  value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.string()),
    z.null(),
  ]),
});

const segmentRuleGroupSchema = z.object({
  match: z.enum(["all", "any"]),
  conditions: z.array(segmentConditionSchema).min(1),
});

export const createSegmentSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(1000).optional(),
  is_dynamic: z.boolean().default(true),
  include_leads: z.boolean().default(false),
  rules: z.array(segmentRuleGroupSchema).min(1, "At least one rule group is required"),
});

export const updateSegmentSchema = createSegmentSchema.partial();

export type CreateSegmentData = z.infer<typeof createSegmentSchema>;
export type UpdateSegmentData = z.infer<typeof updateSegmentSchema>;

// ─── Campaign Schemas ───────────────────────────────────────────────

const campaignTypeSchema = z.enum(["broadcast", "drip", "triggered"]);

const triggerEventSchema = z.enum([
  "user_signup",
  "booking_created",
  "booking_completed",
  "trip_review_submitted",
  "membership_joined",
  "guide_verified",
  "property_claimed",
  "inactivity_30d",
  "inactivity_60d",
  "season_start",
  "lead_created",
]);

export const createCampaignSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(200),
    description: z.string().max(2000).optional(),
    type: campaignTypeSchema,
    from_name: z.string().min(1).max(100).default("AnglerPass"),
    from_email: z.string().email().default("hello@anglerpass.com"),
    reply_to: z.string().email().optional(),
    segment_id: z.string().uuid().optional(),
    topic_id: z.string().uuid().optional(),
    trigger_event: triggerEventSchema.optional(),
    trigger_config: z.record(z.string(), z.unknown()).default({}),
  })
  .refine(
    (data) => data.type !== "triggered" || data.trigger_event,
    { message: "Triggered campaigns require a trigger event", path: ["trigger_event"] }
  );

export const updateCampaignSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  from_name: z.string().min(1).max(100).optional(),
  from_email: z.string().email().optional(),
  reply_to: z.string().email().nullable().optional(),
  segment_id: z.string().uuid().nullable().optional(),
  topic_id: z.string().uuid().nullable().optional(),
  trigger_event: triggerEventSchema.optional(),
  trigger_config: z.record(z.string(), z.unknown()).optional(),
});

export type CreateCampaignData = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignData = z.infer<typeof updateCampaignSchema>;

// ─── Campaign Step Schemas ──────────────────────────────────────────

export const createStepSchema = z.object({
  step_order: z.number().int().min(1),
  subject: z.string().min(1, "Subject is required").max(500),
  html_body: z.string().min(1, "Email body is required").max(100_000),
  plain_body: z.string().max(50_000).optional(),
  delay_minutes: z.number().int().min(0).default(0),
  cta_label: z.string().max(100).optional(),
  cta_url: z.string().url().optional(),
});

export const updateStepSchema = createStepSchema.partial().omit({ step_order: true });

export type CreateStepData = z.infer<typeof createStepSchema>;
export type UpdateStepData = z.infer<typeof updateStepSchema>;

// ─── Segment Preview Schema ─────────────────────────────────────────

export const segmentPreviewSchema = z.object({
  rules: z.array(segmentRuleGroupSchema).min(1),
});

export type SegmentPreviewData = z.infer<typeof segmentPreviewSchema>;

// ─── Test Send Schema ───────────────────────────────────────────────

export const testSendSchema = z.object({
  email: z.string().email("Valid email is required"),
  step_id: z.string().uuid().optional(),
});

export type TestSendData = z.infer<typeof testSendSchema>;
