import { z } from "zod";

export const consultationSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Valid email is required"),
  organization: z.string().min(1, "Organization name is required").max(200),
  property_count: z
    .number()
    .int()
    .min(1, "Must be at least 1")
    .max(10000)
    .optional()
    .nullable(),
  preferred_dates: z.string().max(500).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export type ConsultationFormData = z.infer<typeof consultationSchema>;
