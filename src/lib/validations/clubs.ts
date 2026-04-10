import { z } from "zod";

export const SUBSCRIPTION_TIERS = ["starter", "standard", "pro"] as const;

export const MEMBERSHIP_STATUSES = [
  "pending",
  "active",
  "inactive",
  "declined",
] as const;

export const MEMBERSHIP_ROLES = ["admin", "staff", "member"] as const;

export const ACCESS_STATUSES = ["pending", "approved", "declined"] as const;

// ─── Club Profile ──────────────────────────────────────────────────
export const clubSchema = z.object({
  name: z.string().min(1, "Club name is required").max(200),
  description: z.string().max(5000).optional().or(z.literal("")),
  location: z.string().max(500).optional().or(z.literal("")),
  rules: z.string().max(5000).optional().or(z.literal("")),
  website: z
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
});

export type ClubFormData = z.infer<typeof clubSchema>;

// ─── Member Invite ─────────────────────────────────────────────────
export const clubMemberInviteSchema = z.object({
  email: z.email("Valid email is required"),
  role: z.enum(MEMBERSHIP_ROLES).default("member"),
});

export type ClubMemberInviteData = z.input<typeof clubMemberInviteSchema>;

// ─── Member Status Update ──────────────────────────────────────────
export const clubMemberStatusSchema = z.object({
  status: z.enum(["active", "inactive", "declined"]),
  decline_reason: z.string().max(500).optional(),
});

export type ClubMemberStatusData = z.infer<typeof clubMemberStatusSchema>;

// ─── Club–Property Access Decision ─────────────────────────────────
export const clubPropertyAccessSchema = z.object({
  status: z.enum(["approved", "declined"]),
});

export type ClubPropertyAccessData = z.infer<typeof clubPropertyAccessSchema>;

// ─── Membership Types ─────────────────────────────────────────────
export const MEMBERSHIP_TYPES = ["individual", "corporate", "corporate_employee"] as const;

// ─── Corporate Settings ───────────────────────────────────────────
export const corporateSettingsSchema = z.object({
  corporate_memberships_enabled: z.boolean(),
  corporate_initiation_fee: z
    .number()
    .min(0, "Fee must be positive")
    .nullable(),
});

export type CorporateSettingsData = z.infer<typeof corporateSettingsSchema>;

// ─── Corporate Invitation ─────────────────────────────────────────
export const corporateInviteSchema = z.object({
  emails: z.array(z.email("Invalid email")).min(1, "At least one email required"),
});

export type CorporateInviteData = z.infer<typeof corporateInviteSchema>;

// ─── Cross-Club Agreements ───────────────────────────────────────

export const proposeAgreementSchema = z.object({
  partner_club_id: z.uuid("Invalid club ID"),
});

export type ProposeAgreementData = z.infer<typeof proposeAgreementSchema>;

export const agreementActionSchema = z.object({
  action: z.enum(["accept", "revoke"]),
});

export type AgreementActionData = z.infer<typeof agreementActionSchema>;

// ─── Referral Program Settings ──────────────────────────────────────
export const referralSettingsSchema = z.object({
  referral_program_enabled: z.boolean(),
  referral_reward: z
    .number()
    .min(0, "Reward must be $0 or more")
    .max(10000, "Reward cannot exceed $10,000"),
});

export type ReferralSettingsData = z.infer<typeof referralSettingsSchema>;

// ─── Referral Invite ────────────────────────────────────────────────
export const referralInviteSchema = z.object({
  email: z.email("Valid email is required"),
  message: z.string().max(500).optional().or(z.literal("")),
});

export type ReferralInviteData = z.infer<typeof referralInviteSchema>;

// ─── Club Join Request ────────────────────────────────────────────
export const clubJoinSchema = z.object({
  club_id: z.uuid(),
  referral_code: z.string().max(20).optional(),
  application_note: z.string().max(2000).optional(),
});

export type ClubJoinInput = z.infer<typeof clubJoinSchema>;

// ─── Club Invite (Landowner → Club) ──────────────────────────────
export const clubInviteSchema = z.object({
  property_id: z.uuid(),
  club_name: z.string().min(1, "Club name is required").max(200),
  admin_email: z.email("Valid email is required"),
});

export type ClubInviteInput = z.infer<typeof clubInviteSchema>;

// ─── Corporate Join ───────────────────────────────────────────────
export const corporateJoinSchema = z.object({
  company_name: z.string().min(1, "Company name is required").max(300),
  job_title: z.string().max(200).optional(),
});

export type CorporateJoinInput = z.infer<typeof corporateJoinSchema>;

// ─── Corporate Employee Join ──────────────────────────────────────
export const corporateEmployeeJoinSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export type CorporateEmployeeJoinInput = z.infer<typeof corporateEmployeeJoinSchema>;

// ─── Staff Notes ──────────────────────────────────────────────────

export const VALID_NOTE_ENTITY_TYPES = ["member", "property", "landowner"] as const;

export const createStaffNoteSchema = z.object({
  entity_type: z.enum(VALID_NOTE_ENTITY_TYPES),
  entity_id: z.string().uuid(),
  body: z.string().min(1).max(5000),
});

export type CreateStaffNoteInput = z.infer<typeof createStaffNoteSchema>;

// ─── Bulk Member Invite ───────────────────────────────────────────

export const MAX_BULK_INVITE_EMAILS = 200;

export const bulkMemberInviteSchema = z.object({
  emails: z
    .array(z.email("Invalid email address"))
    .min(1, "At least one email is required")
    .max(MAX_BULK_INVITE_EMAILS, `Maximum ${MAX_BULK_INVITE_EMAILS} emails per request`),
});

export type BulkMemberInviteInput = z.infer<typeof bulkMemberInviteSchema>;

// ─── Application Review ──────────────────────────────────────────
export const applicationReviewSchema = z.object({
  action: z.enum(["approve", "decline"]),
  declined_reason: z.string().max(500).optional(),
});

export type ApplicationReviewInput = z.infer<typeof applicationReviewSchema>;
