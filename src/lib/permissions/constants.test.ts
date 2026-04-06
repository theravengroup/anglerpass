import { describe, it, expect } from "vitest";
import {
  P,
  PLATFORM_ROLES,
  PLATFORM_ROLE_LABELS,
  PLATFORM_ROLE_DESCRIPTIONS,
  CLUB_ROLES,
  CLUB_ROLE_LABELS,
  CLUB_ROLE_DESCRIPTIONS,
  CLUB_ROLE_HIERARCHY,
  CLUB_STAFF_ROLES,
  ASSIGNABLE_CLUB_ROLES,
  DELEGATE_LEVELS,
  DELEGATE_LEVEL_LABELS,
  DELEGATE_LEVEL_DESCRIPTIONS,
} from "./constants";

describe("Permission IDs (P)", () => {
  it("has unique permission IDs", () => {
    const values = Object.values(P);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });

  it("uses dot-notation format for all permission IDs", () => {
    for (const value of Object.values(P)) {
      expect(value).toMatch(/^[a-z]+\.[a-z_]+$/);
    }
  });

  it("includes key permission categories", () => {
    const prefixes = new Set(Object.values(P).map((v) => v.split(".")[0]));
    expect(prefixes.has("booking")).toBe(true);
    expect(prefixes.has("profile")).toBe(true);
    expect(prefixes.has("club")).toBe(true);
    expect(prefixes.has("financial")).toBe(true);
    expect(prefixes.has("system")).toBe(true);
  });
});

describe("Platform roles", () => {
  it("has 6 platform roles", () => {
    expect(PLATFORM_ROLES).toHaveLength(6);
  });

  it("has labels for all platform roles", () => {
    for (const role of PLATFORM_ROLES) {
      expect(PLATFORM_ROLE_LABELS[role]).toBeTruthy();
    }
  });

  it("has descriptions for all platform roles", () => {
    for (const role of PLATFORM_ROLES) {
      expect(PLATFORM_ROLE_DESCRIPTIONS[role]).toBeTruthy();
    }
  });

  it("includes super_admin as highest role", () => {
    expect(PLATFORM_ROLES).toContain("super_admin");
  });
});

describe("Club roles", () => {
  it("has 9 club roles", () => {
    expect(CLUB_ROLES).toHaveLength(9);
  });

  it("has labels for all club roles", () => {
    for (const role of CLUB_ROLES) {
      expect(CLUB_ROLE_LABELS[role]).toBeTruthy();
    }
  });

  it("has descriptions for all club roles", () => {
    for (const role of CLUB_ROLES) {
      expect(CLUB_ROLE_DESCRIPTIONS[role]).toBeTruthy();
    }
  });

  it("has hierarchy values for all club roles", () => {
    for (const role of CLUB_ROLES) {
      expect(typeof CLUB_ROLE_HIERARCHY[role]).toBe("number");
    }
  });

  it("owner and admin have highest hierarchy value", () => {
    const ownerLevel = CLUB_ROLE_HIERARCHY.owner;
    const adminLevel = CLUB_ROLE_HIERARCHY.admin;
    expect(ownerLevel).toBe(adminLevel);

    for (const role of CLUB_ROLES) {
      if (role !== "owner" && role !== "admin") {
        expect(CLUB_ROLE_HIERARCHY[role]).toBeLessThanOrEqual(ownerLevel);
      }
    }
  });

  it("member has lowest hierarchy value (0)", () => {
    expect(CLUB_ROLE_HIERARCHY.member).toBe(0);
  });

  it("staff roles do not include member", () => {
    expect(CLUB_STAFF_ROLES).not.toContain("member");
  });

  it("staff roles include owner", () => {
    expect(CLUB_STAFF_ROLES).toContain("owner");
  });

  it("assignable roles do not include owner or member", () => {
    expect(ASSIGNABLE_CLUB_ROLES).not.toContain("owner");
    expect(ASSIGNABLE_CLUB_ROLES).not.toContain("admin");
    expect(ASSIGNABLE_CLUB_ROLES).not.toContain("member");
  });

  it("all assignable roles are staff roles", () => {
    for (const role of ASSIGNABLE_CLUB_ROLES) {
      expect(CLUB_STAFF_ROLES).toContain(role);
    }
  });
});

describe("Delegate levels", () => {
  it("has 2 delegate levels", () => {
    expect(DELEGATE_LEVELS).toHaveLength(2);
  });

  it("has labels for all delegate levels", () => {
    for (const level of DELEGATE_LEVELS) {
      expect(DELEGATE_LEVEL_LABELS[level]).toBeTruthy();
    }
  });

  it("has descriptions for all delegate levels", () => {
    for (const level of DELEGATE_LEVELS) {
      expect(DELEGATE_LEVEL_DESCRIPTIONS[level]).toBeTruthy();
    }
  });
});
