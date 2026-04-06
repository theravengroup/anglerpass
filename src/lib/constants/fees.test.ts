import { describe, it, expect } from "vitest";
import {
  calculateFeeBreakdown,
  PLATFORM_FEE_RATE,
  GUIDE_SERVICE_FEE_RATE,
  MEMBERSHIP_PROCESSING_FEE_RATE,
  CROSS_CLUB_FEE_PER_ROD,
  ANGLERPASS_CROSS_CLUB_SHARE_PER_ROD,
  HOME_CLUB_REFERRAL_PER_ROD,
  CLUB_COMMISSION_PER_ROD,
  STAFF_DISCOUNT_OWN_CLUB,
  STAFF_DISCOUNT_CROSS_CLUB,
  GUIDE_VERIFICATION_FEE_CENTS,
  DEFAULT_REFERRAL_REWARD,
} from "./fees";

// ─── Constants ──────────────────────────────────────────────────────

describe("Fee constants", () => {
  it("has platform fee rate of 15%", () => {
    expect(PLATFORM_FEE_RATE).toBe(0.15);
  });

  it("has guide service fee rate of 10%", () => {
    expect(GUIDE_SERVICE_FEE_RATE).toBe(0.10);
  });

  it("has membership processing fee rate of 3.5%", () => {
    expect(MEMBERSHIP_PROCESSING_FEE_RATE).toBe(0.035);
  });

  it("has cross-club fee of $25/rod", () => {
    expect(CROSS_CLUB_FEE_PER_ROD).toBe(25);
  });

  it("splits cross-club fee: $20 AP + $5 home club", () => {
    expect(ANGLERPASS_CROSS_CLUB_SHARE_PER_ROD).toBe(20);
    expect(HOME_CLUB_REFERRAL_PER_ROD).toBe(5);
    expect(ANGLERPASS_CROSS_CLUB_SHARE_PER_ROD + HOME_CLUB_REFERRAL_PER_ROD).toBe(CROSS_CLUB_FEE_PER_ROD);
  });

  it("has club commission of $5/rod", () => {
    expect(CLUB_COMMISSION_PER_ROD).toBe(5);
  });

  it("has staff discounts: 50% own club, 25% cross-club", () => {
    expect(STAFF_DISCOUNT_OWN_CLUB).toBe(50);
    expect(STAFF_DISCOUNT_CROSS_CLUB).toBe(25);
  });

  it("has guide verification fee of $49 (4900 cents)", () => {
    expect(GUIDE_VERIFICATION_FEE_CENTS).toBe(4900);
  });

  it("has default referral reward of $25", () => {
    expect(DEFAULT_REFERRAL_REWARD).toBe(25);
  });
});

// ─── Home-Club Booking (no cross-club) ──────────────────────────────

describe("calculateFeeBreakdown — home-club booking", () => {
  it("calculates 15% platform fee on $100 rod fee", () => {
    const result = calculateFeeBreakdown(100, 1, false);
    expect(result.baseRate).toBe(100);
    expect(result.platformFee).toBe(15);
  });

  it("calculates correct total for 1 rod, 1 day at $100", () => {
    const result = calculateFeeBreakdown(100, 1, false);
    // Total = base(100) + platform(15) + crossClub(0) + guide(0) + guideFee(0)
    expect(result.totalAmount).toBe(115);
  });

  it("calculates correct breakdown for 2 rods at $150/rod", () => {
    const result = calculateFeeBreakdown(150, 2, false);
    expect(result.baseRate).toBe(300);
    expect(result.platformFee).toBe(45); // 300 * 0.15
    expect(result.crossClubFee).toBe(0);
    expect(result.totalAmount).toBe(345);
  });

  it("handles multi-day bookings", () => {
    const result = calculateFeeBreakdown(100, 1, false, 0, 3);
    expect(result.numberOfDays).toBe(3);
    expect(result.baseRate).toBe(300); // 100 * 1 * 3
    expect(result.platformFee).toBe(45); // 300 * 0.15
    expect(result.totalAmount).toBe(345);
  });

  it("calculates landowner payout minus club commission", () => {
    const result = calculateFeeBreakdown(100, 2, false, 0, 1);
    expect(result.clubCommission).toBe(10); // $5/rod * 2 rods
    expect(result.landownerPayout).toBe(190); // 200 - 10
  });

  it("has zero cross-club fees for home-club booking", () => {
    const result = calculateFeeBreakdown(100, 1, false);
    expect(result.crossClubFee).toBe(0);
    expect(result.homeClubReferral).toBe(0);
    expect(result.isCrossClub).toBe(false);
  });
});

// ─── Cross-Club Booking ─────────────────────────────────────────────

describe("calculateFeeBreakdown — cross-club booking", () => {
  it("adds $25/rod cross-club fee", () => {
    const result = calculateFeeBreakdown(100, 1, true);
    expect(result.crossClubFee).toBe(25);
    expect(result.isCrossClub).toBe(true);
  });

  it("calculates home club referral from cross-club fee", () => {
    const result = calculateFeeBreakdown(100, 2, true);
    expect(result.crossClubFee).toBe(50); // $25 * 2 rods
    expect(result.homeClubReferral).toBe(10); // $5 * 2 rods
  });

  it("calculates correct total with cross-club fee", () => {
    const result = calculateFeeBreakdown(100, 1, true);
    // Total = base(100) + platform(15) + crossClub(25) + guide(0) + guideFee(0)
    expect(result.totalAmount).toBe(140);
  });

  it("scales cross-club fee across multiple days and rods", () => {
    const result = calculateFeeBreakdown(100, 2, true, 0, 3);
    expect(result.crossClubFee).toBe(150); // $25 * 2 rods * 3 days
    expect(result.homeClubReferral).toBe(30); // $5 * 2 rods * 3 days
  });

  it("calculates AP revenue including cross-club share", () => {
    const result = calculateFeeBreakdown(100, 1, true);
    // AP revenue = platformFee(15) + (crossClub(25) - homeClubRef(5)) + guideServiceFee(0)
    expect(result.anglerpassRevenue).toBe(35);
  });
});

