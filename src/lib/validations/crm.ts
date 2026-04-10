import { z } from "zod";

// ─── Subscription Topics ──────────────────────────────────────────

export const createTopicSchema = z.object({
  slug: z.string().min(1).max(50).regex(/^[a-z0-9_]+$/),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  is_default: z.boolean().optional(),
  is_required: z.boolean().optional(),
  display_order: z.number().int().min(0).optional(),
});

export type CreateTopicInput = z.infer<typeof createTopicSchema>;

export const updateTopicSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  is_default: z.boolean().optional(),
  is_required: z.boolean().optional(),
  display_order: z.number().int().min(0).optional(),
});

export type UpdateTopicInput = z.infer<typeof updateTopicSchema>;

// ─── Workflows ────────────────────────────────────────────────────

export const createWorkflowSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  trigger_event: z.string().optional(),
  segment_id: z.string().uuid().optional(),
});

export type CreateWorkflowInput = z.infer<typeof createWorkflowSchema>;

export const updateWorkflowSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  trigger_event: z.string().nullable().optional(),
  segment_id: z.string().uuid().nullable().optional(),
  // Save entire graph in one call
  nodes: z.array(z.object({
    id: z.string().uuid().optional(),
    type: z.enum(["trigger", "send_email", "delay", "condition", "split", "end"]),
    label: z.string().max(200),
    config: z.record(z.string(), z.unknown()),
    position_x: z.number(),
    position_y: z.number(),
  })).optional(),
  edges: z.array(z.object({
    id: z.string().uuid().optional(),
    source_node_id: z.string(),
    target_node_id: z.string(),
    source_handle: z.string().default("default"),
  })).optional(),
});

export type UpdateWorkflowInput = z.infer<typeof updateWorkflowSchema>;

// ─── Frequency Caps ───────────────────────────────────────────────

export const createFrequencyCapSchema = z.object({
  name: z.string().min(1).max(100),
  max_sends: z.number().int().min(1).max(100),
  window_hours: z.number().int().min(1).max(8760), // max 1 year
  applies_to: z.enum(["marketing", "all"]).default("marketing"),
  is_active: z.boolean().default(true),
});

export type CreateFrequencyCapInput = z.infer<typeof createFrequencyCapSchema>;

export const updateFrequencyCapSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  max_sends: z.number().int().min(1).max(100).optional(),
  window_hours: z.number().int().min(1).max(8760).optional(),
  is_active: z.boolean().optional(),
});

export type UpdateFrequencyCapInput = z.infer<typeof updateFrequencyCapSchema>;

// ─── CRM Send ─────────────────────────────────────────────────────

export const crmSendSchema = z.object({
  // Recipient -- one of these required
  to: z.string().email().optional(),
  user_id: z.string().uuid().optional(),

  // Content
  subject: z.string().min(1).max(500),
  html_body: z.string().min(1).max(200_000),
  from_name: z.string().max(100).default("AnglerPass"),
  from_email: z.string().email().default("hello@anglerpass.com"),
  reply_to: z.string().email().optional(),

  // Optional: link to a campaign for tracking
  campaign_id: z.string().uuid().optional(),
  step_id: z.string().uuid().optional(),

  // Template data for Liquid rendering
  data: z.record(z.string(), z.unknown()).optional(),

  // Topic slug for subscription checking
  topic_slug: z.string().optional(),

  // CTA
  cta_label: z.string().max(100).optional(),
  cta_url: z.string().max(2000).optional(),

  // Skip pre-send checks (for transactional emails)
  skip_checks: z.boolean().default(false),
}).refine(
  (d) => d.to || d.user_id,
  { message: "Either 'to' (email) or 'user_id' is required" }
);

export type CrmSendInput = z.infer<typeof crmSendSchema>;

// ─── CRM Preferences ─────────────────────────────────────────────

export const updatePreferencesSchema = z.object({
  subscriptions: z.array(
    z.object({
      topic_id: z.string().uuid(),
      subscribed: z.boolean(),
    })
  ),
});

export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;

// ─── CRM Conversions ─────────────────────────────────────────────

export const trackConversionSchema = z.object({
  event_name: z.string().min(1).max(100),
  category: z
    .enum([
      "signup",
      "booking",
      "purchase",
      "upgrade",
      "referral",
      "engagement",
      "retention",
      "reactivation",
      "other",
    ])
    .optional(),
  value_cents: z.number().int().min(0).optional(),
  currency: z.string().length(3).optional(),
  properties: z.record(z.string(), z.unknown()).optional(),
  // Allow server-side calls to specify user
  user_id: z.string().uuid().optional(),
  email: z.string().email().optional(),
});

export type TrackConversionInput = z.infer<typeof trackConversionSchema>;
