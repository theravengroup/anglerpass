import { z } from "zod";

export const profileUpdateSchema = z.object({
  display_name: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  fishing_experience: z
    .enum(["beginner", "intermediate", "advanced", "expert"])
    .optional()
    .nullable(),
  favorite_species: z.array(z.string().max(50)).max(20).optional(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

// ─── Role Switch / Add ────────────────────────────────────────────

export const SWITCHABLE_ROLES = ["landowner", "club_admin", "angler", "guide"] as const;

export const switchRoleSchema = z.object({
  role: z.enum(SWITCHABLE_ROLES),
});

export type SwitchRoleInput = z.infer<typeof switchRoleSchema>;

export const addRoleSchema = z.object({
  role: z.enum(SWITCHABLE_ROLES),
});

export type AddRoleInput = z.infer<typeof addRoleSchema>;