// ─── Guide Fee Calculations ─────────────────────────────────────────

describe("calculateFeeBreakdown — with guide", () => {
  it("adds guide rate and 10% service fee to total", () => {
    const result = calculateFeeBreakdown(100, 1, false, 200);
    expect(result.guideRate).toBe(200);
    expect(result.guideServiceFee).toBe(20); // 200 * 0.10
    expect(result.guidePayout).toBe(200);
  });

  it("calculates correct total with guide fees", () => {
    const result = calculateFeeBreakdown(100, 1, false, 200);
    // Total = base(100) + platform(15) + crossClub(0) + guide(200) + guideServiceFee(20)
    expect(result.totalAmount).toBe(335);
  });

  it("scales guide rate across multiple days", () => {
    const result = calculateFeeBreakdown(100, 1, false, 300, 2);
    expect(result.guideRate).toBe(600); // 300 * 2 days
    expect(result.guideServiceFee).toBe(60); // 600 * 0.10
    expect(result.guidePayout).toBe(600);
  });

  it("includes guide service fee in AP revenue", () => {
    const result = calculateFeeBreakdown(100, 1, false, 200);
    // AP revenue = platformFee(15) + guideServiceFee(20)
    expect(result.anglerpassRevenue).toBe(35);
  });

  it("handles zero guide rate", () => {
    const result = calculateFeeBreakdown(100, 1, false, 0);
    expect(result.guideRate).toBe(0);
    expect(result.guideServiceFee).toBe(0);
    expect(result.guidePayout).toBe(0);
  });
});

// ─── Edge Cases ──────────────────────────────────────────────────────

describe("calculateFeeBreakdown — edge cases", () => {
  it("handles zero rod fee", () => {
    const result = calculateFeeBreakdown(0, 1, false);
    expect(result.baseRate).toBe(0);
    expect(result.platformFee).toBe(0);
    expect(result.totalAmount).toBe(0);
  });

  it("rounds to 2 decimal places for fractional amounts", () => {
    // $33.33/rod * 1 rod = $33.33 base
    // 15% platform fee = $5.00 (rounded from 4.9995)
    const result = calculateFeeBreakdown(33.33, 1, false);
    expect(result.baseRate).toBe(33.33);
    expect(result.platformFee).toBe(5); // Math.round(33.33 * 0.15 * 100) / 100
    expect(result.totalAmount).toBe(38.33);
  });

  it("floors numberOfDays to minimum of 1", () => {
    const result = calculateFeeBreakdown(100, 1, false, 0, 0);
    expect(result.numberOfDays).toBe(1);
    expect(result.baseRate).toBe(100);
  });

  it("floors fractional days", () => {
    const result = calculateFeeBreakdown(100, 1, false, 0, 2.7);
    expect(result.numberOfDays).toBe(2);
    expect(result.baseRate).toBe(200);
  });

  it("handles large bookings", () => {
    const result = calculateFeeBreakdown(500, 10, true, 600, 7);
    expect(result.baseRate).toBe(35000); // 500 * 10 * 7
    expect(result.platformFee).toBe(5250);
    expect(result.crossClubFee).toBe(1750); // 25 * 10 * 7
    expect(result.guideRate).toBe(4200); // 600 * 7
    expect(result.guideServiceFee).toBe(420);
    expect(result.totalAmount).toBe(46620);
  });

  it("defaults isCrossClub to false", () => {
    const result = calculateFeeBreakdown(100, 1);
    expect(result.isCrossClub).toBe(false);
    expect(result.crossClubFee).toBe(0);
  });

  it("defaults numberOfDays to 1", () => {
    const result = calculateFeeBreakdown(100, 1, false, 0);
    expect(result.numberOfDays).toBe(1);
  });
});

// ─── Payout Splits ──────────────────────────────────────────────────

describe("calculateFeeBreakdown — payout splits", () => {
  it("returns all payout fields for a complex booking", () => {
    const result = calculateFeeBreakdown(200, 3, true, 400, 2);

    // baseRate = 200 * 3 * 2 = 1200
    expect(result.baseRate).toBe(1200);
    // platformFee = 1200 * 0.15 = 180
    expect(result.platformFee).toBe(180);
    // crossClubFee = 25 * 3 * 2 = 150
    expect(result.crossClubFee).toBe(150);
    // homeClubReferral = 5 * 3 * 2 = 30
    expect(result.homeClubReferral).toBe(30);
    // guideRate = 400 * 2 = 800
    expect(result.guideRate).toBe(800);
    // guideServiceFee = 800 * 0.10 = 80
    expect(result.guideServiceFee).toBe(80);
    // guidePayout = 800
    expect(result.guidePayout).toBe(800);
    // clubCommission = 5 * 3 * 2 = 30
    expect(result.clubCommission).toBe(30);
    // landownerPayout = 1200 - 30 = 1170
    expect(result.landownerPayout).toBe(1170);
    // anglerpassRevenue = 180 + (150-30) + 80 = 380
    expect(result.anglerpassRevenue).toBe(380);
    // totalAmount = 1200 + 180 + 150 + 800 + 80 = 2410
    expect(result.totalAmount).toBe(2410);
  });
});
