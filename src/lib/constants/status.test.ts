import { describe, it, expect } from "vitest";
import {
  BOOKING_STATUS,
  STATUS_BADGE_COLORS,
  MEMBERSHIP_STATUS,
  GUIDE_STATUS,
  PROPERTY_STATUS,
  TRIP_REVIEW_STATUS,
  PROPOSAL_STATUS,
  AFFILIATION_STATUS,
  REFERRAL_CREDIT_STATUS,
  ROLE_LABELS,
  ROLE_BADGE_COLORS,
  VALID_ROLES,
  PERIOD_OPTIONS,
  type StatusConfig,
} from "./status";

function validateStatusConfigs(
  configs: Record<string, StatusConfig>,
  name: string
) {
  describe(`${name}`, () => {
    it("has at least one status entry", () => {
      expect(Object.keys(configs).length).toBeGreaterThan(0);
    });

    for (const [key, config] of Object.entries(configs)) {
      it(`"${key}" has required label, icon, color, bg`, () => {
        expect(config.label).toBeTruthy();
        expect(typeof config.label).toBe("string");
        expect(config.icon).toBeTruthy();
        expect(config.color).toBeTruthy();
        expect(config.bg).toBeTruthy();
      });
    }
  });
}

validateStatusConfigs(BOOKING_STATUS, "BOOKING_STATUS");
validateStatusConfigs(MEMBERSHIP_STATUS, "MEMBERSHIP_STATUS");
validateStatusConfigs(GUIDE_STATUS, "GUIDE_STATUS");
validateStatusConfigs(PROPERTY_STATUS, "PROPERTY_STATUS");
validateStatusConfigs(TRIP_REVIEW_STATUS, "TRIP_REVIEW_STATUS");
validateStatusConfigs(PROPOSAL_STATUS, "PROPOSAL_STATUS");
validateStatusConfigs(AFFILIATION_STATUS, "AFFILIATION_STATUS");
validateStatusConfigs(REFERRAL_CREDIT_STATUS, "REFERRAL_CREDIT_STATUS");

describe("STATUS_BADGE_COLORS", () => {
  it("has entries for all booking statuses", () => {
    for (const key of Object.keys(BOOKING_STATUS)) {
      expect(STATUS_BADGE_COLORS[key]).toBeTruthy();
    }
  });
});

describe("ROLE_LABELS", () => {
  it("has labels for all valid roles", () => {
    for (const role of VALID_ROLES) {
      expect(ROLE_LABELS[role]).toBeTruthy();
    }
  });
});

describe("ROLE_BADGE_COLORS", () => {
  it("has colors for all valid roles", () => {
    for (const role of VALID_ROLES) {
      expect(ROLE_BADGE_COLORS[role]).toBeTruthy();
    }
  });
});

describe("VALID_ROLES", () => {
  it("includes expected roles", () => {
    expect(VALID_ROLES).toContain("angler");
    expect(VALID_ROLES).toContain("landowner");
    expect(VALID_ROLES).toContain("club_admin");
    expect(VALID_ROLES).toContain("admin");
    expect(VALID_ROLES).toContain("guide");
  });
});

describe("PERIOD_OPTIONS", () => {
  it("has 4 options", () => {
    expect(PERIOD_OPTIONS).toHaveLength(4);
  });

  it("each option has label and value", () => {
    for (const option of PERIOD_OPTIONS) {
      expect(option.label).toBeTruthy();
      expect(option.value).toBeGreaterThan(0);
    }
  });

  it("options are in ascending order by value", () => {
    for (let i = 1; i < PERIOD_OPTIONS.length; i++) {
      expect(PERIOD_OPTIONS[i].value).toBeGreaterThan(PERIOD_OPTIONS[i - 1].value);
    }
  });
});
