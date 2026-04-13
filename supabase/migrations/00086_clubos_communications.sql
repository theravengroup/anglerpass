-- ClubOS Communications module: 6 tables + RLS helper functions + policies
-- Tables: club_templates, club_member_groups, club_member_group_assignments,
--         club_communication_preferences, club_campaigns, club_campaign_recipients

-- ═══════════════════════════════════════════════════════════════════════
-- RLS Helper Functions (used by all ClubOS tables)
-- ═══════════════════════════════════════════════════════════════════════

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

-- Check if the current user is owner or admin for a given club
CREATE OR REPLACE FUNCTION is_club_admin(p_club_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM club_memberships
    WHERE club_id = p_club_id
      AND user_id = auth.uid()
      AND status = 'active'
      AND role IN ('owner', 'club_admin', 'admin')
  )
  OR EXISTS (
    SELECT 1 FROM clubs
    WHERE id = p_club_id AND owner_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Platform admin check (matches existing pattern)
CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ═══════════════════════════════════════════════════════════════════════
-- 1. club_templates
-- ═══════════════════════════════════════════════════════════════════════

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

  is_system_default boolean NOT NULL DEFAULT false,

  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_club_templates_club ON club_templates(club_id)
  WHERE club_id IS NOT NULL;
CREATE INDEX idx_club_templates_system
  ON club_templates(type) WHERE is_system_default = true;

ALTER TABLE club_templates ENABLE ROW LEVEL SECURITY;

-- Staff can see their club's templates + system defaults
CREATE POLICY club_templates_select ON club_templates FOR SELECT USING (
  (club_id IS NULL AND is_system_default = true)
  OR is_club_staff(club_id)
  OR is_platform_admin()
);

-- Staff can insert templates for their club
CREATE POLICY club_templates_insert ON club_templates FOR INSERT WITH CHECK (
  club_id IS NOT NULL AND is_club_staff(club_id)
);

-- Staff can update their club's templates
CREATE POLICY club_templates_update ON club_templates FOR UPDATE USING (
  club_id IS NOT NULL AND is_club_staff(club_id)
);

-- Staff can delete their club's templates (not system defaults)
CREATE POLICY club_templates_delete ON club_templates FOR DELETE USING (
  club_id IS NOT NULL AND is_club_staff(club_id)
);

-- ═══════════════════════════════════════════════════════════════════════
-- 2. club_member_groups
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE club_member_groups (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id         uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,

  name            text NOT NULL,
  description     text,

  is_smart        boolean NOT NULL DEFAULT false,
  smart_filters   jsonb,

  member_count    integer DEFAULT 0,

  created_by      uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_club_member_groups_club ON club_member_groups(club_id);

ALTER TABLE club_member_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY club_member_groups_select ON club_member_groups FOR SELECT USING (
  is_club_staff(club_id) OR is_platform_admin()
);

CREATE POLICY club_member_groups_insert ON club_member_groups FOR INSERT WITH CHECK (
  is_club_staff(club_id)
);

CREATE POLICY club_member_groups_update ON club_member_groups FOR UPDATE USING (
  is_club_staff(club_id)
);

CREATE POLICY club_member_groups_delete ON club_member_groups FOR DELETE USING (
  is_club_staff(club_id)
);

-- ═══════════════════════════════════════════════════════════════════════
-- 3. club_member_group_assignments
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE club_member_group_assignments (
  group_id        uuid NOT NULL REFERENCES club_member_groups(id) ON DELETE CASCADE,
  membership_id   uuid NOT NULL REFERENCES club_memberships(id) ON DELETE CASCADE,
  added_at        timestamptz NOT NULL DEFAULT now(),
  added_by        uuid REFERENCES profiles(id) ON DELETE SET NULL,

  PRIMARY KEY (group_id, membership_id)
);

CREATE INDEX idx_club_group_assignments_membership
  ON club_member_group_assignments(membership_id);

ALTER TABLE club_member_group_assignments ENABLE ROW LEVEL SECURITY;

-- Staff can see assignments for groups in their club
CREATE POLICY club_group_assignments_select ON club_member_group_assignments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM club_member_groups g
    WHERE g.id = group_id AND is_club_staff(g.club_id)
  )
  OR is_platform_admin()
);

CREATE POLICY club_group_assignments_insert ON club_member_group_assignments FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM club_member_groups g
    WHERE g.id = group_id AND is_club_staff(g.club_id)
  )
);

CREATE POLICY club_group_assignments_delete ON club_member_group_assignments FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM club_member_groups g
    WHERE g.id = group_id AND is_club_staff(g.club_id)
  )
);

-- ═══════════════════════════════════════════════════════════════════════
-- 4. club_communication_preferences
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE club_communication_preferences (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id         uuid NOT NULL REFERENCES club_memberships(id) ON DELETE CASCADE,
  club_id               uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,

  email_broadcasts      boolean NOT NULL DEFAULT true,
  email_targeted        boolean NOT NULL DEFAULT true,
  email_digest          boolean NOT NULL DEFAULT true,
  email_event_notices   boolean NOT NULL DEFAULT true,

  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_club_comm_prefs_membership
  ON club_communication_preferences(membership_id);
CREATE INDEX idx_club_comm_prefs_club
  ON club_communication_preferences(club_id);

ALTER TABLE club_communication_preferences ENABLE ROW LEVEL SECURITY;

-- Members can see and manage their own preferences
CREATE POLICY club_comm_prefs_select ON club_communication_preferences FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM club_memberships m
    WHERE m.id = membership_id AND m.user_id = auth.uid()
  )
  OR is_club_staff(club_id)
  OR is_platform_admin()
);

