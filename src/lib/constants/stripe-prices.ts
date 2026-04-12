/**
 * Stripe Price IDs for AnglerPass platform subscriptions.
 *
 * Product: AnglerPass Club Platform (prod_UHV1TM8giD4NRI)
 *
 * These are TEST MODE prices. When going live, create new prices
 * in live mode and update these values (or use env vars).
 *
 * Current pricing is Early Access pricing, valid through September 30, 2026.
 * After that date, pricing moves to standard rates.
 */

export const STRIPE_PRICE_IDS = {
  /** Starter tier — $79/mo (Early Access) */
  starter: "price_1TIw1AIkVdB6T8axEf8f76Je",
  /** Standard tier — $199/mo (Early Access) */
  standard: "price_1TIw1AIkVdB6T8axUKu8lIrt",
  /** Pro tier — $499/mo (Early Access) */
  pro: "price_1TIw1AIkVdB6T8axYHPJSkEf",
} as const;

export type ClubTier = keyof typeof STRIPE_PRICE_IDS;

/**
 * Early Access pricing is locked through September 30, 2026 for founding clubs.
 * After that, new clubs pay standard pricing.
 */
export const EARLY_ACCESS_DEADLINE = "2026-09-30";

export const CLUB_TIER_CONFIG: Record<
  ClubTier,
  { name: string; price: number; futurePrice: number; features: string[] }
> = {
  starter: {
    name: "Starter",
    price: 79,
    futurePrice: 129,
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
    futurePrice: 299,
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
    futurePrice: 699,
    features: [
      "Unlimited members",
      "Unlimited properties",
      "Priority support",
      "Unlimited cross-club partners",
    ],
  },
};
