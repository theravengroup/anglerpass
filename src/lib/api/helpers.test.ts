import { describe, it, expect } from "vitest";
import { escapeIlike } from "./helpers";

/**
 * Note: Most functions in helpers.ts (requireAuth, requireAdmin, etc.)
 * depend on Supabase and are not pure functions. We only test the pure
 * utility functions here.
 */

describe("escapeIlike", () => {
  it("escapes percent wildcard", () => {
    expect(escapeIlike("100%")).toBe("100\\%");
  });

  it("escapes underscore wildcard", () => {
    expect(escapeIlike("user_name")).toBe("user\\_name");
  });

  it("escapes backslash", () => {
    expect(escapeIlike("path\\to")).toBe("path\\\\to");
  });

  it("escapes multiple special characters", () => {
    expect(escapeIlike("50%_off\\deal")).toBe("50\\%\\_off\\\\deal");
  });

  it("leaves normal text unchanged", () => {
    expect(escapeIlike("normal search")).toBe("normal search");
  });

  it("handles empty string", () => {
    expect(escapeIlike("")).toBe("");
  });

  it("handles string with no special characters", () => {
    expect(escapeIlike("Rainbow Trout")).toBe("Rainbow Trout");
  });
});
