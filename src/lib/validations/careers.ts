import { z } from "zod";

export const careersInquirySchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long"),
  email: z.string().email("Please enter a valid email address"),
  interest: z
    .string()
    .min(10, "Please tell us a bit more about your interest")
    .max(2000, "Message is too long"),
});

export type CareersInquiryData = z.infer<typeof careersInquirySchema>;
