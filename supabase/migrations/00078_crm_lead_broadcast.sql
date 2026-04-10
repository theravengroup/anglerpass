-- ============================================================
-- 00078: CRM lead broadcast support
--
-- Enables sending broadcast campaigns to waitlist leads,
-- segmented by audience (interest_type).
--
-- Adds:
--   1. crm_lead_topic_subscriptions — per-lead topic preferences
--   2. converted_to_user_id on leads — tracks lead→user conversion
--   3. include_leads flag on segments — controls lead inclusion
--   4. Indexes for lead broadcast queries
-- ============================================================

-- ─── 1. Lead Topic Subscriptions ──────────────────────────────────

CREATE TABLE IF NOT EXISTS crm_lead_topic_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  topic_id uuid NOT NULL REFERENCES crm_subscription_topics(id) ON DELETE CASCADE,
  subscribed boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(lead_id, topic_id)
);

ALTER TABLE crm_lead_topic_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_lead_topic_subs_lead ON crm_lead_topic_subscriptions (lead_id);
CREATE INDEX idx_lead_topic_subs_topic ON crm_lead_topic_subscriptions (topic_id);

-- ─── 2. Lead-to-User Conversion Tracking ─────────────────────────

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS converted_to_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS converted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_leads_converted
  ON leads (converted_to_user_id)
  WHERE converted_to_user_id IS NOT NULL;

-- ─── 3. Include-leads flag on segments ───────────────────────────

ALTER TABLE segments
  ADD COLUMN IF NOT EXISTS include_leads boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN segments.include_leads IS 'When true, broadcast campaigns using this segment also query the leads table for matching recipients.';

-- ─── 4. Indexes for lead broadcast queries ───────────────────────

CREATE INDEX IF NOT EXISTS idx_leads_interest_type ON leads (interest_type);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads (email);
CREATE INDEX IF NOT EXISTS idx_leads_type ON leads (type) WHERE type = 'waitlist';

-- ─── 5. Auto-subscribe new leads to default marketing topics ─────
-- Trigger: when a lead is inserted, subscribe them to all default
-- (non-required) topics.

CREATE OR REPLACE FUNCTION auto_subscribe_lead_topics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.crm_lead_topic_subscriptions (lead_id, topic_id, subscribed)
  SELECT NEW.id, t.id, true
  FROM public.crm_subscription_topics t
  WHERE t.is_default = true AND t.is_required = false
  ON CONFLICT (lead_id, topic_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lead_auto_subscribe ON leads;
CREATE TRIGGER trg_lead_auto_subscribe
  AFTER INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION auto_subscribe_lead_topics();
