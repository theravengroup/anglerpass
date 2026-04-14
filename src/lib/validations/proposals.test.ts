import { describe, it, expect } from "vitest";
import {
  createProposalSchema,
  saveDraftProposalSchema,
  sendProposalSchema,
  cancelProposalSchema,
  proposalResponseSchema,
  anglerSearchSchema,
  PROPOSAL_STATUSES,
  INVITEE_STATUSES,
} from "./proposals";

const UUID = "550e8400-e29b-41d4-a716-446655440000";
const UUID2 = "550e8400-e29b-41d4-a716-446655440001";

describe("PROPOSAL_STATUSES", () => {
  it("has 6 statuses", () => {
    expect(PROPOSAL_STATUSES).toHaveLength(6);
    expect(PROPOSAL_STATUSES).toContain("draft");
    expect(PROPOSAL_STATUSES).toContain("sent");
    expect(PROPOSAL_STATUSES).toContain("expired");
  });
});

describe("INVITEE_STATUSES", () => {
  it("has 3 statuses", () => {
    expect(INVITEE_STATUSES).toHaveLength(3);
  });
});

describe("createProposalSchema", () => {
  const valid = {
    property_id: UUID,
    proposed_date: "2026-07-15",
    start_time: "08:00",
    duration_hours: 4,
    max_anglers: 2,
    guide_fee_per_angler: 150,
    invitee_ids: [UUID2],
  };

  it("accepts valid proposal", () => {
    const result = createProposalSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("accepts optional notes", () => {
    const result = createProposalSchema.safeParse({ ...valid, notes: "Bring waders" });
    expect(result.success).toBe(true);
  });

  it("accepts empty string notes", () => {
    const result = createProposalSchema.safeParse({ ...valid, notes: "" });
    expect(result.success).toBe(true);
  });

  it("rejects missing property_id", () => {
    const { property_id, ...rest } = valid;
    const result = createProposalSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects non-UUID property_id", () => {
    const result = createProposalSchema.safeParse({ ...valid, property_id: "bad" });
    expect(result.success).toBe(false);
  });

  it("rejects missing proposed_date", () => {
    const { proposed_date, ...rest } = valid;
    const result = createProposalSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects empty proposed_date", () => {
    const result = createProposalSchema.safeParse({ ...valid, proposed_date: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing start_time", () => {
    const { start_time, ...rest } = valid;
    const result = createProposalSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects duration_hours exceeding 16", () => {
    const result = createProposalSchema.safeParse({ ...valid, duration_hours: 17 });
    expect(result.success).toBe(false);
  });

  it("rejects duration_hours less than 1", () => {
    const result = createProposalSchema.safeParse({ ...valid, duration_hours: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects max_anglers exceeding 20", () => {
    const result = createProposalSchema.safeParse({ ...valid, max_anglers: 21 });
    expect(result.success).toBe(false);
  });

  it("rejects negative guide_fee_per_angler", () => {
    const result = createProposalSchema.safeParse({ ...valid, guide_fee_per_angler: -10 });
    expect(result.success).toBe(false);
  });

  it("rejects empty invitee_ids array", () => {
    const result = createProposalSchema.safeParse({ ...valid, invitee_ids: [] });
    expect(result.success).toBe(false);
  });

  it("rejects notes over 2000 characters", () => {
    const result = createProposalSchema.safeParse({ ...valid, notes: "x".repeat(2001) });
    expect(result.success).toBe(false);
  });
});

describe("saveDraftProposalSchema", () => {
  it("accepts empty object (all optional)", () => {
    const result = saveDraftProposalSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts partial data", () => {
    const result = saveDraftProposalSchema.safeParse({ property_id: UUID });
    expect(result.success).toBe(true);
  });
});

describe("sendProposalSchema", () => {
  it("accepts action send", () => {
    const result = sendProposalSchema.safeParse({ action: "send" });
    expect(result.success).toBe(true);
  });

  it("rejects other action", () => {
    const result = sendProposalSchema.safeParse({ action: "cancel" });
    expect(result.success).toBe(false);
  });
});

describe("cancelProposalSchema", () => {
  it("accepts action cancel", () => {
    const result = cancelProposalSchema.safeParse({ action: "cancel" });
    expect(result.success).toBe(true);
  });
});

describe("proposalResponseSchema", () => {
  it("accepts accepted", () => {
    const result = proposalResponseSchema.safeParse({ response: "accepted" });
    expect(result.success).toBe(true);
  });

  it("accepts declined", () => {
    const result = proposalResponseSchema.safeParse({ response: "declined" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid response", () => {
    const result = proposalResponseSchema.safeParse({ response: "maybe" });
    expect(result.success).toBe(false);
  });
});

describe("anglerSearchSchema", () => {
  it("accepts valid query", () => {
    const result = anglerSearchSchema.safeParse({ query: "john" });
    expect(result.success).toBe(true);
  });

  it("rejects empty query", () => {
    const result = anglerSearchSchema.safeParse({ query: "" });
    expect(result.success).toBe(false);
  });

  it("rejects query over 200 characters", () => {
    const result = anglerSearchSchema.safeParse({ query: "x".repeat(201) });
    expect(result.success).toBe(false);
  });
});
