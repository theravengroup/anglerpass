/**
 * AnglerPass Platform Fee Structure
 *
 * All monetary amounts are in USD. These constants are the single source of
 * truth for fee calculations across the platform and will feed directly into
 * the Stripe payment integration.
 *
 * NOMENCLATURE: On AnglerPass, "1 rod = 1 angler". Rod fees are per-angler
 * charges set by the landowner. Non-fishing guests are not charged a rod fee.
 */

// ─── Platform Fee ────────────────────────────────────────────────────
/** 15% markup on the base rod fee, paid by the angler to AnglerPass. */
export const PLATFORM_FEE_RATE = 0.15;

// ─── Guide Service Fee ──────────────────────────────────────────────
/** 10% service fee on guide rates, paid by the angler to AnglerPass. */
export const GUIDE_SERVICE_FEE_RATE = 0.10;

// ─── Cross-Club Network Fee ─────────────────────────────────────────
/**
 * Flat fee per rod when an angler books a property through the Cross-Club
 * Network (i.e. the property is NOT associated with the angler's home club).
 * Paid by the angler, goes to AnglerPass.
 */
export const CROSS_CLUB_FEE_PER_ROD = 10;

// ─── Club Commission ────────────────────────────────────────────────
/**
 * Per-rod commission paid to the associated club on every booking.
 * This amount comes OUT of the landowner's listed rod fee — it is NOT
 * an additional charge to the angler.
 *
 * Example: Landowner lists $100/rod → Club receives $5, Landowner nets $95.
 */
export const CLUB_COMMISSION_PER_ROD = 5;

// ─── Staff Discounts ────────────────────────────────────────────────
/** Club staff get 50% off rod fees at their own club's properties. */
export const STAFF_DISCOUNT_OWN_CLUB = 50;

/** Club staff get 25% off rod fees at Cross-Club Network properties. */
export const STAFF_DISCOUNT_CROSS_CLUB = 25;

// ─── Fee Calculation ────────────────────────────────────────────────

export interface FeeBreakdown {
  /** Landowner's listed rate per rod (per angler) */
  ratePerRod: number;
  /** Number of rods (anglers) in the booking */
  rodCount: number;
  /** Number of days in the booking */
  numberOfDays: number;
  /** Base rod fees: ratePerRod * rodCount * numberOfDays */
  baseRate: number;
  /** Platform fee (15% of baseRate), paid by angler to AnglerPass */
  platformFee: number;
  /** Cross-club fee ($10/rod/day), $0 if home-club booking */
  crossClubFee: number;
  /** Total charged to the angler */
  totalAmount: number;
  /** Whether this is a cross-club booking */
  isCrossClub: boolean;

  // ── Guide fees ──
  /** Guide's day rate (full or half day) * numberOfDays, $0 if no guide */
  guideRate: number;
  /** Guide service fee (10% of guideRate), paid by angler to AnglerPass */
  guideServiceFee: number;
  /** Guide payout (guideRate -- guide keeps 100%) */
  guidePayout: number;

  // ── Payout breakdown (for internal tracking / Stripe splits) ──
  /** Club commission ($5/rod/day from the landowner's rate) */
  clubCommission: number;
  /** Landowner net payout (baseRate - clubCommission) */
  landownerPayout: number;
  /** Total AnglerPass revenue (platformFee + crossClubFee + guideServiceFee) */
  anglerpassRevenue: number;
}

/**
 * Calculate the full fee breakdown for a booking.
 *
 * @param ratePerRod    — Landowner's listed rate per rod (full or half day)
 * @param rodCount      — Number of anglers (rods)
 * @param isCrossClub   — Whether the booking is through the Cross-Club Network
 * @param guideRate     — Optional guide day rate (full or half day)
 * @param numberOfDays  — Number of days in the booking (default 1)
 */
export function calculateFeeBreakdown(
  ratePerRod: number,
  rodCount: number,
  isCrossClub: boolean = false,
  guideRate: number = 0,
  numberOfDays: number = 1
): FeeBreakdown {
  const days = Math.max(1, Math.floor(numberOfDays));
  const baseRate = round(ratePerRod * rodCount * days);
  const platformFee = round(baseRate * PLATFORM_FEE_RATE);
  const crossClubFee = isCrossClub
    ? round(CROSS_CLUB_FEE_PER_ROD * rodCount * days)
    : 0;

  // Guide fees (multiplied by days)
  const totalGuideRate = round(guideRate * days);
  const guideServiceFee = round(totalGuideRate * GUIDE_SERVICE_FEE_RATE);
  const guidePayout = round(totalGuideRate);

  const totalAmount = round(
    baseRate + platformFee + crossClubFee + totalGuideRate + guideServiceFee
  );

  // Payout splits
  const clubCommission = round(CLUB_COMMISSION_PER_ROD * rodCount * days);
  const landownerPayout = round(baseRate - clubCommission);
  const anglerpassRevenue = round(platformFee + crossClubFee + guideServiceFee);

  return {
    ratePerRod,
    rodCount,
    numberOfDays: days,
    baseRate,
    platformFee,
    crossClubFee,
    totalAmount,
    isCrossClub,
    guideRate: totalGuideRate,
    guideServiceFee,
    guidePayout,
    clubCommission,
    landownerPayout,
    anglerpassRevenue,
  };
}

/** Round to 2 decimal places. */
function round(n: number): number {
  return Math.round(n * 100) / 100;
}

// ─── Nomenclature ───────────────────────────────────────────────────
/**
 * Platform-wide terminology note.
 * Use this text where the rod/angler equivalence needs to be communicated.
 */
export const ROD_NOMENCLATURE =
  "On AnglerPass, 1 rod = 1 angler. Rod fees are charged per angler fishing.";
