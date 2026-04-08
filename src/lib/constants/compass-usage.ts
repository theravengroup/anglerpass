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
  { key: "pack_25", messages: 25, priceCents: 500, label: "25 messages" },
  { key: "pack_60", messages: 60, priceCents: 1000, label: "60 messages" },
  { key: "pack_175", messages: 175, priceCents: 2500, label: "175 messages" },
  { key: "pack_400", messages: 400, priceCents: 5000, label: "400 messages" },
  { key: "pack_900", messages: 900, priceCents: 10000, label: "900 messages" },
  {
    key: "pack_2500",
    messages: 2500,
    priceCents: 25000,
    label: "2,500 messages",
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
