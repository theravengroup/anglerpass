import { z } from "zod";

export const leadSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  email: z.email("Please enter a valid email address"),
  interestType: z.enum(["landowner", "club", "angler", "investor", "other"], {
    error: "Please select your interest",
  }),
  message: z.string().optional(),
  source: z.string().optional(),
  type: z
    .enum(["waitlist", "investor", "contact"])
    .optional()
    .default("waitlist"),
});

export type LeadFormData = z.input<typeof leadSchema>;
