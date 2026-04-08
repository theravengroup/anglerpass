import { z } from "zod";
import { CREDIT_PACKS } from "@/lib/constants/compass-usage";

const validPackKeys = CREDIT_PACKS.map((p) => p.key);

export const compassCreditPurchaseSchema = z.object({
  packKey: z.string().refine((k) => validPackKeys.includes(k), {
    message: "Invalid credit pack",
  }),
});

export type CompassCreditPurchaseInput = z.infer<
  typeof compassCreditPurchaseSchema
>;
