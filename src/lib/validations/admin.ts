import { z } from "zod";
import { GUIDE_STATUSES, adminGuideReviewSchema } from "@/lib/validations/guides";

// ─── Platform Settings ────────────────────────────────────────────

export const adminSettingsPatchSchema = z.object({
  key: z.string().min(1, "Key is required"),
  value: z.unknown().refine((v) => v !== undefined, "Value is required"),
});

export type AdminSettingsPatchInput = z.infer<typeof adminSettingsPatchSchema>;

// ─── Admin Club Update ────────────────────────────────────────────

export const adminClubUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  location: z.string().max(500).nullable().optional(),
  rules: z.string().max(5000).nullable().optional(),
  website: z.string().url().max(500).nullable().optional(),
  subscription_tier: z.enum(["starter", "standard", "pro"]).optional(),
  is_active: z.boolean().optional(),
});

export type AdminClubUpdateInput = z.infer<typeof adminClubUpdateSchema>;

// ─── Admin Invite ─────────────────────────────────────────────────

export const adminInviteSchema = z.object({
  email: z.email("A valid email is required"),
  name: z.string().max(200).optional(),
});

export type AdminInviteInput = z.infer<typeof adminInviteSchema>;

// ─── Admin Guide List Query ───────────────────────────────────────

export const guideListQuerySchema = z.object({
  status: z.enum(GUIDE_STATUSES).optional(),
});

export type GuideListQueryInput = z.infer<typeof guideListQuerySchema>;

// ─── Admin Guide Patch ────────────────────────────────────────────

export const adminGuidePatchSchema = z.object({
  guide_id: z.uuid("guide_id must be a valid UUID"),
  action: adminGuideReviewSchema.shape.action,
  reason: adminGuideReviewSchema.shape.reason,
});

export type AdminGuidePatchInput = z.infer<typeof adminGuidePatchSchema>;
