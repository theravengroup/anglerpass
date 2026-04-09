-- ============================================================
-- 00070: CRM dashboard snapshots
-- Daily aggregated CRM metrics for fast dashboard loading.
-- ============================================================

CREATE TABLE IF NOT EXISTS crm_dashboard_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date date NOT NULL UNIQUE,
  total_contacts int NOT NULL DEFAULT 0,
  total_leads int NOT NULL DEFAULT 0,
  active_campaigns int NOT NULL DEFAULT 0,
  active_workflows int NOT NULL DEFAULT 0,
  sends_7d int NOT NULL DEFAULT 0,
  sends_30d int NOT NULL DEFAULT 0,
  delivered_7d int NOT NULL DEFAULT 0,
  delivered_30d int NOT NULL DEFAULT 0,
  opens_7d int NOT NULL DEFAULT 0,
  opens_30d int NOT NULL DEFAULT 0,
  clicks_7d int NOT NULL DEFAULT 0,
  clicks_30d int NOT NULL DEFAULT 0,
  bounces_7d int NOT NULL DEFAULT 0,
  bounces_30d int NOT NULL DEFAULT 0,
  unsubscribes_7d int NOT NULL DEFAULT 0,
  unsubscribes_30d int NOT NULL DEFAULT 0,
  open_rate_7d real NOT NULL DEFAULT 0,
  click_rate_7d real NOT NULL DEFAULT 0,
  sends_by_day jsonb NOT NULL DEFAULT '[]'::jsonb,
  opens_by_day jsonb NOT NULL DEFAULT '[]'::jsonb,
  clicks_by_day jsonb NOT NULL DEFAULT '[]'::jsonb,
  top_campaigns jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE crm_dashboard_snapshots ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_crm_snapshots_date ON crm_dashboard_snapshots (snapshot_date DESC);
