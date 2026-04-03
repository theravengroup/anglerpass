import { z } from "zod";

export const migrationInquirySchema = z.object({
  clubName: z.string().min(1, "Club name is required"),
  contactName: z.string().min(1, "Your name is required"),
  email: z.email("Please enter a valid email address"),
  memberCount: z
    .number({ error: "Number of members is required" })
    .int()
    .min(1, "Must be at least 1"),
  dataSource: z.enum(
    [
      "excel-sheets",
      "google-forms",
      "club-software",
      "paper",
      "legacy-dos",
      "other",
    ],
    { error: "Please select where your data lives" }
  ),
  websitePlatform: z
    .enum([
      "wordpress",
      "squarespace",
      "wix",
      "custom",
      "none",
      "other",
    ])
    .optional(),
  multiyearInterest: z
    .enum(["yes", "possibly", "not-sure"])
    .optional(),
  targetLaunch: z.string().optional(),
  loomUrl: z.url("Please enter a valid Loom video link"),
  notes: z.string().optional(),
});

export type MigrationInquiryFormData = z.infer<typeof migrationInquirySchema>;
