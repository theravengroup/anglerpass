/**
 * AnglerPass Platform Fee Structure
 *
 * All monetary amounts are in USD. These constants are the single source of
 * truth for fee calculations across the platform and feed directly into
 * Stripe payment + Connect transfer logic.
 *
 * NOMENCLATURE: On AnglerPass, "1 rod = 1 angler". Rod fees are per-angler
 * charges set by the landowner. Non-fishing guests are not charged a rod fee.
 *
 * ─── Rod fee split model ─────────────────────────────────────────────
 * Each property is either:
 *   (a) pricing_mode = 'rod_fee_split' with a classification:
 *       • Select    — 50/50 (club / landowner)
 *       • Premier   — 35/65
 *       • Signature — 25/75
 *   (b) pricing_mode = 'upfront_lease' — club pays an annual lease to the
 *       landowner via ACH. The landowner receives 100% of the agreed
 *       amount; AnglerPass's 5% facilitation fee is charged on top to the
 *       club. On bookings the club then keeps 100% of the rod fee.
 *
 * AnglerPass always charges 15% on top of the rod fee at checkout.
 *
 * ─── Cross-club bookings ─────────────────────────────────────────────
 * If an angler books through Club A at a property managed by Club B, an
 * additional $25/rod/day is charged to the angler. $10 → Club A (referring
 * club), $15 → AnglerPass. The rod-fee split or lease rule still applies to
 * the rod fee itself (Club B + landowner).
 *
 * ─── Staff discount ─────────────────────────────────────────────────
 * Staff of the managing club get the club's share of the rod fee as their
 * discount (Select 50%, Premier 35%, Signature 25%). In lease mode the
 * discount equals 100% of the rod fee. The discount is absorbed by the
 * club — the landowner still receives their full split.
 *
 * Staff of OTHER clubs (cross-club bookings) do NOT get the discount.
 * They pay the regular angler price, and all cross-club fees still apply.
 */

// ─── Property Classifications ────────────────────────────────────────
export type PropertyClassification = "select" | "premier" | "signature";
export type PricingMode = "rod_fee_split" | "upfront_lease";

export const PROPERTY_CLASSIFICATIONS = [
  "select",
  "premier",
  "signature",
] as const;

export const PRICING_MODES = ["rod_fee_split", "upfront_lease"] as const;

/**
 * Rod fee split by classification (club share / landowner share).
 * Values MUST sum to 1.00 per tier. Runtime-verified in tests.
 */
export const CLASSIFICATION_SPLITS: Record<
  PropertyClassification,
  { club: number; landowner: number }
> = {
  select: { club: 0.50, landowner: 0.50 },
  premier: { club: 0.35, landowner: 0.65 },
  signature: { club: 0.25, landowner: 0.75 },
};

/** Display metadata for UI rendering (pricing page, property onboarding). */
export const CLASSIFICATION_META: Record<
  PropertyClassification,
  { label: string; tagline: string; clubPct: number; landownerPct: number }
> = {
  select: {
    label: "Select",
    tagline: "Shared opportunity — 50/50 split with your club.",
    clubPct: 50,
    landownerPct: 50,
  },
  premier: {
    label: "Premier",
    tagline: "Standout water — you keep 65% of rod fees.",
    clubPct: 35,
    landownerPct: 65,
  },
  signature: {
    label: "Signature",
    tagline: "Exceptional water — you keep 75% of rod fees.",
    clubPct: 25,
    landownerPct: 75,
  },
};

// ─── Platform Fee ────────────────────────────────────────────────────
/** 15% markup on the base rod fee, paid by the angler to AnglerPass. */
export const PLATFORM_FEE_RATE = 0.15;

// ─── Lease Platform Fee ──────────────────────────────────────────────
/**
 * 5% facilitation fee on annual upfront lease payments. Charged ON TOP of
 * the landowner's agreed amount to the club — the landowner always receives
 * 100% of what they asked for. Club ACH charge = landowner_amount * 1.05.
 */
export const LEASE_PLATFORM_FEE_RATE = 0.05;

/** Sensible guardrails for landowner-proposed lease amounts (USD). */
export const LEASE_MIN_USD = 1_000;
export const LEASE_MAX_USD = 1_000_000;

// ─── Guide Service Fee ──────────────────────────────────────────────
/** 10% service fee on guide rates, paid by the angler to AnglerPass. */
export const GUIDE_SERVICE_FEE_RATE = 0.10;

// ─── Membership Platform Fee ──────────────────────────────────────
/** 5% platform fee on membership payments (initiation + dues), paid by the member. */
export const MEMBERSHIP_PROCESSING_FEE_RATE = 0.05;

// ─── Cross-Club Network Fee ─────────────────────────────────────────
/**
 * Total cross-club access fee per rod/day, paid by the angler when booking
 * at a property NOT managed by their home club.
 *
 * Split:
 *   $15 → AnglerPass (platform revenue)
 *   $10 → Referring club (the angler's home club)
 */
