import { z } from "zod";

// ─── Event Schemas ────────────────────────────────────────────────

export const eventTypeSchema = z.enum([
  "tournament", "outing", "meeting", "workday", "social", "other",
]);

export const eventStatusSchema = z.enum([
  "draft", "published", "cancelled", "completed",
]);

export const createClubEventSchema = z.object({
  title: z.string().min(1, "Title is required").max(300),
  description: z.string().max(10_000).optional(),
  type: eventTypeSchema,
  location: z.string().max(500).optional(),
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime().optional(),
  all_day: z.boolean().default(false),
  rsvp_limit: z.number().int().min(1).optional(),
  rsvp_deadline: z.string().datetime().optional(),
  waitlist_enabled: z.boolean().default(false),
  guest_allowed: z.boolean().default(false),
  guest_limit_per_member: z.number().int().min(0).max(20).default(1),
  status: eventStatusSchema.default("draft"),
  vertical_context: z.record(z.string(), z.unknown()).optional(),
});

export type CreateClubEventData = z.infer<typeof createClubEventSchema>;

export const updateClubEventSchema = createClubEventSchema.partial().extend({
  cancelled_reason: z.string().max(1000).optional(),
});

export type UpdateClubEventData = z.infer<typeof updateClubEventSchema>;

export const getEventsQuerySchema = z.object({
  status: eventStatusSchema.optional(),
  type: eventTypeSchema.optional(),
  upcoming: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type GetEventsQuery = z.infer<typeof getEventsQuerySchema>;

// ─── Registration Schemas ─────────────────────────────────────────

export const registrationStatusSchema = z.enum([
  "registered", "waitlisted", "cancelled", "attended", "no_show",
]);

export const createRegistrationSchema = z.object({
  membership_id: z.string().uuid().optional(),
  guest_count: z.number().int().min(0).max(20).default(0),
  notes: z.string().max(1000).optional(),
});

export type CreateRegistrationData = z.infer<typeof createRegistrationSchema>;

export const checkInSchema = z.object({
  registration_id: z.string().uuid(),
  status: z.enum(["attended", "no_show"]),
});

export type CheckInData = z.infer<typeof checkInSchema>;

export const bulkCheckInSchema = z.object({
  registrations: z.array(checkInSchema).min(1).max(200),
});

export type BulkCheckInData = z.infer<typeof bulkCheckInSchema>;

// ─── Waitlist Schemas ─────────────────────────────────────────────

export const waitlistTypeSchema = z.enum(["membership", "property"]);

export const waitlistStatusSchema = z.enum([
  "waiting", "offered", "accepted", "expired", "cancelled", "declined",
]);

export const addToWaitlistSchema = z.object({
  type: waitlistTypeSchema,
  reference_id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  notes: z.string().max(1000).optional(),
});

export type AddToWaitlistData = z.infer<typeof addToWaitlistSchema>;

export const offerWaitlistSchema = z.object({
  offer_expires_at: z.string().datetime().optional(),
});

export type OfferWaitlistData = z.infer<typeof offerWaitlistSchema>;

// ─── Waiver Schemas ───────────────────────────────────────────────

export const createWaiverSchema = z.object({
  title: z.string().min(1, "Title is required").max(300),
  body_text: z.string().min(1, "Waiver text is required").max(100_000),
  requires_annual_renewal: z.boolean().default(false),
});

export type CreateWaiverData = z.infer<typeof createWaiverSchema>;

export const updateWaiverSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  body_text: z.string().min(1).max(100_000).optional(),
  is_active: z.boolean().optional(),
  requires_annual_renewal: z.boolean().optional(),
});

export type UpdateWaiverData = z.infer<typeof updateWaiverSchema>;

export const signWaiverSchema = z.object({
  waiver_id: z.string().uuid(),
  membership_id: z.string().uuid(),
});

export type SignWaiverData = z.infer<typeof signWaiverSchema>;

// ─── Incident Schemas ─────────────────────────────────────────────

export const incidentTypeSchema = z.enum([
  "safety", "property_damage", "rule_violation", "environmental",
  "access_issue", "member_complaint", "other",
]);

export const incidentSeveritySchema = z.enum([
  "low", "medium", "high", "critical",
]);

export const incidentStatusSchema = z.enum([
  "open", "investigating", "resolved", "closed",
]);

export const createIncidentSchema = z.object({
  type: incidentTypeSchema,
  severity: incidentSeveritySchema.default("low"),
  title: z.string().min(1, "Title is required").max(300),
  description: z.string().min(1, "Description is required").max(10_000),
  occurred_at: z.string().datetime().optional(),
  vertical_context: z.record(z.string(), z.unknown()).optional(),
});

export type CreateIncidentData = z.infer<typeof createIncidentSchema>;

export const updateIncidentSchema = z.object({
  type: incidentTypeSchema.optional(),
  severity: incidentSeveritySchema.optional(),
  status: incidentStatusSchema.optional(),
  title: z.string().min(1).max(300).optional(),
  description: z.string().min(1).max(10_000).optional(),
  resolution: z.string().max(10_000).optional(),
  assigned_to: z.string().uuid().optional(),
  vertical_context: z.record(z.string(), z.unknown()).optional(),
});

export type UpdateIncidentData = z.infer<typeof updateIncidentSchema>;

export const getIncidentsQuerySchema = z.object({
  status: incidentStatusSchema.optional(),
  severity: incidentSeveritySchema.optional(),
  type: incidentTypeSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type GetIncidentsQuery = z.infer<typeof getIncidentsQuerySchema>;

// ─── Export Schemas ───────────────────────────────────────────────

export const exportFormatSchema = z.enum(["csv", "pdf"]);

export const exportRequestSchema = z.object({
  format: exportFormatSchema,
  resource: z.enum(["events", "registrations", "incidents", "waivers", "activity"]),
  event_id: z.string().uuid().optional(),
  date_from: z.string().date().optional(),
  date_to: z.string().date().optional(),
});

export type ExportRequest = z.infer<typeof exportRequestSchema>;
