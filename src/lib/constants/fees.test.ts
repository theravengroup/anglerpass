import { describe, it, expect } from "vitest";
import {
  calculateFeeBreakdown,
  calculateLeaseBreakdown,
  resolveSplits,
  CLASSIFICATION_SPLITS,
  CLASSIFICATION_META,
  PLATFORM_FEE_RATE,
  LEASE_PLATFORM_FEE_RATE,
  GUIDE_SERVICE_FEE_RATE,
  MEMBERSHIP_PROCESSING_FEE_RATE,
  CROSS_CLUB_FEE_PER_ROD,
  CROSS_CLUB_REFERRAL_PER_ROD,
  CROSS_CLUB_ANGLERPASS_PER_ROD,
  GUIDE_VERIFICATION_FEE_CENTS,
  DEFAULT_REFERRAL_REWARD,
  LEASE_MIN_USD,
  LEASE_MAX_USD,
} from "./fees";

// ─── Constants ──────────────────────────────────────────────────────

describe("Fee constants", () => {
  it("has 15% platform fee rate", () => {
    expect(PLATFORM_FEE_RATE).toBe(0.15);
  });

  it("has 5% lease platform fee rate", () => {
    expect(LEASE_PLATFORM_FEE_RATE).toBe(0.05);
  });

  it("has 10% guide service fee rate", () => {
    expect(GUIDE_SERVICE_FEE_RATE).toBe(0.10);
  });

  it("has 5% membership platform fee rate", () => {
    expect(MEMBERSHIP_PROCESSING_FEE_RATE).toBe(0.05);
  });

  it("has $25/rod cross-club fee split $10 referring / $15 AP", () => {
    expect(CROSS_CLUB_FEE_PER_ROD).toBe(25);
    expect(CROSS_CLUB_REFERRAL_PER_ROD).toBe(10);
    expect(CROSS_CLUB_ANGLERPASS_PER_ROD).toBe(15);
    expect(CROSS_CLUB_REFERRAL_PER_ROD + CROSS_CLUB_ANGLERPASS_PER_ROD).toBe(
      CROSS_CLUB_FEE_PER_ROD,
    );
  });

  it("has $49 guide verification fee", () => {
    expect(GUIDE_VERIFICATION_FEE_CENTS).toBe(4900);
  });

  it("has default referral reward of $25", () => {
    expect(DEFAULT_REFERRAL_REWARD).toBe(25);
  });

  it("has lease amount guardrails", () => {
    expect(LEASE_MIN_USD).toBe(1_000);
    expect(LEASE_MAX_USD).toBe(1_000_000);
  });
});

// ─── Classification splits sum to 1.00 ──────────────────────────────

describe("CLASSIFICATION_SPLITS", () => {
  it.each([["select"], ["premier"], ["signature"]] as const)(
    "%s tier sums to 1.00",
    (tier) => {
      const s = CLASSIFICATION_SPLITS[tier];
      expect(s.club + s.landowner).toBeCloseTo(1.0, 10);
    },
  );

  it("Select is 50/50", () => {
    expect(CLASSIFICATION_SPLITS.select).toEqual({ club: 0.5, landowner: 0.5 });
  });

  it("Premier is 35/65", () => {
    expect(CLASSIFICATION_SPLITS.premier).toEqual({
      club: 0.35,
      landowner: 0.65,
    });
  });

  it("Signature is 25/75", () => {
    expect(CLASSIFICATION_SPLITS.signature).toEqual({
      club: 0.25,
      landowner: 0.75,
    });
  });

  it("CLASSIFICATION_META matches split percentages", () => {
    for (const tier of ["select", "premier", "signature"] as const) {
      const meta = CLASSIFICATION_META[tier];
      const split = CLASSIFICATION_SPLITS[tier];
      expect(meta.clubPct).toBe(split.club * 100);
      expect(meta.landownerPct).toBe(split.landowner * 100);
    }
  });
});

