import { z } from "zod";

export const CONTACT_DEPARTMENTS = [
  { value: "general", label: "General Inquiries", email: "hello@anglerpass.com" },
  { value: "investors", label: "Investor Relations", email: "investors@anglerpass.com" },
  { value: "partners", label: "Landowners & Clubs", email: "partners@anglerpass.com" },
  { value: "press", label: "Press & Media", email: "press@anglerpass.com" },
] as const;

export type ContactDepartment = (typeof CONTACT_DEPARTMENTS)[number]["value"];

export const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Please enter a valid email address"),
  department: z.enum(["general", "investors", "partners", "press"], {
    error: "Please select a department",
  }),
  message: z.string().min(10, "Please include a message (at least 10 characters)"),
});

export type ContactFormData = z.input<typeof contactSchema>;
