import { z } from "zod";

export const EMPLOYEE_COUNT_OPTIONS = [
  { value: "1-25", label: "1–25 employees" },
  { value: "26-100", label: "26–100 employees" },
  { value: "101-500", label: "101–500 employees" },
  { value: "500+", label: "500+ employees" },
] as const;

export const USE_CASE_OPTIONS = [
  { value: "client-entertainment", label: "Client entertainment" },
  { value: "team-retreats", label: "Team retreats" },
  { value: "employee-perk", label: "Employee perk / benefit" },
  { value: "recruiting", label: "Recruiting / executive perk" },
  { value: "other", label: "Other" },
] as const;

export const TIMELINE_OPTIONS = [
  { value: "this-quarter", label: "This quarter" },
  { value: "next-quarter", label: "Next quarter" },
  { value: "exploring", label: "Exploring — no firm timeline" },
] as const;

export const REGION_OPTIONS = [
  { value: "west", label: "West (CA, OR, WA)" },
  { value: "rockies", label: "Rockies (MT, CO, WY, ID, UT)" },
  { value: "southeast", label: "Southeast (NC, TN, VA)" },
  { value: "northeast", label: "Northeast (NY, PA)" },
  { value: "flexible", label: "Flexible / open" },
] as const;

// Reject common free-email providers — corporate leads should use a work domain.
const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "live.com",
  "msn.com",
]);

export const corporateInquirySchema = z.object({
  companyName: z.string().min(1, "Company name is required").max(200),
  contactName: z.string().min(1, "Your name is required").max(200),
  workEmail: z
    .email("Please enter a valid email address")
    .refine(
      (email) => {
        const domain = email.split("@")[1]?.toLowerCase();
        return domain ? !FREE_EMAIL_DOMAINS.has(domain) : false;
      },
      { message: "Please use your work email address" }
    ),
  phone: z.string().max(40).optional().or(z.literal("")),
  employeeCount: z.enum(["1-25", "26-100", "101-500", "500+"], {
    error: "Please select a company size",
  }),
  useCase: z.enum(
    ["client-entertainment", "team-retreats", "employee-perk", "recruiting", "other"],
    { error: "Please select a primary use case" }
  ),
  regions: z
    .array(z.enum(["west", "rockies", "southeast", "northeast", "flexible"]))
    .min(1, "Select at least one region"),
  timeline: z.enum(["this-quarter", "next-quarter", "exploring"], {
    error: "Please select a timeline",
  }),
  estimatedMembers: z.coerce
    .number({ error: "Enter an estimated number of employees" })
    .int()
    .min(1, "Must be at least 1")
    .max(100000),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export type CorporateInquiryData = z.input<typeof corporateInquirySchema>;
export type CorporateInquiryParsed = z.output<typeof corporateInquirySchema>;
