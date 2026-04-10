import { z } from "zod";

// ─── Angler Club Invite ───────────────────────────────────────────

export const anglerClubInviteSchema = z.object({
  club_name: z.string().min(1, "Club name is required").max(200),
  admin_email: z.email("Valid email is required"),
  admin_name: z.string().max(200).optional(),
});

export type AnglerClubInviteInput = z.infer<typeof anglerClubInviteSchema>;
