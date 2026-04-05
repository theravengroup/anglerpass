import { z } from "zod";

export const PROPOSAL_STATUSES = [
  "draft",
  "sent",
  "accepted",
  "declined",
  "expired",
  "cancelled",
] as const;

export const INVITEE_STATUSES = ["pending", "accepted", "declined"] as const;

// ─── Create Proposal ──────────────────────────────────────────────
export const createProposalSchema = z.object({
  property_id: z.string().uuid("Invalid property"),
  proposed_date: z.string().min(1, "Date is required"),
  start_time: z.string().min(1, "Start time is required"),
  duration_hours: z.number().int().min(1).max(16, "Duration cannot exceed 16 hours"),
  max_anglers: z.number().int().min(1).max(20).default(1),
  guide_fee_per_angler: z.number().min(0, "Fee must be non-negative"),
  notes: z.string().max(2000).optional().or(z.literal("")),
  invitee_ids: z.array(z.string().uuid()).min(1, "At least one angler is required"),
});

export type CreateProposalData = z.infer<typeof createProposalSchema>;

// ─── Save Draft ───────────────────────────────────────────────────
export const saveDraftProposalSchema = z.object({
  property_id: z.string().uuid("Invalid property").optional(),
  proposed_date: z.string().optional(),
  start_time: z.string().optional(),
  duration_hours: z.number().int().min(1).max(16).optional(),
  max_anglers: z.number().int().min(1).max(20).optional(),
  guide_fee_per_angler: z.number().min(0).optional(),
  notes: z.string().max(2000).optional().or(z.literal("")),
  invitee_ids: z.array(z.string().uuid()).optional(),
});

export type SaveDraftProposalData = z.infer<typeof saveDraftProposalSchema>;

// ─── Send Proposal (update status) ───────────────────────────────
export const sendProposalSchema = z.object({
  action: z.literal("send"),
});

// ─── Cancel Proposal ─────────────────────────────────────────────
export const cancelProposalSchema = z.object({
  action: z.literal("cancel"),
});

// ─── Angler Response ─────────────────────────────────────────────
export const proposalResponseSchema = z.object({
  response: z.enum(["accepted", "declined"]),
});

export type ProposalResponseData = z.infer<typeof proposalResponseSchema>;

// ─── Angler Search (for invite step) ─────────────────────────────
export const anglerSearchSchema = z.object({
  query: z.string().min(1).max(200),
});
