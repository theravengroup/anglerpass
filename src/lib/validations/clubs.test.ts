import { describe, it, expect } from "vitest";
import {
  clubSchema,
  clubMemberInviteSchema,
  clubMemberStatusSchema,
  clubPropertyAccessSchema,
  corporateSettingsSchema,
  corporateInviteSchema,
  proposeAgreementSchema,
  agreementActionSchema,
  referralSettingsSchema,
  referralInviteSchema,
  clubJoinSchema,
  clubInviteSchema,
  corporateJoinSchema,
  corporateEmployeeJoinSchema,
  createStaffNoteSchema,
  bulkMemberInviteSchema,
  applicationReviewSchema,
  MAX_BULK_INVITE_EMAILS,
  SUBSCRIPTION_TIERS,
  MEMBERSHIP_STATUSES,
  MEMBERSHIP_ROLES,
} from "./clubs";

const UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("clubs constants", () => {
  it("has 3 subscription tiers", () => {
    expect(SUBSCRIPTION_TIERS).toHaveLength(3);
  });

  it("has 4 membership statuses", () => {
    expect(MEMBERSHIP_STATUSES).toHaveLength(4);
  });

  it("has 3 membership roles", () => {
    expect(MEMBERSHIP_ROLES).toHaveLength(3);
  });
});

