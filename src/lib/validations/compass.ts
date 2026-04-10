import { z } from "zod";

// ─── Conversations ────────────────────────────────────────────────

export const createConversationSchema = z.object({
  title: z.string().max(200).optional(),
  messages: z.array(z.record(z.string(), z.unknown())).default([]),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;

export const updateConversationSchema = z.object({
  title: z.string().max(200).optional(),
  messages: z.array(z.record(z.string(), z.unknown())).optional(),
});

export type UpdateConversationInput = z.infer<typeof updateConversationSchema>;
