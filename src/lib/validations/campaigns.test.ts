import { describe, it, expect } from "vitest";
import {
  createSegmentSchema,
  updateSegmentSchema,
  createCampaignSchema,
  updateCampaignSchema,
  createStepSchema,
  updateStepSchema,
  segmentPreviewSchema,
  testSendSchema,
} from "./campaigns";

const UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("createSegmentSchema", () => {
  const validSegment = {
    name: "Active Anglers",
    rules: [
      {
        match: "all" as const,
        conditions: [{ field: "role" as const, op: "eq" as const, value: "angler" }],
      },
    ],
  };

  it("accepts valid segment", () => {
    const result = createSegmentSchema.safeParse(validSegment);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.is_dynamic).toBe(true);
      expect(result.data.include_leads).toBe(false);
    }
  });

  it("accepts optional description", () => {
    const result = createSegmentSchema.safeParse({ ...validSegment, description: "Active users" });
    expect(result.success).toBe(true);
  });

  it("rejects missing name", () => {
    const { name, ...rest } = validSegment;
    const result = createSegmentSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects empty rules array", () => {
    const result = createSegmentSchema.safeParse({ ...validSegment, rules: [] });
    expect(result.success).toBe(false);
  });

  it("rejects rule group with empty conditions", () => {
    const result = createSegmentSchema.safeParse({
      ...validSegment,
      rules: [{ match: "all", conditions: [] }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid field in condition", () => {
    const result = createSegmentSchema.safeParse({
      ...validSegment,
      rules: [
        { match: "all", conditions: [{ field: "invalid_field", op: "eq", value: "x" }] },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid operator in condition", () => {
    const result = createSegmentSchema.safeParse({
      ...validSegment,
      rules: [
        { match: "all", conditions: [{ field: "role", op: "like", value: "x" }] },
      ],
    });
    expect(result.success).toBe(false);
  });
});

describe("updateSegmentSchema", () => {
  it("accepts empty object (all partial)", () => {
    const result = updateSegmentSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts partial update", () => {
    const result = updateSegmentSchema.safeParse({ name: "Updated Name" });
    expect(result.success).toBe(true);
  });
});

describe("createCampaignSchema", () => {
  const validCampaign = {
    name: "Welcome Series",
    type: "broadcast" as const,
  };

  it("accepts valid broadcast campaign", () => {
    const result = createCampaignSchema.safeParse(validCampaign);
    expect(result.success).toBe(true);
  });

  it("accepts drip campaign", () => {
    const result = createCampaignSchema.safeParse({ ...validCampaign, type: "drip" });
    expect(result.success).toBe(true);
  });

  it("accepts triggered campaign with trigger_event", () => {
    const result = createCampaignSchema.safeParse({
      ...validCampaign,
      type: "triggered",
      trigger_event: "user_signup",
    });
    expect(result.success).toBe(true);
  });

  it("rejects triggered campaign without trigger_event", () => {
    const result = createCampaignSchema.safeParse({
      ...validCampaign,
      type: "triggered",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing name", () => {
    const result = createCampaignSchema.safeParse({ type: "broadcast" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid type", () => {
    const result = createCampaignSchema.safeParse({ ...validCampaign, type: "newsletter" });
    expect(result.success).toBe(false);
  });

  it("accepts optional fields", () => {
    const result = createCampaignSchema.safeParse({
      ...validCampaign,
      description: "A welcome campaign",
      reply_to: "support@anglerpass.com",
      segment_id: UUID,
      topic_id: UUID,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid from_email", () => {
    const result = createCampaignSchema.safeParse({
      ...validCampaign,
      from_email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateCampaignSchema", () => {
  it("accepts empty object", () => {
    const result = updateCampaignSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts partial update", () => {
    const result = updateCampaignSchema.safeParse({ name: "New Name" });
    expect(result.success).toBe(true);
  });

  it("accepts nullable segment_id", () => {
    const result = updateCampaignSchema.safeParse({ segment_id: null });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email for from_email", () => {
    const result = updateCampaignSchema.safeParse({ from_email: "bad" });
    expect(result.success).toBe(false);
  });
});

describe("createStepSchema", () => {
  const validStep = {
    step_order: 1,
    subject: "Welcome to AnglerPass",
    html_body: "<h1>Welcome</h1>",
  };

  it("accepts valid step", () => {
    const result = createStepSchema.safeParse(validStep);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.delay_minutes).toBe(0);
    }
  });

  it("accepts optional fields", () => {
    const result = createStepSchema.safeParse({
      ...validStep,
      plain_body: "Welcome",
      delay_minutes: 60,
      cta_label: "Get Started",
      cta_url: "https://anglerpass.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejects step_order less than 1", () => {
    const result = createStepSchema.safeParse({ ...validStep, step_order: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects empty subject", () => {
    const result = createStepSchema.safeParse({ ...validStep, subject: "" });
    expect(result.success).toBe(false);
  });

  it("rejects empty html_body", () => {
    const result = createStepSchema.safeParse({ ...validStep, html_body: "" });
    expect(result.success).toBe(false);
  });

  it("rejects negative delay_minutes", () => {
    const result = createStepSchema.safeParse({ ...validStep, delay_minutes: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects invalid cta_url", () => {
    const result = createStepSchema.safeParse({ ...validStep, cta_url: "not-a-url" });
    expect(result.success).toBe(false);
  });
});

describe("updateStepSchema", () => {
  it("accepts empty object", () => {
    const result = updateStepSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts partial update", () => {
    const result = updateStepSchema.safeParse({ subject: "New subject" });
    expect(result.success).toBe(true);
  });

  it("does not accept step_order (omitted)", () => {
    const result = updateStepSchema.safeParse({ step_order: 2 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty("step_order");
    }
  });
});

describe("segmentPreviewSchema", () => {
  it("accepts valid rules", () => {
    const result = segmentPreviewSchema.safeParse({
      rules: [
        { match: "any", conditions: [{ field: "role", op: "eq", value: "angler" }] },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty rules", () => {
    const result = segmentPreviewSchema.safeParse({ rules: [] });
    expect(result.success).toBe(false);
  });
});

describe("testSendSchema", () => {
  it("accepts valid email", () => {
    const result = testSendSchema.safeParse({ email: "test@example.com" });
    expect(result.success).toBe(true);
  });

  it("accepts optional step_id", () => {
    const result = testSendSchema.safeParse({ email: "test@example.com", step_id: UUID });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = testSendSchema.safeParse({ email: "bad" });
    expect(result.success).toBe(false);
  });

  it("rejects non-UUID step_id", () => {
    const result = testSendSchema.safeParse({ email: "test@example.com", step_id: "bad" });
    expect(result.success).toBe(false);
  });
});
