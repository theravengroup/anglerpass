import { describe, it, expect } from "vitest";
import {
  createClubCampaignSchema,
  updateClubCampaignSchema,
  getCampaignsQuerySchema,
  createClubTemplateSchema,
  updateCommPreferencesSchema,
  createMemberGroupSchema,
  segmentFiltersSchema,
} from "./clubos-communications";
import {
  createClubEventSchema,
  updateClubEventSchema,
  getEventsQuerySchema,
  createRegistrationSchema,
  checkInSchema,
  bulkCheckInSchema,
  addToWaitlistSchema,
  offerWaitlistSchema,
  createWaiverSchema,
  updateWaiverSchema,
  signWaiverSchema,
  createIncidentSchema,
  updateIncidentSchema,
  getIncidentsQuerySchema,
  exportRequestSchema,
} from "./clubos-operations";

// ─── Campaign Schemas ──────────────────────────────────────────────

describe("createClubCampaignSchema", () => {
  const validCampaign = {
    type: "broadcast" as const,
    subject: "Monthly Update",
    body_html: "<p>Hello members</p>",
  };

  it("accepts valid campaign data", () => {
    const result = createClubCampaignSchema.safeParse(validCampaign);
    expect(result.success).toBe(true);
  });

  it("rejects missing subject", () => {
    const result = createClubCampaignSchema.safeParse({
      type: "broadcast",
      body_html: "<p>Content</p>",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing body_html", () => {
    const result = createClubCampaignSchema.safeParse({
      type: "broadcast",
      subject: "Test",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid campaign type", () => {
    const result = createClubCampaignSchema.safeParse({
      ...validCampaign,
      type: "invalid_type",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid campaign types", () => {
    for (const type of ["broadcast", "targeted", "digest"]) {
      const result = createClubCampaignSchema.safeParse({
        ...validCampaign,
        type,
      });
      expect(result.success).toBe(true);
    }
  });

  it("accepts optional segment_filters", () => {
    const result = createClubCampaignSchema.safeParse({
      ...validCampaign,
      segment_filters: {
        status: ["active"],
        activity_level: ["active", "inactive"],
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty subject", () => {
    const result = createClubCampaignSchema.safeParse({
      ...validCampaign,
      subject: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateClubCampaignSchema", () => {
  it("accepts partial data", () => {
    const result = updateClubCampaignSchema.safeParse({ subject: "Updated" });
    expect(result.success).toBe(true);
  });

  it("accepts empty object", () => {
    const result = updateClubCampaignSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe("getCampaignsQuerySchema", () => {
  it("applies defaults for page and limit", () => {
    const result = getCampaignsQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it("accepts valid status filter", () => {
    const result = getCampaignsQuerySchema.safeParse({ status: "sent" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid status", () => {
    const result = getCampaignsQuerySchema.safeParse({ status: "bogus" });
    expect(result.success).toBe(false);
  });

  it("coerces string numbers for page", () => {
    const result = getCampaignsQuerySchema.parse({ page: "3" });
    expect(result.page).toBe(3);
  });
});

// ─── Segment Filters ───────────────────────────────────────────────

describe("segmentFiltersSchema", () => {
  it("accepts valid filters", () => {
    const result = segmentFiltersSchema.safeParse({
      status: ["active", "pending"],
      activity_level: ["dormant"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid status value", () => {
    const result = segmentFiltersSchema.safeParse({
      status: ["active", "nonexistent"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid activity_level value", () => {
    const result = segmentFiltersSchema.safeParse({
      activity_level: ["hyperactive"],
    });
    expect(result.success).toBe(false);
  });

  it("accepts empty object", () => {
    const result = segmentFiltersSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

// ─── Template Schema ───────────────────────────────────────────────

describe("createClubTemplateSchema", () => {
  it("accepts valid template", () => {
    const result = createClubTemplateSchema.safeParse({
      name: "Welcome Email",
      type: "welcome",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing name", () => {
    const result = createClubTemplateSchema.safeParse({ type: "welcome" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid template type", () => {
    const result = createClubTemplateSchema.safeParse({
      name: "Test",
      type: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid template types", () => {
    const types = [
      "broadcast", "event_notice", "season_opener", "season_closer",
      "tournament", "annual_meeting", "welcome", "renewal_reminder",
      "digest", "custom",
    ];
    for (const type of types) {
      const result = createClubTemplateSchema.safeParse({ name: "T", type });
      expect(result.success).toBe(true);
    }
  });
});

// ─── Member Group Schema ───────────────────────────────────────────

describe("createMemberGroupSchema", () => {
  it("accepts a basic static group", () => {
    const result = createMemberGroupSchema.safeParse({ name: "VIPs" });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = createMemberGroupSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("requires smart_filters when is_smart is true", () => {
    const result = createMemberGroupSchema.safeParse({
      name: "Smart Group",
      is_smart: true,
    });
    expect(result.success).toBe(false);
  });

  it("accepts smart group with filters", () => {
    const result = createMemberGroupSchema.safeParse({
      name: "Active Members",
      is_smart: true,
      smart_filters: { activity_level: ["active"] },
    });
    expect(result.success).toBe(true);
  });

  it("rejects static group with smart_filters", () => {
    const result = createMemberGroupSchema.safeParse({
      name: "Static Group",
      is_smart: false,
      smart_filters: { status: ["active"] },
    });
    expect(result.success).toBe(false);
  });
});

// ─── Communication Preferences ─────────────────────────────────────

describe("updateCommPreferencesSchema", () => {
  it("accepts partial boolean preferences", () => {
    const result = updateCommPreferencesSchema.safeParse({
      email_broadcasts: false,
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-boolean values", () => {
    const result = updateCommPreferencesSchema.safeParse({
      email_broadcasts: "yes",
    });
    expect(result.success).toBe(false);
  });
});

// ─── Event Schemas ─────────────────────────────────────────────────

describe("createClubEventSchema", () => {
  const validEvent = {
    title: "Spring Tournament",
    type: "tournament" as const,
    starts_at: "2026-05-01T09:00:00Z",
  };

  it("accepts valid event data", () => {
    const result = createClubEventSchema.safeParse(validEvent);
    expect(result.success).toBe(true);
  });

  it("rejects missing title", () => {
    const result = createClubEventSchema.safeParse({
      type: "tournament",
      starts_at: "2026-05-01T09:00:00Z",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid event type", () => {
    const result = createClubEventSchema.safeParse({
      ...validEvent,
      type: "party",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid event types", () => {
    for (const type of ["tournament", "outing", "meeting", "workday", "social", "other"]) {
      const result = createClubEventSchema.safeParse({ ...validEvent, type });
      expect(result.success).toBe(true);
    }
  });

  it("rejects missing starts_at", () => {
    const result = createClubEventSchema.safeParse({
      title: "Test",
      type: "outing",
    });
    expect(result.success).toBe(false);
  });

  it("defaults status to draft", () => {
    const result = createClubEventSchema.parse(validEvent);
    expect(result.status).toBe("draft");
  });

  it("accepts optional fields", () => {
    const result = createClubEventSchema.safeParse({
      ...validEvent,
      description: "A great event",
      location: "River Lodge",
      rsvp_limit: 50,
      waitlist_enabled: true,
      guest_allowed: true,
      guest_limit_per_member: 2,
    });
    expect(result.success).toBe(true);
  });
});

describe("updateClubEventSchema", () => {
  it("accepts partial update with cancelled_reason", () => {
    const result = updateClubEventSchema.safeParse({
      status: "cancelled",
      cancelled_reason: "Weather conditions",
    });
    expect(result.success).toBe(true);
  });
});

describe("getEventsQuerySchema", () => {
  it("applies defaults", () => {
    const result = getEventsQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it("accepts status and type filters", () => {
    const result = getEventsQuerySchema.safeParse({
      status: "published",
      type: "tournament",
    });
    expect(result.success).toBe(true);
  });
});

// ─── Registration Schemas ──────────────────────────────────────────

describe("createRegistrationSchema", () => {
  it("accepts minimal registration", () => {
    const result = createRegistrationSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts registration with guest count", () => {
    const result = createRegistrationSchema.safeParse({ guest_count: 3 });
    expect(result.success).toBe(true);
  });

  it("rejects guest count over 20", () => {
    const result = createRegistrationSchema.safeParse({ guest_count: 21 });
    expect(result.success).toBe(false);
  });
});

describe("checkInSchema", () => {
  it("accepts valid check-in", () => {
    const result = checkInSchema.safeParse({
      registration_id: "550e8400-e29b-41d4-a716-446655440000",
      status: "attended",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid status", () => {
    const result = checkInSchema.safeParse({
      registration_id: "550e8400-e29b-41d4-a716-446655440000",
      status: "maybe",
    });
    expect(result.success).toBe(false);
  });
});

describe("bulkCheckInSchema", () => {
  it("requires at least 1 registration", () => {
    const result = bulkCheckInSchema.safeParse({ registrations: [] });
    expect(result.success).toBe(false);
  });

  it("accepts valid bulk check-in", () => {
    const result = bulkCheckInSchema.safeParse({
      registrations: [
        {
          registration_id: "550e8400-e29b-41d4-a716-446655440000",
          status: "attended",
        },
      ],
    });
    expect(result.success).toBe(true);
  });
});

// ─── Waitlist Schemas ──────────────────────────────────────────────

describe("addToWaitlistSchema", () => {
  it("accepts valid waitlist entry", () => {
    const result = addToWaitlistSchema.safeParse({ type: "membership" });
    expect(result.success).toBe(true);
  });

  it("accepts all valid waitlist types", () => {
    for (const type of ["membership", "property"]) {
      const result = addToWaitlistSchema.safeParse({ type });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid waitlist type", () => {
    const result = addToWaitlistSchema.safeParse({ type: "event" });
    expect(result.success).toBe(false);
  });
});

describe("offerWaitlistSchema", () => {
  it("accepts empty object", () => {
    const result = offerWaitlistSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts optional datetime", () => {
    const result = offerWaitlistSchema.safeParse({
      offer_expires_at: "2026-06-01T00:00:00Z",
    });
    expect(result.success).toBe(true);
  });
});

// ─── Waiver Schemas ────────────────────────────────────────────────

describe("createWaiverSchema", () => {
  it("accepts valid waiver", () => {
    const result = createWaiverSchema.safeParse({
      title: "Liability Waiver",
      body_text: "By signing this waiver you agree...",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing title", () => {
    const result = createWaiverSchema.safeParse({
      body_text: "Content",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing body_text", () => {
    const result = createWaiverSchema.safeParse({
      title: "Waiver",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty title", () => {
    const result = createWaiverSchema.safeParse({
      title: "",
      body_text: "Content",
    });
    expect(result.success).toBe(false);
  });
});

describe("signWaiverSchema", () => {
  it("requires both waiver_id and membership_id as UUIDs", () => {
    const result = signWaiverSchema.safeParse({
      waiver_id: "550e8400-e29b-41d4-a716-446655440000",
      membership_id: "660e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-UUID waiver_id", () => {
    const result = signWaiverSchema.safeParse({
      waiver_id: "not-a-uuid",
      membership_id: "660e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(false);
  });
});

// ─── Incident Schemas ──────────────────────────────────────────────

describe("createIncidentSchema", () => {
  const validIncident = {
    type: "safety" as const,
    title: "Fallen tree on path",
    description: "A large tree fell across the main access trail.",
  };

  it("accepts valid incident", () => {
    const result = createIncidentSchema.safeParse(validIncident);
    expect(result.success).toBe(true);
  });

  it("rejects missing title", () => {
    const result = createIncidentSchema.safeParse({
      type: "safety",
      description: "Something happened",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing description", () => {
    const result = createIncidentSchema.safeParse({
      type: "safety",
      title: "Incident",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid incident type", () => {
    const result = createIncidentSchema.safeParse({
      ...validIncident,
      type: "fire",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid incident types", () => {
    const types = [
      "safety", "property_damage", "rule_violation", "environmental",
      "access_issue", "member_complaint", "other",
    ];
    for (const type of types) {
      const result = createIncidentSchema.safeParse({ ...validIncident, type });
      expect(result.success).toBe(true);
    }
  });

  it("accepts all valid severity levels", () => {
    for (const severity of ["low", "medium", "high", "critical"]) {
      const result = createIncidentSchema.safeParse({
        ...validIncident,
        severity,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid severity", () => {
    const result = createIncidentSchema.safeParse({
      ...validIncident,
      severity: "extreme",
    });
    expect(result.success).toBe(false);
  });

  it("defaults severity to low", () => {
    const result = createIncidentSchema.parse(validIncident);
    expect(result.severity).toBe("low");
  });
});

describe("updateIncidentSchema", () => {
  it("accepts partial update", () => {
    const result = updateIncidentSchema.safeParse({
      status: "resolved",
      resolution: "Tree was cleared by maintenance crew.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid status", () => {
    const result = updateIncidentSchema.safeParse({ status: "pending" });
    expect(result.success).toBe(false);
  });

  it("accepts all valid statuses", () => {
    for (const status of ["open", "investigating", "resolved", "closed"]) {
      const result = updateIncidentSchema.safeParse({ status });
      expect(result.success).toBe(true);
    }
  });
});

describe("getIncidentsQuerySchema", () => {
  it("applies defaults", () => {
    const result = getIncidentsQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it("accepts all filter combinations", () => {
    const result = getIncidentsQuerySchema.safeParse({
      status: "open",
      severity: "high",
      type: "safety",
    });
    expect(result.success).toBe(true);
  });
});

// ─── Export Schema ─────────────────────────────────────────────────

describe("exportRequestSchema", () => {
  it("accepts valid export request", () => {
    const result = exportRequestSchema.safeParse({
      format: "csv",
      resource: "events",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid format", () => {
    const result = exportRequestSchema.safeParse({
      format: "xlsx",
      resource: "events",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid resource", () => {
    const result = exportRequestSchema.safeParse({
      format: "csv",
      resource: "members",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid resources", () => {
    for (const resource of ["events", "registrations", "incidents", "waivers", "activity"]) {
      const result = exportRequestSchema.safeParse({ format: "pdf", resource });
      expect(result.success).toBe(true);
    }
  });

  it("accepts optional date range", () => {
    const result = exportRequestSchema.safeParse({
      format: "csv",
      resource: "incidents",
      date_from: "2026-01-01",
      date_to: "2026-12-31",
    });
    expect(result.success).toBe(true);
  });
});
