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
