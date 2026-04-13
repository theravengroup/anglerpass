-- ClubOS Operations Module
-- Tables: club_events, club_event_registrations, club_waitlists,
--         club_waivers, club_waiver_signatures, club_incidents,
--         club_member_activity_events
-- Reuses RLS helpers from 00086: is_club_staff, is_club_member, is_club_admin, is_platform_admin

------------------------------------------------------------------------
-- 1. club_events
------------------------------------------------------------------------
CREATE TABLE club_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id         uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  title           text NOT NULL,
  description     text,
  type            text NOT NULL CHECK (type IN ('tournament','outing','meeting','workday','social','other')),
  location        text,
  starts_at       timestamptz NOT NULL,
  ends_at         timestamptz,
  all_day         boolean NOT NULL DEFAULT false,
  rsvp_limit      integer,
  rsvp_deadline   timestamptz,
  waitlist_enabled boolean NOT NULL DEFAULT false,
  guest_allowed   boolean NOT NULL DEFAULT false,
  guest_limit_per_member integer DEFAULT 1,
  status          text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','cancelled','completed')),
  cancelled_reason text,
  registered_count integer NOT NULL DEFAULT 0,
  waitlist_count   integer NOT NULL DEFAULT 0,
  attended_count   integer NOT NULL DEFAULT 0,
  vertical_context jsonb,
  created_by      uuid NOT NULL REFERENCES profiles(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_club_events_club ON club_events(club_id);
CREATE INDEX idx_club_events_club_status ON club_events(club_id, status);
CREATE INDEX idx_club_events_starts ON club_events(starts_at) WHERE status = 'published';
CREATE INDEX idx_club_events_created_by ON club_events(created_by);

CREATE TRIGGER set_club_events_updated_at
  BEFORE UPDATE ON club_events
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE club_events ENABLE ROW LEVEL SECURITY;

-- Members see published events; staff see all
CREATE POLICY club_events_select ON club_events FOR SELECT USING (
  (status = 'published' AND is_club_member(club_id))
  OR is_club_staff(club_id)
  OR is_platform_admin()
);

CREATE POLICY club_events_insert ON club_events FOR INSERT WITH CHECK (
  is_club_staff(club_id)
);

CREATE POLICY club_events_update ON club_events FOR UPDATE USING (
  is_club_staff(club_id)
);

CREATE POLICY club_events_delete ON club_events FOR DELETE USING (
  is_club_admin(club_id)
);

------------------------------------------------------------------------
-- 2. club_event_registrations
------------------------------------------------------------------------
CREATE TABLE club_event_registrations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid NOT NULL REFERENCES club_events(id) ON DELETE CASCADE,
  membership_id   uuid NOT NULL REFERENCES club_memberships(id) ON DELETE CASCADE,
  status          text NOT NULL DEFAULT 'registered'
                  CHECK (status IN ('registered','waitlisted','cancelled','attended','no_show')),
  waitlist_position integer,
  guest_count     integer NOT NULL DEFAULT 0,
  notes           text,
  registered_at   timestamptz NOT NULL DEFAULT now(),
  cancelled_at    timestamptz,
  promoted_at     timestamptz,
  checked_in_at   timestamptz,
  vertical_context jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, membership_id)
);

CREATE INDEX idx_club_event_regs_event ON club_event_registrations(event_id);
CREATE INDEX idx_club_event_regs_event_status ON club_event_registrations(event_id, status);
CREATE INDEX idx_club_event_regs_membership ON club_event_registrations(membership_id);

ALTER TABLE club_event_registrations ENABLE ROW LEVEL SECURITY;

-- Members see own; staff see all for that event's club
CREATE POLICY club_event_regs_select ON club_event_registrations FOR SELECT USING (
  membership_id IN (
    SELECT id FROM club_memberships WHERE user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM club_events e WHERE e.id = event_id AND is_club_staff(e.club_id)
  )
  OR is_platform_admin()
);

CREATE POLICY club_event_regs_insert ON club_event_registrations FOR INSERT WITH CHECK (
  membership_id IN (
    SELECT id FROM club_memberships WHERE user_id = auth.uid() AND status = 'active'
  )
  OR EXISTS (
    SELECT 1 FROM club_events e WHERE e.id = event_id AND is_club_staff(e.club_id)
  )
);

