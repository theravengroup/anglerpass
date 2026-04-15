import { z } from "zod";

export const SUPPORT_CATEGORIES = [
  "Booking Issue",
  "Account",
  "Technical Bug",
  "Billing",
  "Independent Guide",
  "Other",
] as const;

export const SUPPORT_STATUSES = ["open", "in_progress", "resolved"] as const;
export const SUPPORT_PRIORITIES = ["low", "normal", "high"] as const;

export const supportTicketSchema = z.object({
  category: z.enum(SUPPORT_CATEGORIES, {
    message: "Please select a category",
  }),
  subject: z
    .string()
    .min(1, "Subject is required")
    .max(100, "Subject must be under 100 characters"),
  message: z
    .string()
    .min(20, "Please provide at least 20 characters of detail")
    .max(2000, "Message must be under 2,000 characters"),
});

export type SupportTicketFormData = z.infer<typeof supportTicketSchema>;

export const supportTicketUpdateSchema = z.object({
  status: z.enum(SUPPORT_STATUSES).optional(),
  priority: z.enum(SUPPORT_PRIORITIES).optional(),
  assigned_to: z.string().max(100).nullable().optional(),
  admin_notes: z.string().max(5000).nullable().optional(),
});

export type SupportTicketUpdateData = z.infer<typeof supportTicketUpdateSchema>;

export const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
};

export const PRIORITY_LABELS: Record<string, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
};
