import { describe, it, expect } from "vitest";
import { markReadSchema } from "./notifications";

const UUID = "550e8400-e29b-41d4-a716-446655440000";
const UUID2 = "550e8400-e29b-41d4-a716-446655440001";

describe("markReadSchema", () => {
  it("accepts mark_all_read", () => {
    const result = markReadSchema.safeParse({ mark_all_read: true });
    expect(result.success).toBe(true);
  });

  it("accepts single id", () => {
    const result = markReadSchema.safeParse({ id: UUID });
    expect(result.success).toBe(true);
  });

  it("accepts ids array", () => {
    const result = markReadSchema.safeParse({ ids: [UUID, UUID2] });
    expect(result.success).toBe(true);
  });

  it("rejects empty object (no option provided)", () => {
    const result = markReadSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects empty ids array", () => {
    const result = markReadSchema.safeParse({ ids: [] });
    expect(result.success).toBe(false);
  });

  it("rejects non-UUID id", () => {
    const result = markReadSchema.safeParse({ id: "not-a-uuid" });
    expect(result.success).toBe(false);
  });

  it("rejects ids array over 100 items", () => {
    const ids = Array.from({ length: 101 }, () => UUID);
    const result = markReadSchema.safeParse({ ids });
    expect(result.success).toBe(false);
  });

  it("rejects non-UUID inside ids array", () => {
    const result = markReadSchema.safeParse({ ids: ["not-uuid"] });
    expect(result.success).toBe(false);
  });
});
