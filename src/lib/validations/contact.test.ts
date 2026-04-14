import { describe, it, expect } from "vitest";
import { contactSchema, CONTACT_DEPARTMENTS } from "./contact";

describe("CONTACT_DEPARTMENTS", () => {
  it("has 4 departments", () => {
    expect(CONTACT_DEPARTMENTS).toHaveLength(4);
  });

  it("each department has value, label, and email", () => {
    for (const dept of CONTACT_DEPARTMENTS) {
      expect(dept).toHaveProperty("value");
      expect(dept).toHaveProperty("label");
      expect(dept).toHaveProperty("email");
      expect(dept.email).toContain("@anglerpass.com");
    }
  });
});

describe("contactSchema", () => {
  const validContact = {
    name: "Jane Smith",
    email: "jane@example.com",
    department: "general" as const,
    message: "I have a question about private water access.",
  };

  it("accepts valid contact data", () => {
    const result = contactSchema.safeParse(validContact);
    expect(result.success).toBe(true);
  });

  it("accepts all valid department values", () => {
    for (const dept of ["general", "investors", "partners", "press"] as const) {
      const result = contactSchema.safeParse({ ...validContact, department: dept });
      expect(result.success).toBe(true);
    }
  });

  it("rejects missing name", () => {
    const { name, ...rest } = validContact;
    const result = contactSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = contactSchema.safeParse({ ...validContact, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing email", () => {
    const { email, ...rest } = validContact;
    const result = contactSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = contactSchema.safeParse({ ...validContact, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects missing department", () => {
    const { department, ...rest } = validContact;
    const result = contactSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects invalid department enum value", () => {
    const result = contactSchema.safeParse({ ...validContact, department: "sales" });
    expect(result.success).toBe(false);
  });

  it("rejects missing message", () => {
    const { message, ...rest } = validContact;
    const result = contactSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects message shorter than 10 characters", () => {
    const result = contactSchema.safeParse({ ...validContact, message: "Hi" });
    expect(result.success).toBe(false);
  });

  it("accepts message exactly 10 characters", () => {
    const result = contactSchema.safeParse({ ...validContact, message: "0123456789" });
    expect(result.success).toBe(true);
  });
});