CREATE POLICY club_event_regs_update ON club_event_registrations FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM club_events e WHERE e.id = event_id AND is_club_staff(e.club_id)
  )
);

CREATE POLICY club_event_regs_delete ON club_event_registrations FOR DELETE USING (
  membership_id IN (
    SELECT id FROM club_memberships WHERE user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM club_events e WHERE e.id = event_id AND is_club_staff(e.club_id)
  )
);

------------------------------------------------------------------------
-- 3. club_waitlists (membership & property waitlists)
------------------------------------------------------------------------
CREATE TABLE club_waitlists (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id         uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  type            text NOT NULL CHECK (type IN ('membership','property')),
  reference_id    uuid,
  user_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  position        integer NOT NULL,
  status          text NOT NULL DEFAULT 'waiting'
                  CHECK (status IN ('waiting','offered','accepted','expired','cancelled','declined')),
  notes           text,
  offered_at      timestamptz,
  offer_expires_at timestamptz,
  accepted_at     timestamptz,
  cancelled_at    timestamptz,
  vertical_context jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_club_waitlists_club ON club_waitlists(club_id);
CREATE INDEX idx_club_waitlists_club_type ON club_waitlists(club_id, type, status);
CREATE INDEX idx_club_waitlists_user ON club_waitlists(user_id);
CREATE INDEX idx_club_waitlists_reference ON club_waitlists(type, reference_id) WHERE reference_id IS NOT NULL;
CREATE INDEX idx_club_waitlists_position ON club_waitlists(club_id, type, reference_id, position) WHERE status = 'waiting';
CREATE UNIQUE INDEX idx_club_waitlists_unique_active
  ON club_waitlists(club_id, type, COALESCE(reference_id, '00000000-0000-0000-0000-000000000000'::uuid), user_id)
  WHERE status IN ('waiting','offered');

CREATE TRIGGER set_club_waitlists_updated_at
  BEFORE UPDATE ON club_waitlists
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE club_waitlists ENABLE ROW LEVEL SECURITY;

-- User sees own; staff see all
CREATE POLICY club_waitlists_select ON club_waitlists FOR SELECT USING (
  user_id = auth.uid()
  OR is_club_staff(club_id)
  OR is_platform_admin()
);

CREATE POLICY club_waitlists_insert ON club_waitlists FOR INSERT WITH CHECK (
  user_id = auth.uid()
  OR is_club_staff(club_id)
);

CREATE POLICY club_waitlists_update ON club_waitlists FOR UPDATE USING (
  is_club_staff(club_id)
);

CREATE POLICY club_waitlists_delete ON club_waitlists FOR DELETE USING (
  is_club_staff(club_id)
);

------------------------------------------------------------------------
-- 4. club_waivers
------------------------------------------------------------------------
CREATE TABLE club_waivers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id         uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  title           text NOT NULL,
  body_text       text NOT NULL,
  version         integer NOT NULL DEFAULT 1,
  is_active       boolean NOT NULL DEFAULT true,
  requires_annual_renewal boolean NOT NULL DEFAULT false,
  created_by      uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_club_waivers_club ON club_waivers(club_id);
CREATE INDEX idx_club_waivers_active ON club_waivers(club_id) WHERE is_active = true;

CREATE TRIGGER set_club_waivers_updated_at
  BEFORE UPDATE ON club_waivers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE club_waivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY club_waivers_select ON club_waivers FOR SELECT USING (
  is_club_member(club_id)
  OR is_platform_admin()
);

CREATE POLICY club_waivers_insert ON club_waivers FOR INSERT WITH CHECK (
  is_club_staff(club_id)
);

CREATE POLICY club_waivers_update ON club_waivers FOR UPDATE USING (
  is_club_staff(club_id)
);

-- No DELETE policy — waivers are never deleted (legal retention)

------------------------------------------------------------------------
-- 5. club_waiver_signatures
------------------------------------------------------------------------
CREATE TABLE club_waiver_signatures (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  waiver_id       uuid NOT NULL REFERENCES club_waivers(id) ON DELETE RESTRICT,
  membership_id   uuid NOT NULL REFERENCES club_memberships(id) ON DELETE CASCADE,
  signed_at       timestamptz NOT NULL DEFAULT now(),
  ip_address      inet,
  user_agent      text,
  expires_at      timestamptz,
  UNIQUE (waiver_id, membership_id)
);

CREATE INDEX idx_club_waiver_sigs_waiver ON club_waiver_signatures(waiver_id);
CREATE INDEX idx_club_waiver_sigs_membership ON club_waiver_signatures(membership_id);
CREATE INDEX idx_club_waiver_sigs_expiry ON club_waiver_signatures(expires_at) WHERE expires_at IS NOT NULL;

ALTER TABLE club_waiver_signatures ENABLE ROW LEVEL SECURITY;

-- Member sees own; staff see all for that waiver's club
CREATE POLICY club_waiver_sigs_select ON club_waiver_signatures FOR SELECT USING (
  membership_id IN (
    SELECT id FROM club_memberships WHERE user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM club_waivers w WHERE w.id = waiver_id AND is_club_staff(w.club_id)
  )
  OR is_platform_admin()
);

CREATE POLICY club_waiver_sigs_insert ON club_waiver_signatures FOR INSERT WITH CHECK (
  membership_id IN (
    SELECT id FROM club_memberships WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- No UPDATE or DELETE — signatures are immutable (legal retention)

------------------------------------------------------------------------
-- 6. club_incidents
------------------------------------------------------------------------
CREATE TABLE club_incidents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id         uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  type            text NOT NULL
                  CHECK (type IN ('safety','property_damage','rule_violation','environmental','access_issue','member_complaint','other')),
  severity        text NOT NULL DEFAULT 'low'
                  CHECK (severity IN ('low','medium','high','critical')),
  status          text NOT NULL DEFAULT 'open'
                  CHECK (status IN ('open','investigating','resolved','closed')),
  title           text NOT NULL,
  description     text NOT NULL,
  resolution      text,
  reported_by     uuid NOT NULL REFERENCES profiles(id),
  assigned_to     uuid REFERENCES profiles(id),
  occurred_at     timestamptz,
  resolved_at     timestamptz,
  closed_at       timestamptz,
  vertical_context jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_club_incidents_club ON club_incidents(club_id);
CREATE INDEX idx_club_incidents_club_status ON club_incidents(club_id, status);
CREATE INDEX idx_club_incidents_reported_by ON club_incidents(reported_by);
CREATE INDEX idx_club_incidents_severity ON club_incidents(club_id, severity) WHERE status IN ('open','investigating');

CREATE TRIGGER set_club_incidents_updated_at
  BEFORE UPDATE ON club_incidents
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE club_incidents ENABLE ROW LEVEL SECURITY;

-- Staff see all incidents; any member can report
CREATE POLICY club_incidents_select ON club_incidents FOR SELECT USING (
  is_club_staff(club_id)
  OR is_platform_admin()
);

CREATE POLICY club_incidents_insert ON club_incidents FOR INSERT WITH CHECK (
  is_club_member(club_id)
);

CREATE POLICY club_incidents_update ON club_incidents FOR UPDATE USING (
  is_club_staff(club_id)
);

-- No DELETE — incidents are retained for legal/audit purposes

------------------------------------------------------------------------
-- 7. club_member_activity_events
------------------------------------------------------------------------
CREATE TABLE club_member_activity_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id   uuid NOT NULL REFERENCES club_memberships(id) ON DELETE CASCADE,
  club_id         uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  event_type      text NOT NULL,
  metadata        jsonb,
  occurred_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_club_member_activity_club ON club_member_activity_events(club_id, occurred_at DESC);
CREATE INDEX idx_club_member_activity_membership ON club_member_activity_events(membership_id, occurred_at DESC);
CREATE INDEX idx_club_member_activity_type ON club_member_activity_events(club_id, event_type, occurred_at DESC);

ALTER TABLE club_member_activity_events ENABLE ROW LEVEL SECURITY;

-- Staff see all; member sees own
CREATE POLICY club_member_activity_select ON club_member_activity_events FOR SELECT USING (
  membership_id IN (
    SELECT id FROM club_memberships WHERE user_id = auth.uid()
  )
  OR is_club_staff(club_id)
  OR is_platform_admin()
);

-- Insert only via service role (API routes) — no direct user inserts
CREATE POLICY club_member_activity_insert ON club_member_activity_events FOR INSERT WITH CHECK (
  is_club_staff(club_id)
);
