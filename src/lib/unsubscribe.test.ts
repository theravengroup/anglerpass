import { describe, it, expect } from "vitest";
import {
  generateUnsubscribeToken,
  verifyUnsubscribeToken,
  getUnsubscribeUrl,
} from "./unsubscribe";

describe("generateUnsubscribeToken", () => {
  it("produces a token with dot separator", () => {
    const token = generateUnsubscribeToken("user-123");
    expect(token).toContain(".");
  });

  it("produces deterministic tokens for same userId", () => {
    const t1 = generateUnsubscribeToken("user-abc");
    const t2 = generateUnsubscribeToken("user-abc");
    expect(t1).toBe(t2);
  });

  it("produces different tokens for different userIds", () => {
    const t1 = generateUnsubscribeToken("user-a");
    const t2 = generateUnsubscribeToken("user-b");
    expect(t1).not.toBe(t2);
  });

  it("encodes the userId in the first segment", () => {
    const token = generateUnsubscribeToken("user-123");
    const encodedId = token.split(".")[0];
    const decoded = Buffer.from(encodedId, "base64url").toString("utf8");
    expect(decoded).toBe("user-123");
  });
});

describe("verifyUnsubscribeToken", () => {
  it("returns userId for a valid token", () => {
    const token = generateUnsubscribeToken("user-xyz");
    const result = verifyUnsubscribeToken(token);
    expect(result).toBe("user-xyz");
  });

  it("returns null for a tampered signature", () => {
    const token = generateUnsubscribeToken("user-xyz");
    const [encodedId] = token.split(".");
    const tampered = `${encodedId}.invalid-signature`;
    expect(verifyUnsubscribeToken(tampered)).toBeNull();
  });

  it("returns null for a tampered userId", () => {
    const token = generateUnsubscribeToken("user-xyz");
    const [, signature] = token.split(".");
    const fakeId = Buffer.from("hacker").toString("base64url");
    expect(verifyUnsubscribeToken(`${fakeId}.${signature}`)).toBeNull();
  });

  it("returns null for token without dot separator", () => {
    expect(verifyUnsubscribeToken("nodot")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(verifyUnsubscribeToken("")).toBeNull();
  });

  it("returns null for malformed base64", () => {
    expect(verifyUnsubscribeToken("!!!.!!!")).toBeNull();
  });

  it("handles UUID-style userIds", () => {
    const uuid = "550e8400-e29b-41d4-a716-446655440000";
    const token = generateUnsubscribeToken(uuid);
    expect(verifyUnsubscribeToken(token)).toBe(uuid);
  });

  it("round-trips an empty string userId", () => {
    const token = generateUnsubscribeToken("");
    expect(verifyUnsubscribeToken(token)).toBe("");
  });

  it("round-trips a userId with special characters", () => {
    const userId = "user+foo@bar.com/baz";
    const token = generateUnsubscribeToken(userId);
    expect(verifyUnsubscribeToken(token)).toBe(userId);
  });
});

describe("getUnsubscribeUrl", () => {
  it("returns URL with token query parameter", () => {
    const url = getUnsubscribeUrl("user-123");
    expect(url).toContain("/api/notifications/unsubscribe?token=");
  });

  it("includes a verifiable token in the URL", () => {
    const url = getUnsubscribeUrl("user-456");
    const token = url.split("token=")[1];
    expect(verifyUnsubscribeToken(token)).toBe("user-456");
  });
});