CREATE POLICY club_comm_prefs_insert ON club_communication_preferences FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM club_memberships m
    WHERE m.id = membership_id AND m.user_id = auth.uid()
  )
);

CREATE POLICY club_comm_prefs_update ON club_communication_preferences FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM club_memberships m
    WHERE m.id = membership_id AND m.user_id = auth.uid()
  )
);

-- ═══════════════════════════════════════════════════════════════════════
-- 5. club_campaigns
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE club_campaigns (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id         uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,

  type            text NOT NULL CHECK (type IN ('broadcast', 'targeted', 'digest')),
  subject         text NOT NULL DEFAULT '',
  body_html       text NOT NULL DEFAULT '',
  body_text       text NOT NULL DEFAULT '',
  template_id     uuid REFERENCES club_templates(id) ON DELETE SET NULL,

  segment_filters jsonb,
  group_id        uuid REFERENCES club_member_groups(id) ON DELETE SET NULL,

  status          text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'partially_sent', 'failed', 'cancelled')),
  scheduled_at    timestamptz,
  sending_started_at timestamptz,
  sent_at         timestamptz,
  failed_reason   text,

  sender_user_id  uuid NOT NULL REFERENCES profiles(id),
  recipient_count integer,
  open_count      integer DEFAULT 0,
  click_count     integer DEFAULT 0,
  bounce_count    integer DEFAULT 0,

  vertical_context jsonb,

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_club_campaigns_club ON club_campaigns(club_id);
CREATE INDEX idx_club_campaigns_club_status ON club_campaigns(club_id, status);
CREATE INDEX idx_club_campaigns_scheduled
  ON club_campaigns(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX idx_club_campaigns_sender ON club_campaigns(sender_user_id);

ALTER TABLE club_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY club_campaigns_select ON club_campaigns FOR SELECT USING (
  is_club_staff(club_id) OR is_platform_admin()
);

CREATE POLICY club_campaigns_insert ON club_campaigns FOR INSERT WITH CHECK (
  is_club_staff(club_id)
);

CREATE POLICY club_campaigns_update ON club_campaigns FOR UPDATE USING (
  is_club_staff(club_id)
);

-- Only owner/admin can delete campaigns
CREATE POLICY club_campaigns_delete ON club_campaigns FOR DELETE USING (
  is_club_admin(club_id)
);

-- ═══════════════════════════════════════════════════════════════════════
-- 6. club_campaign_recipients
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE club_campaign_recipients (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id     uuid NOT NULL REFERENCES club_campaigns(id) ON DELETE CASCADE,
  membership_id   uuid NOT NULL REFERENCES club_memberships(id) ON DELETE CASCADE,

  email           text NOT NULL,
  status          text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed', 'skipped')),
  error_message   text,

  sent_at         timestamptz,
  delivered_at    timestamptz,
  opened_at       timestamptz,
  open_count      smallint DEFAULT 0,
  clicked_at      timestamptz,
  click_count     smallint DEFAULT 0,
  bounced_at      timestamptz,
  bounce_reason   text,

  esp_message_id  text,

  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_club_campaign_recipients_campaign
  ON club_campaign_recipients(campaign_id);
CREATE INDEX idx_club_campaign_recipients_campaign_status
  ON club_campaign_recipients(campaign_id, status);
CREATE INDEX idx_club_campaign_recipients_membership
  ON club_campaign_recipients(membership_id);
CREATE INDEX idx_club_campaign_recipients_esp
  ON club_campaign_recipients(esp_message_id)
  WHERE esp_message_id IS NOT NULL;

CREATE UNIQUE INDEX idx_club_campaign_recipients_unique
  ON club_campaign_recipients(campaign_id, membership_id);

ALTER TABLE club_campaign_recipients ENABLE ROW LEVEL SECURITY;

-- Staff can view recipient data for their club's campaigns
CREATE POLICY club_campaign_recipients_select ON club_campaign_recipients FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM club_campaigns c
    WHERE c.id = campaign_id AND is_club_staff(c.club_id)
  )
  OR is_platform_admin()
);

-- Recipients are created and updated by service role only (API routes / cron jobs)
-- No INSERT/UPDATE/DELETE policies for authenticated users

-- ═══════════════════════════════════════════════════════════════════════
-- updated_at triggers
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION clubos_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON club_templates
  FOR EACH ROW EXECUTE FUNCTION clubos_set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON club_member_groups
  FOR EACH ROW EXECUTE FUNCTION clubos_set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON club_communication_preferences
  FOR EACH ROW EXECUTE FUNCTION clubos_set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON club_campaigns
  FOR EACH ROW EXECUTE FUNCTION clubos_set_updated_at();