// ─── resolveSplits ───────────────────────────────────────────────────

describe("resolveSplits", () => {
  it("returns classification split for rod_fee_split mode", () => {
    expect(resolveSplits("rod_fee_split", "select")).toEqual({
      club: 0.5,
      landowner: 0.5,
    });
  });

  it("returns 100/0 for upfront_lease mode", () => {
    expect(resolveSplits("upfront_lease", null)).toEqual({
      club: 1,
      landowner: 0,
    });
  });

  it("ignores classification in lease mode", () => {
    expect(resolveSplits("upfront_lease", "signature")).toEqual({
      club: 1,
      landowner: 0,
    });
  });

  it("throws when rod_fee_split has no classification", () => {
    expect(() => resolveSplits("rod_fee_split", null)).toThrow(
      /classification/,
    );
  });
});

// ─── Home-club booking (rod_fee_split) ──────────────────────────────

describe("calculateFeeBreakdown — home-club, rod_fee_split", () => {
  it("Select 50/50: $100/rod, 2 rods, 1 day", () => {
    const r = calculateFeeBreakdown({
      ratePerRod: 100,
      rodCount: 2,
      classification: "select",
      pricingMode: "rod_fee_split",
    });
    expect(r.baseRate).toBe(200);
    expect(r.platformFee).toBe(30);
    expect(r.clubPayout).toBe(100);
    expect(r.landownerPayout).toBe(100);
    expect(r.totalAmount).toBe(230);
    expect(r.anglerpassRevenue).toBe(30);
  });

  it("Premier 35/65: $200/rod, 1 rod, 1 day", () => {
    const r = calculateFeeBreakdown({
      ratePerRod: 200,
      rodCount: 1,
      classification: "premier",
      pricingMode: "rod_fee_split",
    });
    expect(r.baseRate).toBe(200);
    expect(r.clubPayout).toBe(70);
    expect(r.landownerPayout).toBe(130);
    expect(r.platformFee).toBe(30);
    expect(r.totalAmount).toBe(230);
  });

  it("Signature 25/75: $400/rod, 2 rods, 3 days", () => {
    const r = calculateFeeBreakdown({
      ratePerRod: 400,
      rodCount: 2,
      numberOfDays: 3,
      classification: "signature",
      pricingMode: "rod_fee_split",
    });
    expect(r.baseRate).toBe(2400);
    expect(r.clubPayout).toBe(600); // 25% of 2400
    expect(r.landownerPayout).toBe(1800); // 75% of 2400
    expect(r.platformFee).toBe(360); // 15%
    expect(r.totalAmount).toBe(2760);
  });

  it("zero cross-club fees", () => {
    const r = calculateFeeBreakdown({
      ratePerRod: 100,
      rodCount: 1,
      classification: "select",
      pricingMode: "rod_fee_split",
    });
    expect(r.crossClubFee).toBe(0);
    expect(r.crossClubReferral).toBe(0);
    expect(r.crossClubAnglerpass).toBe(0);
    expect(r.isCrossClub).toBe(false);
  });
});

// ─── Lease mode ──────────────────────────────────────────────────────

describe("calculateFeeBreakdown — upfront_lease", () => {
  it("club keeps 100% of rod fees, landowner gets 0", () => {
    const r = calculateFeeBreakdown({
      ratePerRod: 100,
      rodCount: 2,
      classification: null,
      pricingMode: "upfront_lease",
    });
    expect(r.baseRate).toBe(200);
    expect(r.clubPayout).toBe(200);
    expect(r.landownerPayout).toBe(0);
    expect(r.clubSplitPct).toBe(1);
    expect(r.landownerSplitPct).toBe(0);
  });

  it("AP still charges 15% platform fee on lease bookings", () => {
    const r = calculateFeeBreakdown({
      ratePerRod: 100,
      rodCount: 2,
      classification: null,
      pricingMode: "upfront_lease",
    });
    expect(r.platformFee).toBe(30);
    expect(r.totalAmount).toBe(230);
  });

  it("classification is cleared in output when lease mode", () => {
    const r = calculateFeeBreakdown({
      ratePerRod: 100,
      rodCount: 1,
      classification: "signature", // should be ignored
      pricingMode: "upfront_lease",
    });
    expect(r.classification).toBeNull();
  });
});

