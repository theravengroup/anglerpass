-- ============================================================
-- 00077: CRM send-time optimization
--
-- Adds:
--   1. timezone on profiles
--   2. crm_engagement_windows — per-user hourly engagement scores
--   3. crm_send_schedule — queued scheduled sends
--   4. send_time_strategy on campaigns/workflows
-- ============================================================

-- ─── 1. Timezone on profiles ─────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'America/New_York';

-- ─── 2. Engagement Windows ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS crm_engagement_windows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday
  hour_utc integer NOT NULL CHECK (hour_utc BETWEEN 0 AND 23),
  open_count integer NOT NULL DEFAULT 0,
  click_count integer NOT NULL DEFAULT 0,
  score real NOT NULL DEFAULT 0, -- computed: opens * 1 + clicks * 3
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (email, day_of_week, hour_utc)
);

ALTER TABLE crm_engagement_windows ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_engagement_windows_email ON crm_engagement_windows (email, score DESC);

-- ─── 3. Send Schedule ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS crm_send_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  send_id uuid REFERENCES campaign_sends(id) ON DELETE CASCADE,
  workflow_enrollment_id uuid REFERENCES crm_workflow_enrollments(id) ON DELETE CASCADE,
  recipient_email text NOT NULL,
  scheduled_for timestamptz NOT NULL,
  strategy text NOT NULL DEFAULT 'immediate'
    CHECK (strategy IN ('immediate', 'timezone_optimal', 'engagement_optimal', 'custom')),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE crm_send_schedule ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_send_schedule_pending ON crm_send_schedule (scheduled_for, status)
  WHERE status = 'pending';

-- ─── 4. Strategy on campaigns ────────────────────────────────────

ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS send_time_strategy text DEFAULT 'immediate'
    CHECK (send_time_strategy IN ('immediate', 'timezone_optimal', 'engagement_optimal'));

ALTER TABLE crm_workflows
  ADD COLUMN IF NOT EXISTS send_time_strategy text DEFAULT 'immediate'
    CHECK (send_time_strategy IN ('immediate', 'timezone_optimal', 'engagement_optimal'));
