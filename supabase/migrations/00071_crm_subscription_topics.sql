-- ============================================================
-- 00071: CRM subscription topics + frequency capping
--
-- Adds:
--   1. crm_subscription_topics — defines email categories
--   2. crm_user_topic_subscriptions — per-user opt-in/out per topic
--   3. crm_frequency_caps — global sending limits
--   4. topic_id on campaigns table — link campaigns to a topic
-- ============================================================

-- ─── 1. Subscription Topics ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS crm_subscription_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  is_default boolean NOT NULL DEFAULT true,
  is_required boolean NOT NULL DEFAULT false,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE crm_subscription_topics ENABLE ROW LEVEL SECURITY;

-- Seed default topics
INSERT INTO crm_subscription_topics (slug, name, description, is_default, is_required, display_order) VALUES
  ('product_updates', 'Product Updates', 'New features, improvements, and platform news', true, false, 1),
  ('promotions', 'Promotions & Offers', 'Special deals, seasonal promotions, and limited offers', true, false, 2),
  ('fishing_reports', 'Fishing Reports', 'Water conditions, hatch reports, and fishing intel', true, false, 3),
  ('community', 'Community & Events', 'Club events, meetups, and community highlights', true, false, 4),
  ('tips_education', 'Tips & Education', 'Fly fishing tips, gear guides, and how-to content', true, false, 5),
  ('transactional', 'Account & Bookings', 'Booking confirmations, receipts, and account updates', true, true, 0)
ON CONFLICT (slug) DO NOTHING;

-- ─── 2. User Topic Subscriptions ───────────────────────────────────

CREATE TABLE IF NOT EXISTS crm_user_topic_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id uuid NOT NULL REFERENCES crm_subscription_topics(id) ON DELETE CASCADE,
  subscribed boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, topic_id)
);

ALTER TABLE crm_user_topic_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_user_topic_subs_user ON crm_user_topic_subscriptions (user_id);
CREATE INDEX idx_user_topic_subs_topic ON crm_user_topic_subscriptions (topic_id);

-- ─── 3. Frequency Caps ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS crm_frequency_caps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  max_sends int NOT NULL DEFAULT 3,
  window_hours int NOT NULL DEFAULT 168,
  applies_to text NOT NULL DEFAULT 'marketing',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE crm_frequency_caps ENABLE ROW LEVEL SECURITY;

-- Default: max 3 marketing emails per week, max 1 per day
INSERT INTO crm_frequency_caps (name, max_sends, window_hours, applies_to, is_active) VALUES
  ('Weekly Marketing Cap', 3, 168, 'marketing', true),
  ('Daily Marketing Cap', 1, 24, 'marketing', true)
ON CONFLICT DO NOTHING;

-- ─── 4. Link Campaigns to Topics ──────────────────────────────────

ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS topic_id uuid REFERENCES crm_subscription_topics(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_campaigns_topic ON campaigns (topic_id);

-- ─── 5. Indexes for frequency cap lookups ──────────────────────────

-- Fast lookup: count sends to a specific email in a time window
CREATE INDEX IF NOT EXISTS idx_campaign_sends_recipient_sent
  ON campaign_sends (recipient_email, sent_at DESC)
  WHERE status IN ('sent', 'delivered');
