import { z } from "zod";

export const SUBSCRIPTION_TIERS = ["starter", "standard", "pro"] as const;

export const MEMBERSHIP_STATUSES = [
  "pending",
  "active",
  "inactive",
  "declined",
] as const;

export const MEMBERSHIP_ROLES = ["admin", "member"] as const;

export const ACCESS_STATUSES = ["pending", "approved", "declined"] as const;

// ─── Club Profile ──────────────────────────────────────────────────
export const clubSchema = z.object({
  name: z.string().min(1, "Club name is required").max(200),
  description: z.string().max(5000).optional().or(z.literal("")),
  location: z.string().max(500).optional().or(z.literal("")),
  rules: z.string().max(5000).optional().or(z.literal("")),
  website: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
});

export type ClubFormData = z.infer<typeof clubSchema>;

// ─── Member Invite ─────────────────────────────────────────────────
export const clubMemberInviteSchema = z.object({
  email: z.string().email("Valid email is required"),
  role: z.enum(MEMBERSHIP_ROLES).default("member"),
});

export type ClubMemberInviteData = z.infer<typeof clubMemberInviteSchema>;

// ─── Member Status Update ──────────────────────────────────────────
export const clubMemberStatusSchema = z.object({
  status: z.enum(["active", "inactive", "declined"]),
});

export type ClubMemberStatusData = z.infer<typeof clubMemberStatusSchema>;

// ─── Club–Property Access Decision ─────────────────────────────────
export const clubPropertyAccessSchema = z.object({
  status: z.enum(["approved", "declined"]),
});

export type ClubPropertyAccessData = z.infer<typeof clubPropertyAccessSchema>;
