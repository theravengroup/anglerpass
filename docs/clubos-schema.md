# ClubOS Database Schema Design

> **Status:** Design review — no migrations created yet.
> **Date:** 2026-04-13
> **Context:** AnglerPass has 85 existing migrations. ClubOS tables will be added as migrations 00086+.

---

## 1. Relationship to Existing AnglerPass Tables

ClubOS is not a separate database — it extends the existing AnglerPass schema. Every ClubOS table is scoped to a `club_id` and builds on top of these existing tables:

```
┌─────────────────────────────────────────────────────────────┐
│                    EXISTING ANGLERPASS                       │
│                                                             │
│  profiles ─────┬──── club_memberships ──── clubs            │
│  (users)       │     (role, status,        (owner_id,       │
│                │      dues_status,          tier, fees,      │
│                │      stripe_sub_id)        stripe)          │
│                │                                            │
│                ├──── bookings ──── properties                │
│                │     (date, party,   (owner_id,             │
│                │      status, fees)   capacity, rates)      │
│                │                                            │
│                ├──── notifications                           │
│                ├──── notification_preferences                │
│                ├──── audit_log                               │
│                └──── membership_applications                 │
│                      membership_payments                    │
│                      referral_credits                       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                    EXISTING CRM (PLATFORM-LEVEL)            │
│                                                             │
│  campaigns ── campaign_steps ── campaign_sends              │
│  segments ── campaign_enrollments ── engagement_events      │
│  email_suppression_list ── crm_workflows                    │
│  crm_contact_activity ── crm_conversions                    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                    NEW: CLUBOS TABLES                        │
│                                                             │
│  COMMUNICATIONS          OPERATIONS        INTELLIGENCE     │
│  ───────────────         ──────────        ────────────     │
│  club_campaigns          club_events       member_activity  │
│  club_campaign_          club_event_         _events        │
│    recipients              registrations  engagement_scores │
│  club_templates          club_waitlists   renewal_risk_     │
│  club_comm_prefs         club_waivers       flags           │
│  club_member_groups      club_waiver_                       │
│  club_member_group_        signatures     SYSTEM            │
│    assignments           club_incidents   ──────            │
│                                           club_audit_log    │
│                                           club_exports      │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

**Why not reuse the existing CRM tables?**

The existing CRM system (`campaigns`, `campaign_sends`, etc.) is a **platform-level** tool operated by AnglerPass staff. It sends from `hello@anglerpass.com`, targets platform-wide segments, and has no concept of club ownership. ClubOS communications are **club-level** — each club owns its campaigns, sends from its own identity, targets its own members, and sees only its own analytics. The data models look similar but the access patterns, RLS policies, and business logic are fundamentally different.

**Why prefix with `club_`?**

To avoid ambiguity with existing tables (`campaigns` vs `club_campaigns`) and to make the ClubOS boundary explicit. When ClubOS is extracted as a standalone product, these tables move as a unit.

**Vertical context pattern**

Tables that could serve any membership organization (gym, HOA, yacht club) use a `vertical_context` JSONB column for AnglerPass-specific data. The core columns are universal. This makes future extraction cleaner without requiring schema changes.

---

## 2. Table Definitions

### COMMUNICATIONS

#### `club_campaigns`

The core communications table. Each row is a message a club sends to some or all of its members.

```sql
CREATE TABLE club_campaigns (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id         uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,

  -- Content
  type            text NOT NULL CHECK (type IN ('broadcast', 'targeted', 'digest')),
  subject         text NOT NULL DEFAULT '',
  body_html       text NOT NULL DEFAULT '',
  body_text       text NOT NULL DEFAULT '',
  template_id     uuid REFERENCES club_templates(id) ON DELETE SET NULL,

  -- Targeting
  segment_filters jsonb,
  -- Example: {"tier": ["pro"], "status": ["active"], "activity": "inactive_30d"}
  -- NULL = all active members (broadcast)
  group_id        uuid REFERENCES club_member_groups(id) ON DELETE SET NULL,

  -- Lifecycle
  status          text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'partially_sent', 'failed', 'cancelled')),
  scheduled_at    timestamptz,
  sending_started_at timestamptz,
  sent_at         timestamptz,
  failed_reason   text,

  -- Metadata
  sender_user_id  uuid NOT NULL REFERENCES profiles(id),
  recipient_count integer,           -- Denormalized after send
  open_count      integer DEFAULT 0, -- Denormalized for dashboard
  click_count     integer DEFAULT 0,
  bounce_count    integer DEFAULT 0,

  -- AnglerPass-specific context (not part of universal ClubOS)
  vertical_context jsonb,
  -- Example: {"property_ids": ["uuid"], "booking_season": "spring_2026"}

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_club_campaigns_club ON club_campaigns(club_id);
CREATE INDEX idx_club_campaigns_club_status ON club_campaigns(club_id, status);
CREATE INDEX idx_club_campaigns_scheduled
  ON club_campaigns(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX idx_club_campaigns_sender ON club_campaigns(sender_user_id);
```

**Notes:**
- `segment_filters` uses a structured JSON schema so the API can evaluate filters against `club_memberships` columns (role, status, dues_status, joined_at, etc.) without building a full query language.
- `group_id` is mutually exclusive with `segment_filters` at the application level. A campaign targets either a smart filter or a static group, not both.
- Denormalized counts (`open_count`, etc.) are updated via background jobs after webhook processing. They avoid expensive aggregate queries on the dashboard.

---

#### `club_campaign_recipients`

One row per member per campaign. This is the delivery log.

```sql
CREATE TABLE club_campaign_recipients (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id     uuid NOT NULL REFERENCES club_campaigns(id) ON DELETE CASCADE,
  membership_id   uuid NOT NULL REFERENCES club_memberships(id) ON DELETE CASCADE,

  -- Delivery
  email           text NOT NULL,
  status          text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed', 'skipped')),
  error_message   text,

  -- Engagement timestamps
  sent_at         timestamptz,
  delivered_at    timestamptz,
  opened_at       timestamptz,
  open_count      smallint DEFAULT 0,
  clicked_at      timestamptz,
  click_count     smallint DEFAULT 0,
  bounced_at      timestamptz,
  bounce_reason   text,

  -- ESP tracking
  esp_message_id  text, -- Resend/SendGrid message ID

  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_club_campaign_recipients_campaign
  ON club_campaign_recipients(campaign_id);
CREATE INDEX idx_club_campaign_recipients_campaign_status
  ON club_campaign_recipients(campaign_id, status);
CREATE INDEX idx_club_campaign_recipients_membership
  ON club_campaign_recipients(membership_id);
CREATE INDEX idx_club_campaign_recipients_esp
  ON club_campaign_recipients(esp_message_id)
  WHERE esp_message_id IS NOT NULL;

-- Prevent duplicate sends
CREATE UNIQUE INDEX idx_club_campaign_recipients_unique
  ON club_campaign_recipients(campaign_id, membership_id);
```

**Notes:**
- Status is progressive: `pending → queued → sent → delivered → opened/clicked`. Bounced/failed are terminal states.
- `skipped` handles suppressed emails, inactive members, or members who opted out.
- The unique index prevents accidentally sending the same campaign to the same member twice.

---

#### `club_templates`

Reusable message templates for common club communications.

```sql
CREATE TABLE club_templates (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id           uuid REFERENCES clubs(id) ON DELETE CASCADE,
  -- NULL club_id = system-wide default template

  name              text NOT NULL,
  type              text NOT NULL
    CHECK (type IN ('broadcast', 'event_notice', 'season_opener', 'season_closer',
                    'tournament', 'annual_meeting', 'welcome', 'renewal_reminder',
                    'digest', 'custom')),
  subject_template  text NOT NULL DEFAULT '',
  body_template     text NOT NULL DEFAULT '',
  -- Templates use {{variable}} syntax for merge fields:
  -- {{member_name}}, {{club_name}}, {{event_title}}, {{event_date}}, etc.

  is_system_default boolean NOT NULL DEFAULT false,
  -- System defaults (club_id IS NULL, is_system_default = true) are
  -- read-only starter templates that clubs can clone.

  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_club_templates_club ON club_templates(club_id)
  WHERE club_id IS NOT NULL;
CREATE INDEX idx_club_templates_system
  ON club_templates(type) WHERE is_system_default = true;
```

---

#### `club_communication_preferences`

Per-member, per-club opt-in/out preferences. Separate from the platform-level `notification_preferences` table which controls AnglerPass system emails.

```sql
CREATE TABLE club_communication_preferences (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id         uuid NOT NULL REFERENCES club_memberships(id) ON DELETE CASCADE,
  club_id               uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,

  email_broadcasts      boolean NOT NULL DEFAULT true,
  email_targeted        boolean NOT NULL DEFAULT true,
  email_digest          boolean NOT NULL DEFAULT true,
  email_event_notices   boolean NOT NULL DEFAULT true,

  -- CAN-SPAM: if all four above are false, member is fully opted out
  -- Members can always receive transactional messages (booking confirmations, etc.)

  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- One preferences row per membership
CREATE UNIQUE INDEX idx_club_comm_prefs_membership
  ON club_communication_preferences(membership_id);
CREATE INDEX idx_club_comm_prefs_club
  ON club_communication_preferences(club_id);
```

**Notes:**
- A missing row means all defaults (everything enabled). The application only creates a row when a member changes a preference.
- Transactional emails (booking confirmations, payment receipts) are not covered here — they always send via the existing `notifications` system.

---

#### `club_member_groups`

Static or smart groups for organizing members into segments.

```sql
CREATE TABLE club_member_groups (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id         uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,

  name            text NOT NULL,
  description     text,

  is_smart        boolean NOT NULL DEFAULT false,
  smart_filters   jsonb,
  -- Smart groups auto-populate based on filters evaluated at query time.
  -- Example: {"dues_status": ["active"], "joined_before": "2025-01-01"}
  -- Static groups (is_smart = false) use club_member_group_assignments.

  member_count    integer DEFAULT 0, -- Denormalized, updated on change

  created_by      uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_club_member_groups_club ON club_member_groups(club_id);
```

---

#### `club_member_group_assignments`

Static membership in groups. Only used when `club_member_groups.is_smart = false`.

```sql
CREATE TABLE club_member_group_assignments (
  group_id        uuid NOT NULL REFERENCES club_member_groups(id) ON DELETE CASCADE,
  membership_id   uuid NOT NULL REFERENCES club_memberships(id) ON DELETE CASCADE,
  added_at        timestamptz NOT NULL DEFAULT now(),
  added_by        uuid REFERENCES profiles(id) ON DELETE SET NULL,

  PRIMARY KEY (group_id, membership_id)
);

-- Indexes
CREATE INDEX idx_club_group_assignments_membership
  ON club_member_group_assignments(membership_id);
```

---

### OPERATIONS

#### `club_events`

Club-organized events: tournaments, outings, work days, social gatherings, meetings.

```sql
CREATE TABLE club_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id         uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,

  -- Content
  title           text NOT NULL,
  description     text,
  type            text NOT NULL
    CHECK (type IN ('tournament', 'outing', 'meeting', 'workday', 'social', 'other')),
  location        text,

  -- Schedule
  starts_at       timestamptz NOT NULL,
  ends_at         timestamptz,
  all_day         boolean NOT NULL DEFAULT false,

  -- Registration
  rsvp_limit      integer,          -- NULL = unlimited
  rsvp_deadline   timestamptz,
  waitlist_enabled boolean NOT NULL DEFAULT false,
  guest_allowed   boolean NOT NULL DEFAULT false,
  guest_limit_per_member integer DEFAULT 1,

  -- Lifecycle
  status          text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
  cancelled_reason text,

  -- Counts (denormalized)
  registered_count integer DEFAULT 0,
  waitlist_count  integer DEFAULT 0,
  attended_count  integer DEFAULT 0,

  -- AnglerPass-specific (not part of universal ClubOS)
  vertical_context jsonb,
  -- Example: {"property_id": "uuid", "species_target": ["brown", "rainbow"],
  --           "rod_limit": 8, "guide_id": "uuid"}

  created_by      uuid NOT NULL REFERENCES profiles(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_club_events_club ON club_events(club_id);
CREATE INDEX idx_club_events_club_status ON club_events(club_id, status);
CREATE INDEX idx_club_events_starts
  ON club_events(starts_at) WHERE status = 'published';
CREATE INDEX idx_club_events_created_by ON club_events(created_by);
```

---

#### `club_event_registrations`

RSVP and attendance tracking for events.

```sql
CREATE TABLE club_event_registrations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid NOT NULL REFERENCES club_events(id) ON DELETE CASCADE,
  membership_id   uuid NOT NULL REFERENCES club_memberships(id) ON DELETE CASCADE,

  status          text NOT NULL DEFAULT 'registered'
    CHECK (status IN ('registered', 'waitlisted', 'cancelled', 'attended', 'no_show')),
  waitlist_position integer,        -- NULL unless waitlisted
  guest_count     integer DEFAULT 0,
  notes           text,             -- Member-provided notes ("Bringing my son")

  -- Timestamps
  registered_at   timestamptz NOT NULL DEFAULT now(),
  cancelled_at    timestamptz,
  promoted_at     timestamptz,      -- When moved from waitlist to registered
  checked_in_at   timestamptz,      -- Attendance confirmation

  -- AnglerPass-specific
  vertical_context jsonb,
  -- Example: {"rod_count": 2, "guide_requested": true}

  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_club_event_registrations_event
  ON club_event_registrations(event_id);
CREATE INDEX idx_club_event_registrations_event_status
  ON club_event_registrations(event_id, status);
CREATE INDEX idx_club_event_registrations_membership
  ON club_event_registrations(membership_id);

-- One registration per member per event
CREATE UNIQUE INDEX idx_club_event_registrations_unique
  ON club_event_registrations(event_id, membership_id);
```

---

#### `club_waitlists`

General-purpose waitlists for membership slots and property access. Distinct from event waitlists (which are handled in `club_event_registrations`).

```sql
CREATE TABLE club_waitlists (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id         uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,

  type            text NOT NULL CHECK (type IN ('membership', 'property')),
  reference_id    uuid,
  -- For type='membership': NULL (club-wide waitlist)
  -- For type='property': references properties.id

  -- Waitlist entry
  user_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  -- user_id rather than membership_id because membership waitlisters
  -- may not have a membership yet

  position        integer NOT NULL,
  status          text NOT NULL DEFAULT 'waiting'
    CHECK (status IN ('waiting', 'offered', 'accepted', 'expired', 'cancelled', 'declined')),
  notes           text,

  -- Lifecycle
  offered_at      timestamptz,
  offer_expires_at timestamptz,
  accepted_at     timestamptz,
  cancelled_at    timestamptz,

  -- AnglerPass-specific
  vertical_context jsonb,
  -- Example: {"preferred_water_type": "spring_creek", "preferred_species": ["cutthroat"]}

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_club_waitlists_club ON club_waitlists(club_id);
CREATE INDEX idx_club_waitlists_club_type
  ON club_waitlists(club_id, type, status);
CREATE INDEX idx_club_waitlists_user ON club_waitlists(user_id);
CREATE INDEX idx_club_waitlists_reference
  ON club_waitlists(type, reference_id) WHERE reference_id IS NOT NULL;
CREATE INDEX idx_club_waitlists_position
  ON club_waitlists(club_id, type, reference_id, position)
  WHERE status = 'waiting';

-- One active waitlist entry per user per (club, type, reference)
CREATE UNIQUE INDEX idx_club_waitlists_unique_active
  ON club_waitlists(club_id, type, COALESCE(reference_id, '00000000-0000-0000-0000-000000000000'::uuid), user_id)
  WHERE status IN ('waiting', 'offered');
```

**Notes:**
- `position` is an integer that determines order. When a member is offered/accepts, positions behind them can be recomputed or left as-is (gaps are fine for ordering).
- The unique partial index prevents a user from being on the same waitlist twice while active.

---

#### `club_waivers`

Liability waivers and agreements that clubs require members to sign.

```sql
CREATE TABLE club_waivers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id         uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,

  title           text NOT NULL,
  body_text       text NOT NULL,
  version         integer NOT NULL DEFAULT 1,
  is_active       boolean NOT NULL DEFAULT true,
  -- When a new version is created, the old version's is_active is set to false.
  -- Existing signatures remain valid; members are prompted to sign the new version.

  requires_annual_renewal boolean NOT NULL DEFAULT false,

  created_by      uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_club_waivers_club ON club_waivers(club_id);
CREATE INDEX idx_club_waivers_active
  ON club_waivers(club_id) WHERE is_active = true;
```

---

#### `club_waiver_signatures`

Immutable record of a member signing a waiver.

```sql
CREATE TABLE club_waiver_signatures (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  waiver_id       uuid NOT NULL REFERENCES club_waivers(id) ON DELETE RESTRICT,
  membership_id   uuid NOT NULL REFERENCES club_memberships(id) ON DELETE CASCADE,

  signed_at       timestamptz NOT NULL DEFAULT now(),
  ip_address      inet,
  user_agent      text,
  -- Legal: we store the waiver version at time of signing via waiver_id.
  -- The waiver body is immutable once signed (enforced by versioning).

  expires_at      timestamptz
  -- NULL if the waiver doesn't require annual renewal.
  -- Set to signed_at + 1 year if requires_annual_renewal = true.
);

-- Indexes
CREATE INDEX idx_club_waiver_signatures_waiver
  ON club_waiver_signatures(waiver_id);
CREATE INDEX idx_club_waiver_signatures_membership
  ON club_waiver_signatures(membership_id);
CREATE INDEX idx_club_waiver_signatures_expiry
  ON club_waiver_signatures(expires_at)
  WHERE expires_at IS NOT NULL;

-- One signature per member per waiver version
CREATE UNIQUE INDEX idx_club_waiver_signatures_unique
  ON club_waiver_signatures(waiver_id, membership_id);
```

**Notes:**
- `ON DELETE RESTRICT` on `waiver_id` prevents deleting a waiver that has signatures. Clubs must deactivate, not delete.
- Waiver versioning: club creates a new `club_waivers` row with incremented version, deactivates the old one. Existing signatures link to the old row and remain valid.

---

#### `club_incidents`

Incident reports for property damage, safety issues, or rule violations.

```sql
CREATE TABLE club_incidents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id         uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,

  type            text NOT NULL
    CHECK (type IN ('safety', 'property_damage', 'rule_violation',
                    'environmental', 'access_issue', 'member_complaint', 'other')),
  severity        text NOT NULL DEFAULT 'low'
    CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status          text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),

  title           text NOT NULL,
  description     text NOT NULL,
  resolution      text,

  reported_by     uuid NOT NULL REFERENCES profiles(id),
  assigned_to     uuid REFERENCES profiles(id),

  -- Timestamps
  occurred_at     timestamptz,       -- When the incident happened (may differ from reported)
  resolved_at     timestamptz,
  closed_at       timestamptz,

  -- AnglerPass-specific
  vertical_context jsonb,
  -- Example: {"property_id": "uuid", "booking_id": "uuid",
  --           "beat_section": "Upper meadow", "fish_species_involved": "cutthroat"}

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_club_incidents_club ON club_incidents(club_id);
CREATE INDEX idx_club_incidents_club_status ON club_incidents(club_id, status);
CREATE INDEX idx_club_incidents_reported_by ON club_incidents(reported_by);
CREATE INDEX idx_club_incidents_severity
  ON club_incidents(club_id, severity) WHERE status IN ('open', 'investigating');
```

---

### INTELLIGENCE (Schema only — implementation deferred)

#### `club_member_activity_events`

Raw activity stream for member engagement tracking.

```sql
CREATE TABLE club_member_activity_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id   uuid NOT NULL REFERENCES club_memberships(id) ON DELETE CASCADE,
  club_id         uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,

  event_type      text NOT NULL,
  -- Universal types: 'login', 'page_view', 'email_opened', 'email_clicked',
  --   'event_registered', 'event_attended', 'campaign_received', 'profile_updated',
  --   'dues_paid', 'waiver_signed', 'group_joined'
  -- AnglerPass types stored in metadata.vertical_event_type:
  --   'booking_created', 'booking_completed', 'property_viewed', 'guide_contacted'

  metadata        jsonb,
  -- Universal: {"source": "web", "ip": "...", "user_agent": "..."}
  -- AnglerPass: {"vertical_event_type": "booking_created", "property_id": "uuid",
  --              "booking_id": "uuid", "rod_count": 2}

  occurred_at     timestamptz NOT NULL DEFAULT now()
);

-- Indexes — this table will be HIGH VOLUME
-- Partition by month in production (noted below)
CREATE INDEX idx_club_member_activity_club
  ON club_member_activity_events(club_id, occurred_at DESC);
CREATE INDEX idx_club_member_activity_membership
  ON club_member_activity_events(membership_id, occurred_at DESC);
CREATE INDEX idx_club_member_activity_type
  ON club_member_activity_events(club_id, event_type, occurred_at DESC);
```

**Production note:** This table should be partitioned by month (`PARTITION BY RANGE (occurred_at)`) once volume justifies it. For MVP, a single table with good indexes and a 90-day retention policy is sufficient.

---

#### `club_engagement_scores`

Computed engagement score per member. Updated by a background job (daily or on-demand).

```sql
CREATE TABLE club_engagement_scores (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id   uuid NOT NULL REFERENCES club_memberships(id) ON DELETE CASCADE,
  club_id         uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,

  score           integer NOT NULL DEFAULT 0,
  -- 0-100 composite score. Higher = more engaged.

  components      jsonb NOT NULL DEFAULT '{}',
  -- Breakdown: {"login_recency": 25, "booking_frequency": 30,
  --             "email_engagement": 15, "event_participation": 20,
  --             "dues_standing": 10}

  trend           text CHECK (trend IN ('rising', 'stable', 'declining')),
  previous_score  integer,

  calculated_at   timestamptz NOT NULL DEFAULT now()
);

-- One score per membership
CREATE UNIQUE INDEX idx_club_engagement_scores_membership
  ON club_engagement_scores(membership_id);
CREATE INDEX idx_club_engagement_scores_club_score
  ON club_engagement_scores(club_id, score DESC);
CREATE INDEX idx_club_engagement_scores_club_trend
  ON club_engagement_scores(club_id, trend)
  WHERE trend = 'declining';
```

---

#### `club_renewal_risk_flags`

Members at risk of not renewing. Populated by a background job analyzing engagement scores, dues status, and activity patterns.

```sql
CREATE TABLE club_renewal_risk_flags (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id   uuid NOT NULL REFERENCES club_memberships(id) ON DELETE CASCADE,
  club_id         uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,

  risk_level      text NOT NULL
    CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  reasons         jsonb NOT NULL DEFAULT '[]',
  -- Example: [
  --   {"reason": "no_bookings_60d", "detail": "No bookings in 60 days"},
  --   {"reason": "email_disengaged", "detail": "0 opens in last 5 campaigns"},
  --   {"reason": "dues_grace_period", "detail": "Dues past due, in grace period"}
  -- ]

  recommended_actions jsonb,
  -- Example: [
  --   {"action": "send_personal_outreach", "priority": "high"},
  --   {"action": "offer_booking_discount", "priority": "medium"}
  -- ]

  flagged_at      timestamptz NOT NULL DEFAULT now(),
  acknowledged_by uuid REFERENCES profiles(id),
  acknowledged_at timestamptz,
  resolved_at     timestamptz
);

-- Indexes
CREATE UNIQUE INDEX idx_club_renewal_risk_active
  ON club_renewal_risk_flags(membership_id)
  WHERE resolved_at IS NULL;
CREATE INDEX idx_club_renewal_risk_club_level
  ON club_renewal_risk_flags(club_id, risk_level)
  WHERE resolved_at IS NULL;
```

---

### SYSTEM

#### `club_audit_log`

Club-scoped audit trail. Separate from the platform `audit_log` to keep club data isolated and to allow clubs to view their own audit history without platform admin access.

```sql
CREATE TABLE club_audit_log (
  id              bigserial PRIMARY KEY,
  club_id         uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  actor_id        uuid NOT NULL REFERENCES profiles(id),

  action          text NOT NULL,
  -- Examples: 'campaign.sent', 'event.created', 'member.invited',
  --   'waiver.signed', 'incident.reported', 'export.requested',
  --   'group.created', 'preferences.updated', 'waitlist.offered'

  entity_type     text NOT NULL,
  -- Examples: 'club_campaign', 'club_event', 'club_member_group',
  --   'club_waitlist', 'club_waiver', 'club_incident', 'club_export'

  entity_id       text,
  -- UUID as text for flexibility. NULL for bulk operations.

  metadata        jsonb,
  -- Contextual data: {"subject": "Spring opener", "recipient_count": 45}

  ip_address      inet,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_club_audit_log_club ON club_audit_log(club_id, created_at DESC);
CREATE INDEX idx_club_audit_log_actor ON club_audit_log(actor_id, created_at DESC);
CREATE INDEX idx_club_audit_log_entity
  ON club_audit_log(entity_type, entity_id)
  WHERE entity_id IS NOT NULL;
```

**Notes:**
- `bigserial` matches the existing `audit_log` pattern.
- This is append-only. No UPDATE or DELETE policies.

---

#### `club_exports`

Track data export requests and their generated files.

```sql
CREATE TABLE club_exports (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id         uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  requested_by    uuid NOT NULL REFERENCES profiles(id),

  type            text NOT NULL
    CHECK (type IN ('members', 'financials', 'bookings', 'events',
                    'communications', 'activity', 'incidents', 'full')),
  format          text NOT NULL DEFAULT 'csv'
    CHECK (format IN ('csv', 'pdf')),

  status          text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message   text,

  -- File storage
  file_path       text,             -- Supabase Storage path
  file_size_bytes bigint,
  expires_at      timestamptz,      -- Auto-delete after 7 days

  -- Filters applied
  filters         jsonb,
  -- Example: {"date_from": "2026-01-01", "date_to": "2026-03-31",
  --           "status": ["active"]}

  created_at      timestamptz NOT NULL DEFAULT now(),
  completed_at    timestamptz
);

-- Indexes
CREATE INDEX idx_club_exports_club ON club_exports(club_id, created_at DESC);
CREATE INDEX idx_club_exports_expiry
  ON club_exports(expires_at) WHERE status = 'completed';
```

---

## 3. Row-Level Security Strategy

All ClubOS tables follow a consistent RLS pattern based on the user's relationship to the club via `club_memberships`.

### Policy Template

```
┌─────────────────────────┬────────────┬────────────┬────────────┬────────────┐
│ Table                   │ SELECT     │ INSERT     │ UPDATE     │ DELETE     │
├─────────────────────────┼────────────┼────────────┼────────────┼────────────┤
│ club_campaigns          │ Staff+     │ Staff+     │ Staff+     │ Owner/Admin│
│ club_campaign_recipients│ Staff+     │ Service    │ Service    │ —          │
│ club_templates          │ Staff+     │ Staff+     │ Staff+     │ Staff+     │
│ club_comm_preferences   │ Own member │ Own member │ Own member │ —          │
│ club_member_groups      │ Staff+     │ Staff+     │ Staff+     │ Staff+     │
│ club_member_group_asgn  │ Staff+     │ Staff+     │ —          │ Staff+     │
│ club_events             │ Members*   │ Staff+     │ Staff+     │ Owner/Admin│
│ club_event_registrations│ Own + Staff│ Own member │ Staff+     │ Own member │
│ club_waitlists          │ Own + Staff│ Own user   │ Staff+     │ Staff+     │
│ club_waivers            │ Members    │ Staff+     │ Staff+     │ —          │
│ club_waiver_signatures  │ Own + Staff│ Own member │ —          │ —          │
│ club_incidents          │ Staff+     │ Members    │ Staff+     │ —          │
│ club_member_activity    │ Staff+     │ Service    │ —          │ —          │
│ club_engagement_scores  │ Staff+     │ Service    │ Service    │ —          │
│ club_renewal_risk_flags │ Staff+     │ Service    │ Staff+     │ —          │
│ club_audit_log          │ Staff+     │ Service    │ —          │ —          │
│ club_exports            │ Staff+     │ Staff+     │ Service    │ —          │
└─────────────────────────┴────────────┴────────────┴────────────┴────────────┘

Legend:
  Staff+     = club owner + club_admin + ops_staff + booking_staff (active membership)
  Owner/Admin = club owner + club_admin only
  Members    = any active club member
  Members*   = published events visible to members; drafts visible to staff+
  Own member = the member's own row only
  Own + Staff = member sees own rows; staff sees all club rows
  Own user   = the user's own row (may not have membership yet for waitlists)
  Service    = service-role client only (API routes / background jobs)
  —          = no policy (not allowed)
```

### RLS Helper Functions

To avoid repeating complex subqueries in every policy, create helper functions:

```sql
-- Check if the current user is active staff (or above) for a given club
CREATE OR REPLACE FUNCTION is_club_staff(p_club_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM club_memberships
    WHERE club_id = p_club_id
      AND user_id = auth.uid()
      AND status = 'active'
      AND role IN ('owner', 'club_admin', 'admin', 'ops_staff', 'booking_staff', 'staff')
  )
  OR EXISTS (
    SELECT 1 FROM clubs
    WHERE id = p_club_id AND owner_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if the current user is an active member (any role) of a given club
CREATE OR REPLACE FUNCTION is_club_member(p_club_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM club_memberships
    WHERE club_id = p_club_id
      AND user_id = auth.uid()
      AND status = 'active'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

### Admin Override

All SELECT policies include an OR clause for platform admins:

```sql
OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
```

This matches the existing AnglerPass pattern used in `bookings`, `club_memberships`, etc.

---

## 4. Key Indexes for Performance

### High-priority indexes (query patterns from dashboard views)

| Query Pattern | Table | Index |
|---|---|---|
| Club dashboard: recent campaigns | `club_campaigns` | `(club_id, status)` |
| Scheduled send cron job | `club_campaigns` | `(scheduled_at) WHERE status = 'scheduled'` |
| Campaign analytics | `club_campaign_recipients` | `(campaign_id, status)` |
| Webhook delivery updates | `club_campaign_recipients` | `(esp_message_id)` |
| Upcoming events for members | `club_events` | `(starts_at) WHERE status = 'published'` |
| Event RSVP count | `club_event_registrations` | `(event_id, status)` |
| Member's event history | `club_event_registrations` | `(membership_id)` |
| Active waitlist by position | `club_waitlists` | `(club_id, type, reference_id, position) WHERE status = 'waiting'` |
| Expiring waiver signatures | `club_waiver_signatures` | `(expires_at) WHERE expires_at IS NOT NULL` |
| Open incidents by severity | `club_incidents` | `(club_id, severity) WHERE status IN ('open', 'investigating')` |
| Member activity timeline | `club_member_activity_events` | `(membership_id, occurred_at DESC)` |
| Engagement leaderboard | `club_engagement_scores` | `(club_id, score DESC)` |
| At-risk members | `club_renewal_risk_flags` | `(club_id, risk_level) WHERE resolved_at IS NULL` |
| Club audit trail | `club_audit_log` | `(club_id, created_at DESC)` |
| Export cleanup cron | `club_exports` | `(expires_at) WHERE status = 'completed'` |

### Composite indexes chosen over single-column

Most tables use `(club_id, ...)` as the leading column because every ClubOS query is scoped to a single club. This ensures the planner can use a single index scan for both the RLS filter and the business query.

---

## 5. Universal ClubOS vs AnglerPass-Specific

### Design Principle

The `vertical_context` JSONB column appears on tables where AnglerPass-specific data is needed but doesn't belong in the universal schema. This column is:

- **Ignored** by universal ClubOS logic (campaign sending, event registration, waitlist management)
- **Read/written** by AnglerPass-specific API routes and UI components
- **Not indexed** unless a specific query pattern emerges
- **Not validated** at the database level (application-layer Zod schemas handle this)

### Table Classification

| Table | Classification | AnglerPass-Specific Fields |
|---|---|---|
| `club_campaigns` | Universal | `vertical_context` (property refs, season tags) |
| `club_campaign_recipients` | Universal | None |
| `club_templates` | Universal | Template types could expand per vertical |
| `club_communication_preferences` | Universal | None |
| `club_member_groups` | Universal | Smart filter keys may include vertical fields |
| `club_member_group_assignments` | Universal | None |
| `club_events` | Universal | `vertical_context` (property, species, rod limit, guide) |
| `club_event_registrations` | Universal | `vertical_context` (rod count, guide preference) |
| `club_waitlists` | Universal | `vertical_context` (water type, species preferences) |
| `club_waivers` | Universal | None (waiver text itself is vertical-specific) |
| `club_waiver_signatures` | Universal | None |
| `club_incidents` | Universal | `vertical_context` (property, booking, fish species) |
| `club_member_activity_events` | Universal | `metadata.vertical_event_type` for fishing events |
| `club_engagement_scores` | Universal | Score component weights may vary by vertical |
| `club_renewal_risk_flags` | Universal | Reason codes may include vertical-specific ones |
| `club_audit_log` | Universal | None |
| `club_exports` | Universal | Export types may include vertical-specific ones |

### Extraction Strategy

To extract ClubOS as a standalone product:

1. Copy all `club_*` tables and the two helper functions
2. Replace `REFERENCES clubs(id)` with a generic `organization_id` FK
3. Replace `REFERENCES club_memberships(id)` with a generic `member_id` FK
4. Replace `REFERENCES profiles(id)` with a generic `user_id` FK
5. Drop `vertical_context` columns (or keep them for the new vertical)
6. Update RLS helper functions to use the new organization/member tables

The universal schema requires no column changes — only FK target tables change.

---

## Appendix: Migration Sequence

When approved, these tables will be created across 3-4 migrations:

| Migration | Tables | Phase |
|---|---|---|
| `00086_clubos_communications` | `club_templates`, `club_member_groups`, `club_member_group_assignments`, `club_communication_preferences`, `club_campaigns`, `club_campaign_recipients` | Phase 1 |
| `00087_clubos_operations` | `club_events`, `club_event_registrations`, `club_waitlists`, `club_waivers`, `club_waiver_signatures`, `club_incidents` | Phase 1 |
| `00088_clubos_intelligence` | `club_member_activity_events`, `club_engagement_scores`, `club_renewal_risk_flags` | Phase 2 |
| `00089_clubos_system` | `club_audit_log`, `club_exports`, RLS helper functions, all RLS policies, storage bucket for exports | Phase 1 |

Helper functions (`is_club_staff`, `is_club_member`) are created in the first migration since all subsequent RLS policies depend on them.