// ─── Cross-club bookings ─────────────────────────────────────────────

describe("calculateFeeBreakdown — cross-club", () => {
  it("adds $25/rod/day cross-club fee split $10/$15", () => {
    const r = calculateFeeBreakdown({
      ratePerRod: 100,
      rodCount: 2,
      classification: "select",
      pricingMode: "rod_fee_split",
      isCrossClub: true,
    });
    expect(r.crossClubFee).toBe(50); // 25 * 2
    expect(r.crossClubReferral).toBe(20); // 10 * 2
    expect(r.crossClubAnglerpass).toBe(30); // 15 * 2
  });

  it("total includes cross-club fee", () => {
    const r = calculateFeeBreakdown({
      ratePerRod: 100,
      rodCount: 1,
      classification: "select",
      pricingMode: "rod_fee_split",
      isCrossClub: true,
    });
    // base 100 + platform 15 + crossClub 25 = 140
    expect(r.totalAmount).toBe(140);
  });

  it("AP revenue includes crossClubAnglerpass share", () => {
    const r = calculateFeeBreakdown({
      ratePerRod: 100,
      rodCount: 2,
      classification: "premier",
      pricingMode: "rod_fee_split",
      isCrossClub: true,
    });
    // platform 30 + crossClubAnglerpass 30 = 60
    expect(r.anglerpassRevenue).toBe(60);
  });

  it("managing club still gets its classification split on cross-club", () => {
    const r = calculateFeeBreakdown({
      ratePerRod: 100,
      rodCount: 1,
      classification: "signature",
      pricingMode: "rod_fee_split",
      isCrossClub: true,
    });
    expect(r.clubPayout).toBe(25); // 25% of 100
    expect(r.landownerPayout).toBe(75);
    expect(r.crossClubReferral).toBe(10); // separate payout to referring club
  });

  it("lease-mode cross-club: managing club gets 100% rod fee + cross-club still applies", () => {
    const r = calculateFeeBreakdown({
      ratePerRod: 100,
      rodCount: 1,
      classification: null,
      pricingMode: "upfront_lease",
      isCrossClub: true,
    });
    expect(r.clubPayout).toBe(100);
    expect(r.landownerPayout).toBe(0);
    expect(r.crossClubFee).toBe(25);
    expect(r.crossClubReferral).toBe(10);
  });
});

// ─── Staff discount ─────────────────────────────────────────────────

