-- ============================================================
-- 00075: CRM multi-channel — in-app notifications + SMS
--
-- Adds:
--   1. crm_notifications — in-app notification inbox
--   2. phone_number on profiles
--   3. crm_sms_sends — SMS tracking
--   4. Workflow node type 'send_sms' and 'notify'
-- ============================================================

-- ─── 1. In-App Notifications ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS crm_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  action_url text,
  category text NOT NULL DEFAULT 'general'
    CHECK (category IN ('general', 'marketing', 'booking', 'system', 'workflow')),
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  source_type text DEFAULT 'system'
    CHECK (source_type IN ('system', 'workflow', 'campaign', 'manual')),
  source_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE crm_notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications
CREATE POLICY "Users read own notifications"
  ON crm_notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update (mark read) their own notifications
CREATE POLICY "Users update own notifications"
  ON crm_notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE INDEX idx_notifications_user ON crm_notifications (user_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_unread ON crm_notifications (user_id, created_at DESC)
  WHERE is_read = false;

-- ─── 2. Phone number on profiles ─────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone_number text,
  ADD COLUMN IF NOT EXISTS sms_opt_in boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles (phone_number)
  WHERE phone_number IS NOT NULL;

-- ─── 3. SMS Tracking ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS crm_sms_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  phone_number text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'sent', 'delivered', 'failed')),
  provider_id text,
  error_message text,
  source_type text DEFAULT 'workflow'
    CHECK (source_type IN ('workflow', 'campaign', 'api', 'system')),
  source_id uuid,
  sent_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE crm_sms_sends ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_sms_sends_user ON crm_sms_sends (user_id, created_at DESC);
CREATE INDEX idx_sms_sends_status ON crm_sms_sends (status) WHERE status = 'queued';

-- ─── 4. Extend workflow node types ───────────────────────────────

ALTER TABLE crm_workflow_nodes
  DROP CONSTRAINT IF EXISTS crm_workflow_nodes_type_check;

ALTER TABLE crm_workflow_nodes
  ADD CONSTRAINT crm_workflow_nodes_type_check
    CHECK (type IN ('trigger', 'send_email', 'send_sms', 'notify', 'delay', 'condition', 'split', 'end'));