export const CROSS_CLUB_FEE_PER_ROD = 25;
export const CROSS_CLUB_REFERRAL_PER_ROD = 10;
export const CROSS_CLUB_ANGLERPASS_PER_ROD = 15;

// ─── Guide Verification Fee ────────────────────────────────────────
/** One-time background-check fee charged to guides via Stripe Checkout. */
export const GUIDE_VERIFICATION_FEE_CENTS = 4900;
export const GUIDE_VERIFICATION_FEE_DISPLAY = "$49";

// ─── Member Referral Rewards ───────────────────────────────────────
/** Default reward amount for member referrals. Clubs can override. */
export const DEFAULT_REFERRAL_REWARD = 25;

// ─── Fee Calculation ────────────────────────────────────────────────

export interface FeeBreakdownInput {
  /** Landowner's listed rate per rod (full or half day) */
  ratePerRod: number;
  /** Number of rods (anglers) in the booking */
  rodCount: number;
  /** Number of days in the booking (default 1) */
  numberOfDays?: number;
  /** Property classification (required for rod_fee_split, ignored for upfront_lease) */
  classification: PropertyClassification | null;
  /** Property pricing mode */
  pricingMode: PricingMode;
  /** True if the booking is cross-club (angler's club != managing club) */
  isCrossClub?: boolean;
  /** True if the angler is staff of the managing club (discount applies) */
  isManagingClubStaff?: boolean;
  /** Optional guide day rate (full or half day) */
  guideRate?: number;
}

export interface FeeBreakdown {
  ratePerRod: number;
  rodCount: number;
  numberOfDays: number;
  /** Gross rod-fee subtotal before staff discount: ratePerRod * rodCount * days */
  grossRodFees: number;
  /** Staff discount (absorbed by the managing club) */
  staffDiscount: number;
  /** Rod-fee subtotal after staff discount — this is what the angler pays and what's split */
  baseRate: number;
  /** Platform fee (15% of baseRate), angler pays to AnglerPass */
  platformFee: number;
  /** Cross-club fee ($25/rod/day), $0 for same-club */
  crossClubFee: number;
  /** Referring-club referral ($10/rod/day from cross-club fee) */
  crossClubReferral: number;
  /** AnglerPass's share of the cross-club fee ($15/rod/day) */
  crossClubAnglerpass: number;
  /** Grand total charged to the angler */
  totalAmount: number;
  /** Whether this booking is cross-club */
  isCrossClub: boolean;
  /** Snapshot: club share % applied (0.50/0.35/0.25, or 1.00 for lease) */
  clubSplitPct: number;
  /** Snapshot: landowner share % applied (0.50/0.65/0.75, or 0.00 for lease) */
  landownerSplitPct: number;

  // ── Guide fees ──
  guideRate: number;
  guideServiceFee: number;
  guidePayout: number;

  // ── Payout breakdown ──
  /** Managing club's share of the rod fee */
  clubPayout: number;
  /** Landowner's share of the rod fee (0 in lease mode) */
  landownerPayout: number;
  /** AnglerPass revenue: platformFee + crossClubAnglerpass + guideServiceFee */
  anglerpassRevenue: number;

  // ── Context ──
  classification: PropertyClassification | null;
  pricingMode: PricingMode;
}

/**
 * Calculate the full fee breakdown for a booking.
 *
 * All amounts are in USD, rounded to 2 decimal places. The angler's total
 * must equal the sum of all downstream payouts + AP revenue (invariant
 * verified in tests).
 */