describe("clubSchema", () => {
  it("accepts valid club with name only", () => {
    const result = clubSchema.safeParse({ name: "River Bend Club" });
    expect(result.success).toBe(true);
  });

  it("accepts all optional fields", () => {
    const result = clubSchema.safeParse({
      name: "River Bend Club",
      description: "A fishing club",
      location: "Montana",
      rules: "Catch and release only",
      website: "https://riverbend.com",
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty string for optional fields", () => {
    const result = clubSchema.safeParse({
      name: "Club",
      description: "",
      location: "",
      rules: "",
      website: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing name", () => {
    const result = clubSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = clubSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects name over 200 characters", () => {
    const result = clubSchema.safeParse({ name: "x".repeat(201) });
    expect(result.success).toBe(false);
  });

  it("rejects invalid website URL", () => {
    const result = clubSchema.safeParse({ name: "Club", website: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("rejects description over 5000 characters", () => {
    const result = clubSchema.safeParse({ name: "Club", description: "x".repeat(5001) });
    expect(result.success).toBe(false);
  });
});

describe("clubMemberInviteSchema", () => {
  it("accepts valid email with default role", () => {
    const result = clubMemberInviteSchema.safeParse({ email: "test@example.com" });
    expect(result.success).toBe(true);
  });

  it("accepts all role values", () => {
    for (const role of ["admin", "staff", "member"] as const) {
      const result = clubMemberInviteSchema.safeParse({ email: "a@b.com", role });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid email", () => {
    const result = clubMemberInviteSchema.safeParse({ email: "bad" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid role", () => {
    const result = clubMemberInviteSchema.safeParse({ email: "a@b.com", role: "owner" });
    expect(result.success).toBe(false);
  });
});

describe("clubMemberStatusSchema", () => {
  it("accepts valid status", () => {
    const result = clubMemberStatusSchema.safeParse({ status: "active" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid status", () => {
    const result = clubMemberStatusSchema.safeParse({ status: "banned" });
    expect(result.success).toBe(false);
  });

  it("accepts optional decline_reason", () => {
    const result = clubMemberStatusSchema.safeParse({
      status: "declined",
      decline_reason: "Did not meet criteria",
    });
    expect(result.success).toBe(true);
  });
});

describe("clubPropertyAccessSchema", () => {
  it("accepts approved", () => {
    const result = clubPropertyAccessSchema.safeParse({ status: "approved" });
    expect(result.success).toBe(true);
  });

  it("accepts declined", () => {
    const result = clubPropertyAccessSchema.safeParse({ status: "declined" });
    expect(result.success).toBe(true);
  });

  it("rejects pending", () => {
    const result = clubPropertyAccessSchema.safeParse({ status: "pending" });
    expect(result.success).toBe(false);
  });
});

describe("corporateSettingsSchema", () => {
  it("accepts valid settings", () => {
    const result = corporateSettingsSchema.safeParse({
      corporate_memberships_enabled: true,
      corporate_initiation_fee: 500,
    });
    expect(result.success).toBe(true);
  });

  it("accepts null fee", () => {
    const result = corporateSettingsSchema.safeParse({
      corporate_memberships_enabled: false,
      corporate_initiation_fee: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative fee", () => {
    const result = corporateSettingsSchema.safeParse({
      corporate_memberships_enabled: true,
      corporate_initiation_fee: -1,
    });
    expect(result.success).toBe(false);
  });
});

describe("corporateInviteSchema", () => {
  it("accepts array of valid emails", () => {
    const result = corporateInviteSchema.safeParse({ emails: ["a@b.com", "c@d.com"] });
    expect(result.success).toBe(true);
  });

  it("rejects empty array", () => {
    const result = corporateInviteSchema.safeParse({ emails: [] });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email in array", () => {
    const result = corporateInviteSchema.safeParse({ emails: ["a@b.com", "bad"] });
    expect(result.success).toBe(false);
  });
});

describe("proposeAgreementSchema", () => {
  it("accepts valid UUID", () => {
    const result = proposeAgreementSchema.safeParse({ partner_club_id: UUID });
    expect(result.success).toBe(true);
  });

  it("rejects non-UUID", () => {
    const result = proposeAgreementSchema.safeParse({ partner_club_id: "abc" });
    expect(result.success).toBe(false);
  });
});

describe("agreementActionSchema", () => {
  it("accepts accept", () => {
    expect(agreementActionSchema.safeParse({ action: "accept" }).success).toBe(true);
  });

  it("accepts revoke", () => {
    expect(agreementActionSchema.safeParse({ action: "revoke" }).success).toBe(true);
  });

  it("rejects invalid action", () => {
    expect(agreementActionSchema.safeParse({ action: "deny" }).success).toBe(false);
  });
});

describe("referralSettingsSchema", () => {
  it("accepts valid settings", () => {
    const result = referralSettingsSchema.safeParse({
      referral_program_enabled: true,
      referral_reward: 50,
    });
    expect(result.success).toBe(true);
  });

  it("rejects reward over 10000", () => {
    const result = referralSettingsSchema.safeParse({
      referral_program_enabled: true,
      referral_reward: 10001,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative reward", () => {
    const result = referralSettingsSchema.safeParse({
      referral_program_enabled: true,
      referral_reward: -5,
    });
    expect(result.success).toBe(false);
  });
});

describe("referralInviteSchema", () => {
  it("accepts valid invite", () => {
    const result = referralInviteSchema.safeParse({ email: "a@b.com" });
    expect(result.success).toBe(true);
  });

  it("accepts optional message", () => {
    const result = referralInviteSchema.safeParse({ email: "a@b.com", message: "Join us!" });
    expect(result.success).toBe(true);
  });

  it("rejects message over 500 chars", () => {
    const result = referralInviteSchema.safeParse({ email: "a@b.com", message: "x".repeat(501) });
    expect(result.success).toBe(false);
  });
});

describe("clubJoinSchema", () => {
  it("accepts valid join request", () => {
    const result = clubJoinSchema.safeParse({ club_id: UUID });
    expect(result.success).toBe(true);
  });

  it("accepts optional referral_code and application_note", () => {
    const result = clubJoinSchema.safeParse({
      club_id: UUID,
      referral_code: "ABC123",
      application_note: "I fish weekly",
    });
    expect(result.success).toBe(true);
  });
});

describe("clubInviteSchema", () => {
  it("accepts valid invite", () => {
    const result = clubInviteSchema.safeParse({
      property_id: UUID,
      club_name: "River Club",
      admin_email: "admin@club.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing club_name", () => {
    const result = clubInviteSchema.safeParse({
      property_id: UUID,
      club_name: "",
      admin_email: "admin@club.com",
    });
    expect(result.success).toBe(false);
  });
});

describe("corporateJoinSchema", () => {
  it("accepts valid data", () => {
    const result = corporateJoinSchema.safeParse({ company_name: "Acme" });
    expect(result.success).toBe(true);
  });

  it("rejects empty company_name", () => {
    const result = corporateJoinSchema.safeParse({ company_name: "" });
    expect(result.success).toBe(false);
  });
});

describe("corporateEmployeeJoinSchema", () => {
  it("accepts valid token", () => {
    const result = corporateEmployeeJoinSchema.safeParse({ token: "abc123" });
    expect(result.success).toBe(true);
  });

  it("rejects empty token", () => {
    const result = corporateEmployeeJoinSchema.safeParse({ token: "" });
    expect(result.success).toBe(false);
  });
});

describe("createStaffNoteSchema", () => {
  it("accepts valid staff note", () => {
    const result = createStaffNoteSchema.safeParse({
      entity_type: "member",
      entity_id: UUID,
      body: "Good standing member",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid entity_type", () => {
    const result = createStaffNoteSchema.safeParse({
      entity_type: "booking",
      entity_id: UUID,
      body: "Note",
    });
    expect(result.success).toBe(false);
  });

  it("rejects body over 5000 characters", () => {
    const result = createStaffNoteSchema.safeParse({
      entity_type: "member",
      entity_id: UUID,
      body: "x".repeat(5001),
    });
    expect(result.success).toBe(false);
  });
});

describe("bulkMemberInviteSchema", () => {
  it("accepts valid email array", () => {
    const result = bulkMemberInviteSchema.safeParse({ emails: ["a@b.com"] });
    expect(result.success).toBe(true);
  });

  it("rejects empty array", () => {
    const result = bulkMemberInviteSchema.safeParse({ emails: [] });
    expect(result.success).toBe(false);
  });

  it("rejects over MAX_BULK_INVITE_EMAILS", () => {
    const emails = Array.from({ length: MAX_BULK_INVITE_EMAILS + 1 }, (_, i) => `user${i}@test.com`);
    const result = bulkMemberInviteSchema.safeParse({ emails });
    expect(result.success).toBe(false);
  });
});

describe("applicationReviewSchema", () => {
  it("accepts approve", () => {
    const result = applicationReviewSchema.safeParse({ action: "approve" });
    expect(result.success).toBe(true);
  });

  it("accepts decline with reason", () => {
    const result = applicationReviewSchema.safeParse({
      action: "decline",
      declined_reason: "Incomplete application",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid action", () => {
    const result = applicationReviewSchema.safeParse({ action: "reject" });
    expect(result.success).toBe(false);
  });
});