describe("calculateFeeBreakdown — staff discount", () => {
  it("Select: staff pays 50%, landowner still gets full 50%, club eats it", () => {
    const r = calculateFeeBreakdown({
      ratePerRod: 100,
      rodCount: 1,
      classification: "select",
      pricingMode: "rod_fee_split",
      isManagingClubStaff: true,
    });
    expect(r.grossRodFees).toBe(100);
    expect(r.staffDiscount).toBe(50); // club's share
    expect(r.baseRate).toBe(50);
    expect(r.platformFee).toBe(7.5); // 15% of 50
    expect(r.landownerPayout).toBe(50); // landowner still gets their share of gross
    expect(r.clubPayout).toBe(0); // club absorbs the discount
  });

  it("Premier: staff pays 65%, landowner gets 65, club 0", () => {
    const r = calculateFeeBreakdown({
      ratePerRod: 100,
      rodCount: 1,
      classification: "premier",
      pricingMode: "rod_fee_split",
      isManagingClubStaff: true,
    });
    expect(r.staffDiscount).toBe(35);
    expect(r.baseRate).toBe(65);
    expect(r.landownerPayout).toBe(65);
    expect(r.clubPayout).toBe(0);
  });

  it("Signature: staff pays 75%, landowner gets 75, club 0", () => {
    const r = calculateFeeBreakdown({
      ratePerRod: 100,
      rodCount: 1,
      classification: "signature",
      pricingMode: "rod_fee_split",
      isManagingClubStaff: true,
    });
    expect(r.staffDiscount).toBe(25);
    expect(r.baseRate).toBe(75);
    expect(r.landownerPayout).toBe(75);
    expect(r.clubPayout).toBe(0);
  });

  it("Lease mode: staff gets 100% off (club's full share)", () => {
    const r = calculateFeeBreakdown({
      ratePerRod: 100,
      rodCount: 1,
      classification: null,
      pricingMode: "upfront_lease",
      isManagingClubStaff: true,
    });
    expect(r.staffDiscount).toBe(100);
    expect(r.baseRate).toBe(0);
    expect(r.platformFee).toBe(0);
    expect(r.clubPayout).toBe(0);
    expect(r.landownerPayout).toBe(0);
  });

  it("Cross-club: staff discount does NOT apply (angler isn't managing-club staff)", () => {
    const r = calculateFeeBreakdown({
      ratePerRod: 100,
      rodCount: 1,
      classification: "select",
      pricingMode: "rod_fee_split",
      isCrossClub: true,
      isManagingClubStaff: false, // explicitly: staff of OTHER club
    });
    expect(r.staffDiscount).toBe(0);
    expect(r.baseRate).toBe(100);
    expect(r.crossClubFee).toBe(25);
  });
});

// ─── Guide fees ──────────────────────────────────────────────────────

describe("calculateFeeBreakdown — with guide", () => {
  it("adds guide rate + 10% service fee", () => {
    const r = calculateFeeBreakdown({
      ratePerRod: 100,
      rodCount: 1,
      classification: "select",
      pricingMode: "rod_fee_split",
      guideRate: 200,
    });
    expect(r.guideRate).toBe(200);
    expect(r.guideServiceFee).toBe(20);
    expect(r.guidePayout).toBe(200);
  });

  it("scales guide rate across days", () => {
    const r = calculateFeeBreakdown({
      ratePerRod: 100,
      rodCount: 1,
      numberOfDays: 2,
      classification: "select",
      pricingMode: "rod_fee_split",
      guideRate: 300,
    });
    expect(r.guideRate).toBe(600);
    expect(r.guideServiceFee).toBe(60);
  });

  it("AP revenue includes guide service fee", () => {
    const r = calculateFeeBreakdown({
      ratePerRod: 100,
      rodCount: 1,
      classification: "select",
      pricingMode: "rod_fee_split",
      guideRate: 200,
    });
    // platform 15 + guideServiceFee 20 = 35
    expect(r.anglerpassRevenue).toBe(35);
  });
});

// ─── Conservation of money (invariants) ─────────────────────────────

describe("calculateFeeBreakdown — invariants", () => {
  const cases = [
    {
      name: "select home-club",
      input: {
        ratePerRod: 150,
        rodCount: 3,
        classification: "select" as const,
        pricingMode: "rod_fee_split" as const,
      },
    },
    {
      name: "premier cross-club",
      input: {
        ratePerRod: 200,
        rodCount: 2,
        classification: "premier" as const,
        pricingMode: "rod_fee_split" as const,
        isCrossClub: true,
      },
    },
    {
      name: "signature multi-day with guide",
      input: {
        ratePerRod: 350,
        rodCount: 2,
        numberOfDays: 4,
        classification: "signature" as const,
        pricingMode: "rod_fee_split" as const,
        guideRate: 500,
      },
    },
    {
      name: "lease cross-club with guide",
      input: {
        ratePerRod: 100,
        rodCount: 4,
        classification: null,
        pricingMode: "upfront_lease" as const,
        isCrossClub: true,
        guideRate: 400,
      },
    },
    {
      name: "select staff at own club",
      input: {
        ratePerRod: 250,
        rodCount: 1,
        classification: "select" as const,
        pricingMode: "rod_fee_split" as const,
        isManagingClubStaff: true,
      },
    },
  ];

  it.each(cases)("$name: total == all payouts + AP revenue", ({ input }) => {
    const r = calculateFeeBreakdown(input);
    // Money in (angler's total) = money out (all the buckets below)
    const sumOut =
      r.landownerPayout +
      r.clubPayout +
      r.crossClubReferral +
      r.guidePayout +
      r.anglerpassRevenue;
    expect(roundTo2(sumOut)).toBeCloseTo(r.totalAmount, 2);
  });

  it.each(cases)(
    "$name: clubPayout + landownerPayout == baseRate",
    ({ input }) => {
      const r = calculateFeeBreakdown(input);
      expect(roundTo2(r.clubPayout + r.landownerPayout)).toBeCloseTo(
        r.baseRate,
        2,
      );
    },
  );
});

