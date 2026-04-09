/**
 * CRM / Marketing Automation types.
 *
 * Mirrors the database schema from 00067_crm_foundation.sql.
 */

// ─── Enums ──────────────────────────────────────────────────────────

export type CampaignType = "broadcast" | "drip" | "triggered";

export type CampaignStatus =
  | "draft"
  | "active"
  | "paused"
  | "completed"
  | "archived";

export type SendStatus =
  | "queued"
  | "sending"
  | "sent"
  | "delivered"
  | "bounced"
  | "failed"
  | "skipped";

export type EnrollmentStatus =
  | "active"
  | "completed"
  | "paused"
  | "unsubscribed"
  | "cancelled";

export type RecipientType = "user" | "lead";

export type EngagementEventType =
  | "open"
  | "click"
  | "bounce"
  | "complaint"
  | "unsubscribe";

export type SuppressionReason = "hard_bounce" | "complaint" | "manual";

// ─── Trigger Events ─────────────────────────────────────────────────

export type CrmTriggerEvent =
  | "user_signup"
  | "booking_created"
  | "booking_completed"
  | "trip_review_submitted"
  | "membership_joined"
  | "guide_verified"
  | "property_claimed"
  | "inactivity_30d"
  | "inactivity_60d"
  | "season_start"
  | "lead_created";

export const CRM_TRIGGER_EVENTS: readonly CrmTriggerEvent[] = [
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
] as const;

export const TRIGGER_EVENT_LABELS: Record<CrmTriggerEvent, string> = {
  user_signup: "User Signup",
  booking_created: "Booking Created",
  booking_completed: "Booking Completed",
  trip_review_submitted: "Trip Review Submitted",
  membership_joined: "Club Membership Joined",
  guide_verified: "Guide Verified",
  property_claimed: "Property Claimed",
  inactivity_30d: "30-Day Inactivity",
  inactivity_60d: "60-Day Inactivity",
  season_start: "Season Start",
  lead_created: "Lead Created",
};

// ─── Segment Rules ──────────────────────────────────────────────────

export type SegmentOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "in"
  | "not_in"
  | "contains"
  | "not_contains"
  | "is_null"
  | "not_null"
  | "between";

export type SegmentField =
  | "role"
  | "created_at"
  | "location"
  | "fishing_experience"
  | "favorite_species"
  | "club_membership.club_id"
  | "club_membership.status"
  | "booking_count"
  | "last_booking_at"
  | "has_booking"
  | "lead.interest_type"
  | "lead.source"
  | "engagement.last_opened_at"
  | "engagement.total_opens"
  | "welcome_email_step"
  | "suspended_at";

export interface SegmentCondition {
  field: SegmentField;
  op: SegmentOperator;
  value: string | number | boolean | string[] | null;
}

export interface SegmentRuleGroup {
  match: "all" | "any";
  conditions: SegmentCondition[];
}

// ─── Database Row Types ─────────────────────────────────────────────

export interface Segment {
  id: string;
  name: string;
  description: string | null;
  is_dynamic: boolean;
  rules: SegmentRuleGroup[];
  cached_count: number | null;
  cached_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  type: CampaignType;
  status: CampaignStatus;
  from_name: string;
  from_email: string;
  reply_to: string | null;
  segment_id: string | null;
  trigger_event: CrmTriggerEvent | null;
  trigger_config: Record<string, unknown>;
  is_prebuilt: boolean;
  prebuilt_key: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface CampaignStep {
  id: string;
  campaign_id: string;
  step_order: number;
  subject: string;
  html_body: string;
  plain_body: string | null;
  delay_minutes: number;
  cta_label: string | null;
  cta_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignEnrollment {
  id: string;
  campaign_id: string;
  recipient_id: string | null;
  recipient_email: string;
  recipient_type: RecipientType;
  lead_id: string | null;
  current_step: number;
  status: EnrollmentStatus;
  enrolled_at: string;
  completed_at: string | null;
  last_step_sent_at: string | null;
  next_step_due_at: string | null;
}

export interface CampaignSend {
  id: string;
  campaign_id: string;
  step_id: string;
  recipient_id: string | null;
  recipient_email: string;
  recipient_type: RecipientType;
  lead_id: string | null;
  status: SendStatus;
  resend_message_id: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  bounced_at: string | null;
  bounce_reason: string | null;
  opened_at: string | null;
  open_count: number;
  clicked_at: string | null;
  click_count: number;
  unsubscribed_at: string | null;
  drip_scheduled_for: string | null;
  created_at: string;
}

export interface EngagementEvent {
  id: string;
  send_id: string;
  event_type: EngagementEventType;
  url: string | null;
  user_agent: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface EmailSuppression {
  id: string;
  email: string;
  reason: SuppressionReason;
  source: string | null;
  created_at: string;
}

// ─── Computed / API Types ───────────────────────────────────────────

export interface CampaignWithStats extends Campaign {
  total_sends: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  bounced_count: number;
  unsubscribed_count: number;
  open_rate: number;
  click_rate: number;
  step_count: number;
}

export interface CampaignDetail extends Campaign {
  steps: CampaignStep[];
  segment: Segment | null;
}

export interface SegmentPreview {
  count: number;
  sample: {
    id: string;
    email: string;
    display_name: string | null;
    role: string;
  }[];
}

export interface CrmRecipient {
  user_id: string | null;
  email: string;
  display_name: string | null;
  recipient_type: RecipientType;
  lead_id: string | null;
}

// ─── Email Template Variables ───────────────────────────────────────

export interface EmailTemplateVars {
  display_name: string;
  email: string;
  role: string;
  site_url: string;
  unsubscribe_url: string;
  tracking_pixel_url: string;
  [key: string]: string;
}
