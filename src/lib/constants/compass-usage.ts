/**
 * Compass AI usage metering constants.
 * Monthly message allocations by role, credit pack definitions, and helpers.
 */

/** Monthly message allocations by user role */
export const MONTHLY_ALLOCATIONS: Record<string, number | null> = {
  angler: 50,
  landowner: 100,
  club_admin: 150,
  guide: 75,
  admin: null, // unlimited
};

/** Roles that get unlimited messages */
export const UNLIMITED_ROLES = ["admin"] as const;

/** Warning threshold — show "running low" at this percentage */
export const WARNING_THRESHOLD = 0.8;

/** Credit pack definitions */
export interface CreditPack {
  key: string;
  messages: number;
  priceCents: number;
  label: string;
}

export const CREDIT_PACKS: CreditPack[] = [
  { key: "pack_15", messages: 15, priceCents: 500, label: "15 messages" },
  { key: "pack_40", messages: 40, priceCents: 1000, label: "40 messages" },
  { key: "pack_120", messages: 120, priceCents: 2500, label: "120 messages" },
  { key: "pack_275", messages: 275, priceCents: 5000, label: "275 messages" },
  { key: "pack_600", messages: 600, priceCents: 10000, label: "600 messages" },
  {
    key: "pack_1750",
    messages: 1750,
    priceCents: 25000,
    label: "1,750 messages",
  },
];

/**
 * Get the highest monthly allocation for a user with multiple roles.
 * Returns null if any role grants unlimited access.
 */
export function getMonthlyLimit(roles: string[]): number | null {
  for (const role of roles) {
    if (UNLIMITED_ROLES.includes(role as (typeof UNLIMITED_ROLES)[number])) {
      return null; // unlimited
    }
  }

  let max = 0;
  for (const role of roles) {
    const alloc = MONTHLY_ALLOCATIONS[role];
    if (alloc !== null && alloc !== undefined && alloc > max) {
      max = alloc;
    }
  }

  return max || 50; // fallback to angler allocation
}

/** Find a credit pack by key */
export function getCreditPack(key: string): CreditPack | undefined {
  return CREDIT_PACKS.find((p) => p.key === key);
}

/** Format cents as USD string */
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

/**
 * Suggest the best credit pack based on projected shortfall.
 * Returns the smallest pack that covers the shortfall, or the largest pack if none covers it.
 */
export function suggestPack(shortfall: number): CreditPack {
  for (const pack of CREDIT_PACKS) {
    if (pack.messages >= shortfall) {
      return pack;
    }
  }
  return CREDIT_PACKS[CREDIT_PACKS.length - 1];
}
