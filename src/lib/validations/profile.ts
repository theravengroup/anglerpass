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