export function calculateFeeBreakdown(input: FeeBreakdownInput): FeeBreakdown {
  const {
    ratePerRod,
    rodCount,
    numberOfDays = 1,
    classification,
    pricingMode,
    isCrossClub = false,
    isManagingClubStaff = false,
    guideRate = 0,
  } = input;

  const days = Math.max(1, Math.floor(numberOfDays));
  const rods = Math.max(0, Math.floor(rodCount));

  // Resolve splits. Lease mode = club gets 100%, landowner gets 0 (already
  // paid upfront). rod_fee_split mode = per-classification ratio.
  const splits = resolveSplits(pricingMode, classification);
  const clubSplitPct = splits.club;
  const landownerSplitPct = splits.landowner;

  const grossRodFees = round(ratePerRod * rods * days);

  // Staff discount (only applies if angler is staff of the managing club).
  // In cross-club bookings the angler is NOT staff of the managing club, so
  // this is always false for cross-club. Discount = club's share.
  const staffDiscount = isManagingClubStaff
    ? round(grossRodFees * clubSplitPct)
    : 0;

  const baseRate = round(grossRodFees - staffDiscount);

  // Platform fee — angler pays 15% on top of baseRate.
  const platformFee = round(baseRate * PLATFORM_FEE_RATE);

  // Cross-club fees (only if cross-club).
  const crossClubFee = isCrossClub
    ? round(CROSS_CLUB_FEE_PER_ROD * rods * days)
    : 0;
  const crossClubReferral = isCrossClub
    ? round(CROSS_CLUB_REFERRAL_PER_ROD * rods * days)
    : 0;
  const crossClubAnglerpass = round(crossClubFee - crossClubReferral);

  // Guide fees.
  const totalGuideRate = round(guideRate * days);
  const guideServiceFee = round(totalGuideRate * GUIDE_SERVICE_FEE_RATE);
  const guidePayout = round(totalGuideRate);

  // Grand total charged to the angler.
  const totalAmount = round(
    baseRate + platformFee + crossClubFee + totalGuideRate + guideServiceFee
  );

  // Payouts from baseRate (staff-discounted).
  //
  // Staff-discount note: when a staff member books at their own club, the
  // club's share is zeroed (the discount IS the club's share). The landowner
  // still receives landowner_split_pct of the GROSS rod fees — i.e. the
  // discount comes entirely out of the club's pocket, not the landowner's.
  //
  // Implementation: compute landowner from GROSS (pre-discount), compute
  // club as the residual of the discounted baseRate (so the club absorbs
  // the full discount).
  const landownerPayout = round(grossRodFees * landownerSplitPct);
  const clubPayout = round(baseRate - landownerPayout);

  const anglerpassRevenue = round(
    platformFee + crossClubAnglerpass + guideServiceFee
  );

  return {
    ratePerRod,
    rodCount: rods,
    numberOfDays: days,
    grossRodFees,
    staffDiscount,
    baseRate,
    platformFee,
    crossClubFee,
    crossClubReferral,
    crossClubAnglerpass,
    totalAmount,
    isCrossClub,
    clubSplitPct,
    landownerSplitPct,
    guideRate: totalGuideRate,
    guideServiceFee,
    guidePayout,
    clubPayout,
    landownerPayout,
    anglerpassRevenue,
    classification: pricingMode === "rod_fee_split" ? classification : null,
    pricingMode,
  };
}

/**
 * Resolve the (club, landowner) split for a property.
 * Throws if classification is missing in rod_fee_split mode.
 */
export function resolveSplits(
  pricingMode: PricingMode,
  classification: PropertyClassification | null,
): { club: number; landowner: number } {
  if (pricingMode === "upfront_lease") {
    return { club: 1, landowner: 0 };
  }
  if (!classification) {
    throw new Error(
      "Cannot resolve rod-fee split: property is in rod_fee_split mode but has no classification set.",
    );
  }
  return CLASSIFICATION_SPLITS[classification];
}

/**
 * Calculate the lease payment breakdown for an ACH transfer from club to
 * landowner.
 *
 * The landowner's agreed amount is what the landowner receives in full —
 * AnglerPass's 5% facilitation fee is charged ON TOP to the club. In other
 * words: landowner asks for $5,000 → landowner gets $5,000 → club is
 * charged $5,250 via ACH → AnglerPass keeps $250.
 *
 * All amounts are in cents to match Stripe's PaymentIntent convention.
 *
 * @param landownerAmountCents The agreed landowner payout (what the
 *   landowner receives). This is the figure stored in
 *   properties.lease_amount_cents.
 */
export function calculateLeaseBreakdown(landownerAmountCents: number): {
  /** What the landowner receives (the agreed amount). */
  landownerNetCents: number;
  /** 5% platform fee charged on top to the club. */
  platformFeeCents: number;
  /** Total charged to the club via ACH = landowner + platform fee. */
  clubChargeCents: number;
} {
  const landowner = Math.max(0, Math.floor(landownerAmountCents));
  const platformFeeCents = Math.round(landowner * LEASE_PLATFORM_FEE_RATE);
  const clubChargeCents = landowner + platformFeeCents;
  return { landownerNetCents: landowner, platformFeeCents, clubChargeCents };
}

/** Round to 2 decimal places (currency precision). */
export function roundCurrency(n: number): number {
  return Math.round(n * 100) / 100;
}

/** @internal */
const round = roundCurrency;

// ─── Legacy compatibility error helper ──────────────────────────────
/**
 * Ensures any call site still passing the old positional signature fails
 * loudly at runtime instead of silently doing wrong math. Remove after one
 * release cycle once no more callers exist.
 * @deprecated use {@link calculateFeeBreakdown} with the options object.
 */
export function calculateFeeBreakdownLegacy(): never {
  throw new Error(
    "calculateFeeBreakdown() now takes a FeeBreakdownInput object — pass { ratePerRod, rodCount, classification, pricingMode, ... }.",
  );
}

// ─── Nomenclature ───────────────────────────────────────────────────
export const ROD_NOMENCLATURE =
  "On AnglerPass, 1 rod = 1 angler. Rod fees are charged per angler fishing.";
