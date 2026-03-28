import { z } from "zod";

export const MODERATION_ACTIONS = [
  "approved",
  "changes_requested",
  "rejected",
] as const;

export const moderationActionSchema = z.object({
  action: z.enum(MODERATION_ACTIONS),
  notes: z.string().min(1, "Notes are required for all moderation actions").max(2000),
});

export type ModerationActionData = z.infer<typeof moderationActionSchema>;
