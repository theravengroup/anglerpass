export const siteConfig = {
  name: "AnglerPass",
  description:
    "The operating platform for private fly fishing access. Manage properties, memberships, and fishing days — all in one place built for landowners, clubs, and serious anglers.",
  url: "https://anglerpass.com",
  contactEmail: "hello@anglerpass.com",
  contactPhone: "303-586-1008",
  investorEmail: "investors@anglerpass.com",
} as const;

/**
 * Canonical site URL. Uses NEXT_PUBLIC_SITE_URL if set (for staging/preview),
 * falls back to the production URL. Import this everywhere instead of
 * re-declaring `const SITE_URL = ...` in each file.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://anglerpass.com";