// ─── Edge cases ──────────────────────────────────────────────────────

describe("calculateFeeBreakdown — edge cases", () => {
  it("zero rod fee", () => {
    const r = calculateFeeBreakdown({
      ratePerRod: 0,
      rodCount: 1,
      classification: "select",
      pricingMode: "rod_fee_split",
    });
    expect(r.totalAmount).toBe(0);
  });

  it("rounds fractional amounts", () => {
    const r = calculateFeeBreakdown({
      ratePerRod: 33.33,
      rodCount: 1,
      classification: "select",
      pricingMode: "rod_fee_split",
    });
    expect(r.platformFee).toBe(5); // 33.33 * 0.15 → 5 (rounded)
  });

  it("floors fractional days to 1 minimum", () => {
    const r = calculateFeeBreakdown({
      ratePerRod: 100,
      rodCount: 1,
      numberOfDays: 0,
      classification: "select",
      pricingMode: "rod_fee_split",
    });
    expect(r.numberOfDays).toBe(1);
  });

  it("floors fractional rod count", () => {
    const r = calculateFeeBreakdown({
      ratePerRod: 100,
      rodCount: 2.7,
      classification: "select",
      pricingMode: "rod_fee_split",
    });
    expect(r.rodCount).toBe(2);
  });

  it("throws if rod_fee_split without classification", () => {
    expect(() =>
      calculateFeeBreakdown({
        ratePerRod: 100,
        rodCount: 1,
        classification: null,
        pricingMode: "rod_fee_split",
      }),
    ).toThrow(/classification/);
  });
});

// ─── Lease breakdown ─────────────────────────────────────────────────

describe("calculateLeaseBreakdown", () => {
  it("5% platform fee, landowner gets 95%", () => {
    const r = calculateLeaseBreakdown(20_000_00); // $20,000 in cents
    expect(r.amountCents).toBe(2_000_000);
    expect(r.platformFeeCents).toBe(100_000); // 5%
    expect(r.landownerNetCents).toBe(1_900_000);
  });

  it("handles rounding on odd cents", () => {
    const r = calculateLeaseBreakdown(10_001); // $100.01
    expect(r.platformFeeCents).toBe(500); // round(10001 * 0.05) = 500
    expect(r.amountCents).toBe(r.platformFeeCents + r.landownerNetCents);
  });

  it("zero amount", () => {
    const r = calculateLeaseBreakdown(0);
    expect(r.amountCents).toBe(0);
    expect(r.platformFeeCents).toBe(0);
    expect(r.landownerNetCents).toBe(0);
  });

  it("floors negative to zero", () => {
    const r = calculateLeaseBreakdown(-500);
    expect(r.amountCents).toBe(0);
    expect(r.landownerNetCents).toBe(0);
  });
});

// ─── Helpers ─────────────────────────────────────────────────────────

function roundTo2(n: number): number {
  return Math.round(n * 100) / 100;
}
