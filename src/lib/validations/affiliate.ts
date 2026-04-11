import { z } from "zod";

// ─── Affiliate Click ────────────────────────────────────────────────
export const affiliateClickSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  source: z
    .enum(["compass", "gear_page", "email", "other"])
    .default("compass"),
  context: z.record(z.string(), z.unknown()).optional().default({}),
});

export type AffiliateClickInput = z.infer<typeof affiliateClickSchema>;

// ─── Product Query ──────────────────────────────────────────────────
export const affiliateProductQuerySchema = z.object({
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  species: z.array(z.string()).optional(),
  waterType: z.string().optional(),
  season: z.string().optional(),
  maxResults: z.number().int().min(1).max(20).default(6),
});

export type AffiliateProductQuery = z.infer<typeof affiliateProductQuerySchema>;

// ─── Admin: Brand Management ────────────────────────────────────────
export const affiliateBrandSchema = z.object({
  name: z.string().min(1, "Brand name is required").max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  logoUrl: z.string().url().optional().or(z.literal("")),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  networkId: z.string().uuid().optional(),
  affiliateProgramId: z.string().max(200).optional(),
  commissionRate: z.number().min(0).max(1).optional(),
  tier: z.enum(["direct", "retailer", "digital"]),
  isActive: z.boolean().default(true),
});

export type AffiliateBrandInput = z.infer<typeof affiliateBrandSchema>;

// ─── Admin: Product Management ──────────────────────────────────────
export const affiliateProductSchema = z.object({
  brandId: z.string().uuid("Brand is required"),
  name: z.string().min(1, "Product name is required").max(200),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  category: z.enum([
    "rod",
    "reel",
    "line",
    "leader_tippet",
    "waders",
    "boots",
    "jacket",
    "baselayer",
    "pack",
    "net",
    "sunglasses",
    "hat",
    "flies",
    "tools",
    "accessories",
    "app",
    "service",
    "other",
  ]),
  description: z.string().max(1000).optional(),
  priceCents: z.number().int().min(0).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  affiliateUrl: z.string().url("Affiliate URL is required"),
  fallbackUrl: z.string().url().optional().or(z.literal("")),
  tags: z.array(z.string()).default([]),
  speciesTags: z.array(z.string()).default([]),
  waterTypeTags: z.array(z.string()).default([]),
  seasonTags: z.array(z.string()).default([]),
  sortPriority: z.number().int().min(0).max(1000).default(0),
  isActive: z.boolean().default(true),
});

export type AffiliateProductInput = z.infer<typeof affiliateProductSchema>;

// ─── Admin: Network Management ──────────────────────────────────────
export const affiliateNetworkSchema = z.object({
  name: z.string().min(1, "Network name is required").max(100),
  networkType: z.enum(["impact", "cj", "shareasale", "direct", "other"]),
  baseUrl: z.string().url().optional().or(z.literal("")),
  defaultCommissionRate: z.number().min(0).max(1).optional(),
  isActive: z.boolean().default(true),
});

export type AffiliateNetworkInput = z.infer<typeof affiliateNetworkSchema>;
