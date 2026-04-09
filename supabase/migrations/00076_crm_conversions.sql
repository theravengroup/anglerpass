-- ============================================================
-- 00076: CRM conversion tracking + activity timeline
--
-- Adds:
--   1. crm_conversions — business events with campaign attribution
--   2. crm_contact_activity — unified activity timeline per contact
--   3. crm_contact_tags — tagging system for contacts
-- ============================================================

-- ─── 1. Conversions ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS crm_conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text NOT NULL,
  event_name text NOT NULL,
  event_category text NOT NULL DEFAULT 'other'
    CHECK (event_category IN (
      'signup', 'booking', 'purchase', 'upgrade', 'referral',
      'engagement', 'retention', 'reactivation', 'other'
    )),
  value_cents integer DEFAULT 0,
  currency text DEFAULT 'USD',
  -- Attribution
  attributed_campaign_id uuid,
  attributed_workflow_id uuid,
  attributed_send_id uuid,
  attribution_window_hours integer DEFAULT 168, -- 7 days
  attribution_type text DEFAULT 'last_touch'
    CHECK (attribution_type IN ('last_touch', 'first_touch', 'direct')),
  -- Metadata
  properties jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE crm_conversions ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_conversions_user ON crm_conversions (user_id, created_at DESC);
CREATE INDEX idx_conversions_email ON crm_conversions (email, created_at DESC);
CREATE INDEX idx_conversions_campaign ON crm_conversions (attributed_campaign_id)
  WHERE attributed_campaign_id IS NOT NULL;
CREATE INDEX idx_conversions_event ON crm_conversions (event_name, created_at DESC);

-- ─── 2. Contact Activity Timeline ────────────────────────────────

CREATE TABLE IF NOT EXISTS crm_contact_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text NOT NULL,
  activity_type text NOT NULL
    CHECK (activity_type IN (
      'email_sent', 'email_opened', 'email_clicked',
      'email_bounced', 'email_unsubscribed',
      'sms_sent', 'sms_delivered', 'sms_failed',
      'notification_sent', 'notification_read',
      'workflow_enrolled', 'workflow_completed', 'workflow_exited',
      'campaign_enrolled', 'campaign_completed',
      'conversion', 'tag_added', 'tag_removed',
      'segment_joined', 'segment_left',
      'profile_updated', 'signup', 'login',
      'page_view', 'custom'
    )),
  title text NOT NULL,
  description text,
  -- References
  source_type text,
  source_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE crm_contact_activity ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_contact_activity_user ON crm_contact_activity (user_id, created_at DESC);
CREATE INDEX idx_contact_activity_email ON crm_contact_activity (email, created_at DESC);
CREATE INDEX idx_contact_activity_type ON crm_contact_activity (activity_type, created_at DESC);

-- ─── 3. Contact Tags ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS crm_contact_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tag text NOT NULL,
  added_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, tag)
);

ALTER TABLE crm_contact_tags ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_contact_tags_user ON crm_contact_tags (user_id);
CREATE INDEX idx_contact_tags_tag ON crm_contact_tags (tag);
