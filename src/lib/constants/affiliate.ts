/**
 * Affiliate Program Constants
 *
 * Configuration for the three-tier affiliate monetization system
 * integrated with Compass AI gear recommendations.
 */

// ─── Affiliate Tiers ────────────────────────────────────────────────
export type AffiliateTier = "direct" | "retailer" | "digital";

export const AFFILIATE_TIER_LABELS: Record<AffiliateTier, string> = {
  direct: "Brand Partner",
  retailer: "Authorized Retailer",
  digital: "Digital Partner",
};

export const AFFILIATE_TIER_DESCRIPTIONS: Record<AffiliateTier, string> = {
  direct:
    "Direct affiliate partnerships with fly fishing brands — Orvis, Simms, Patagonia, and more.",
  retailer:
    "Authorized retailers that carry brands without public affiliate programs — Trident, AvidMax, Telluride Angler.",
  digital:
    "Digital tools and apps for trip planning, research, and fly fishing resources.",
};

// ─── Product Categories ─────────────────────────────────────────────
export type AffiliateProductCategory =
  | "rod"
  | "reel"
  | "line"
  | "leader_tippet"
  | "waders"
  | "boots"
  | "jacket"
  | "baselayer"
  | "pack"
  | "net"
  | "sunglasses"
  | "hat"
  | "flies"
  | "tools"
  | "accessories"
  | "app"
  | "service"
  | "other";

export const PRODUCT_CATEGORY_LABELS: Record<AffiliateProductCategory, string> = {
  rod: "Fly Rods",
  reel: "Fly Reels",
  line: "Fly Lines",
  leader_tippet: "Leaders & Tippet",
  waders: "Waders",
  boots: "Wading Boots",
  jacket: "Jackets & Outerwear",
  baselayer: "Base Layers",
  pack: "Packs & Vests",
  net: "Nets",
  sunglasses: "Sunglasses",
  hat: "Hats & Sun Protection",
  flies: "Flies",
  tools: "Tools & Accessories",
  accessories: "Accessories",
  app: "Apps & Software",
  service: "Services",
  other: "Other",
};

// ─── Known Brands (initial catalog) ─────────────────────────────────
export const KNOWN_BRANDS = {
  // Tier 1: Direct brand affiliates
  direct: [
    { name: "Orvis", slug: "orvis", network: "impact" },
    { name: "Simms", slug: "simms", network: "cj" },
    { name: "Patagonia", slug: "patagonia", network: "impact" },
    { name: "Costa Del Mar", slug: "costa", network: "impact" },
    { name: "Fishpond", slug: "fishpond", network: "direct" },
    { name: "Scientific Anglers", slug: "scientific-anglers", network: "direct" },
    { name: "Rio Products", slug: "rio", network: "direct" },
    { name: "Umpqua Feather Merchants", slug: "umpqua", network: "direct" },
    { name: "Korkers", slug: "korkers", network: "direct" },
    { name: "Smith Optics", slug: "smith", network: "cj" },
  ],
  // Tier 2: Retailer fallbacks (carry brands like Sage, G. Loomis, etc.)
  retailer: [
    { name: "Trident Fly Fishing", slug: "trident", network: "impact" },
    { name: "AvidMax", slug: "avidmax", network: "cj" },
    { name: "Telluride Angler", slug: "telluride-angler", network: "shareasale" },
    { name: "Ed's Fly Shop", slug: "eds-fly-shop", network: "direct" },
    { name: "The Fly Shop", slug: "the-fly-shop", network: "direct" },
  ],
  // Tier 3: Digital products & apps
  digital: [
    { name: "Flylab", slug: "flylab", network: "direct" },
    { name: "FlyFishFinder", slug: "flyfishfinder", network: "direct" },
    { name: "Fishbrain", slug: "fishbrain", network: "impact" },
    { name: "onX Hunt/Fish", slug: "onx", network: "impact" },
  ],
} as const;

// ─── FTC Disclosure ─────────────────────────────────────────────────
export const AFFILIATE_DISCLOSURE_SHORT =
  "AnglerPass may earn a commission on purchases made through these links at no extra cost to you.";

export const AFFILIATE_DISCLOSURE_FULL =
  "AnglerPass participates in affiliate programs with select fly fishing brands and retailers. " +
  "When Compass AI recommends products, some links may be affiliate links — meaning AnglerPass " +
  "earns a small commission if you make a purchase, at no additional cost to you. " +
  "Recommendations are based solely on fishing conditions, your preferences, and product quality — " +
  "never on commission rates. We only recommend products we believe in.";

// ─── Click Tracking ─────────────────────────────────────────────────
export type AffiliateClickSource = "compass" | "gear_page" | "email" | "other";

// ─── Revenue Dashboard ──────────────────────────────────────────────
export const CONVERSION_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  paid: "Paid",
};

export const CONVERSION_STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  paid: "bg-blue-100 text-blue-800",
};

// ─── Gear Category → Product Category Mapping ───────────────────────
// Maps gear recommendation fields to affiliate product categories for matching
export const GEAR_TO_PRODUCT_CATEGORY: Record<string, AffiliateProductCategory[]> = {
  rod: ["rod", "reel", "line"],
  leader: ["leader_tippet"],
  wading: ["waders"],
  boots: ["boots"],
  layers: ["jacket", "baselayer", "hat"],
  accessories: ["pack", "net", "sunglasses", "tools", "accessories"],
  flies: ["flies"],
};
