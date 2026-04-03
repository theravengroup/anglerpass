import { z } from "zod";

export const documentTemplateSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be under 200 characters"),
  body: z
    .string()
    .min(20, "Document body must be at least 20 characters")
    .max(50000, "Document body is too long"),
  required: z.boolean().default(true),
  active: z.boolean().default(true),
  sort_order: z.number().int().min(0).default(0),
});

export type DocumentTemplateData = z.input<typeof documentTemplateSchema>;

export const signDocumentSchema = z.object({
  template_id: z.uuid("Invalid template ID"),
  booking_id: z.uuid("Invalid booking ID"),
  signer_name: z
    .string()
    .min(2, "Please enter your full name")
    .max(200, "Name is too long"),
  agreed: z.literal(true, {
    error: "You must agree to the terms to continue",
  }),
});

export type SignDocumentData = z.infer<typeof signDocumentSchema>;

/**
 * Template variable substitution for document bodies.
 * Supports: {{angler_name}}, {{property_name}}, {{trip_date}}, {{party_size}}, {{club_name}}
 */
export function substituteVariables(
  template: string,
  vars: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    return vars[key] ?? match;
  });
}

/**
 * Default liability waiver template
 */
export const DEFAULT_WAIVER_TEMPLATE = `# Liability Waiver & Release of Claims

**Property:** {{property_name}}
**Date of Access:** {{trip_date}}
**Participant:** {{angler_name}}
**Party Size:** {{party_size}}

## Assumption of Risk

I, {{angler_name}}, acknowledge that fishing and outdoor recreational activities involve inherent risks, including but not limited to: slippery surfaces, uneven terrain, wildlife encounters, weather conditions, and water hazards. I voluntarily assume all risks associated with my participation.

## Release of Liability

I hereby release, waive, and discharge the property owner, AnglerPass, and their respective agents, employees, and affiliates from any and all liability, claims, demands, or causes of action arising out of or related to any injury, damage, or loss sustained during my access to the above-named property.

## Property Rules

I agree to:
- Follow all posted property rules and regulations
- Respect catch-and-release requirements where applicable
- Pack out all trash and leave the property as I found it
- Stay within designated access areas
- Not share access codes or directions with unauthorized individuals

## Acknowledgment

By typing my name below, I acknowledge that I have read and understand this waiver, and I agree to be bound by its terms. I confirm that I am at least 18 years of age or have parental/guardian consent.`;
