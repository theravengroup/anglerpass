import { describe, it, expect } from "vitest";
import {
  documentTemplateSchema,
  signDocumentSchema,
  substituteVariables,
} from "./documents";

const UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("documentTemplateSchema", () => {
  const valid = {
    title: "Liability Waiver",
    body: "This is a document body that is at least twenty characters long.",
  };

  it("accepts valid template with defaults", () => {
    const result = documentTemplateSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.required).toBe(true);
      expect(result.data.active).toBe(true);
      expect(result.data.sort_order).toBe(0);
    }
  });

  it("accepts explicit boolean and sort_order values", () => {
    const result = documentTemplateSchema.safeParse({
      ...valid,
      required: false,
      active: false,
      sort_order: 5,
    });
    expect(result.success).toBe(true);
  });

  it("rejects title under 3 characters", () => {
    const result = documentTemplateSchema.safeParse({ ...valid, title: "AB" });
    expect(result.success).toBe(false);
  });

  it("rejects title over 200 characters", () => {
    const result = documentTemplateSchema.safeParse({ ...valid, title: "x".repeat(201) });
    expect(result.success).toBe(false);
  });

  it("rejects body under 20 characters", () => {
    const result = documentTemplateSchema.safeParse({ ...valid, body: "Too short" });
    expect(result.success).toBe(false);
  });

  it("rejects body over 50000 characters", () => {
    const result = documentTemplateSchema.safeParse({ ...valid, body: "x".repeat(50001) });
    expect(result.success).toBe(false);
  });

  it("rejects negative sort_order", () => {
    const result = documentTemplateSchema.safeParse({ ...valid, sort_order: -1 });
    expect(result.success).toBe(false);
  });
});

describe("signDocumentSchema", () => {
  const valid = {
    template_id: UUID,
    booking_id: UUID,
    signer_name: "John Doe",
    agreed: true as const,
  };

  it("accepts valid signature", () => {
    const result = signDocumentSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects agreed = false", () => {
    const result = signDocumentSchema.safeParse({ ...valid, agreed: false });
    expect(result.success).toBe(false);
  });

  it("rejects signer_name under 2 characters", () => {
    const result = signDocumentSchema.safeParse({ ...valid, signer_name: "J" });
    expect(result.success).toBe(false);
  });

  it("rejects signer_name over 200 characters", () => {
    const result = signDocumentSchema.safeParse({ ...valid, signer_name: "x".repeat(201) });
    expect(result.success).toBe(false);
  });

  it("rejects non-UUID template_id", () => {
    const result = signDocumentSchema.safeParse({ ...valid, template_id: "bad" });
    expect(result.success).toBe(false);
  });

  it("rejects non-UUID booking_id", () => {
    const result = signDocumentSchema.safeParse({ ...valid, booking_id: "bad" });
    expect(result.success).toBe(false);
  });
});

describe("substituteVariables", () => {
  it("replaces known variables", () => {
    const result = substituteVariables("Hello {{angler_name}}", { angler_name: "John" });
    expect(result).toBe("Hello John");
  });

  it("leaves unknown variables unchanged", () => {
    const result = substituteVariables("Hello {{unknown}}", {});
    expect(result).toBe("Hello {{unknown}}");
  });

  it("replaces multiple variables", () => {
    const result = substituteVariables(
      "{{angler_name}} at {{property_name}}",
      { angler_name: "Jane", property_name: "Blue River Ranch" }
    );
    expect(result).toBe("Jane at Blue River Ranch");
  });
});
