/**
 * Stripe Price IDs for AnglerPass platform subscriptions.
 *
 * Product: AnglerPass Club Platform (prod_UHV1TM8giD4NRI)
 *
 * These are TEST MODE prices. When going live, create new prices
 * in live mode and update these values (or use env vars).
 */

export const STRIPE_PRICE_IDS = {
  /** Starter tier — $79/mo */
  starter: "price_1TIw1AIkVdB6T8axEf8f76Je",
  /** Standard tier — $199/mo */
  standard: "price_1TIw1AIkVdB6T8axUKu8lIrt",
  /** Pro tier — $499/mo */
  pro: "price_1TIw1AIkVdB6T8axYHPJSkEf",
} as const;

export type ClubTier = keyof typeof STRIPE_PRICE_IDS;

export const CLUB_TIER_CONFIG: Record<
  ClubTier,
  { name: string; price: number; features: string[] }
> = {
  starter: {
    name: "Starter",
    price: 79,
    features: [
      "Up to 500 members",
      "Up to 25 properties",
      "Basic scheduling",
      "2 cross-club partners",
    ],
  },
  standard: {
    name: "Standard",
    price: 199,
    features: [
      "Up to 2,000 members",
      "Up to 100 properties",
      "Advanced scheduling",
      "10 cross-club partners",
    ],
  },
  pro: {
    name: "Pro",
    price: 499,
    features: [
      "Unlimited members",
      "Unlimited properties",
      "Priority support",
      "Unlimited cross-club partners",
    ],
  },
};
