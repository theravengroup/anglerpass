-- ============================================================
-- 00072: CRM API sends + template data support
--
-- Adds:
--   1. template_data JSONB on campaign_sends for custom variables
--   2. Relaxes campaign_id FK to allow API-triggered sends
--      without a campaign (nullable was already set in 00067)
-- ============================================================

-- Add template_data for Liquid template rendering context
ALTER TABLE campaign_sends
  ADD COLUMN IF NOT EXISTS template_data jsonb DEFAULT '{}'::jsonb;

-- Index for API send lookups (sends without a campaign)
CREATE INDEX IF NOT EXISTS idx_campaign_sends_no_campaign
  ON campaign_sends (recipient_email, created_at DESC)
  WHERE campaign_id IS NULL;
