-- ============================================================
-- 00074: CRM workflow engine additions
--
-- Adds:
--   1. context_data JSONB on enrollments (trigger metadata passed through)
--   2. workflow_id on logs (for easier querying)
--   3. Index for cron: active enrollments ready to process
-- ============================================================

-- ─── 1. Context data on enrollments ──────────────────────────────

ALTER TABLE crm_workflow_enrollments
  ADD COLUMN IF NOT EXISTS context_data jsonb DEFAULT '{}'::jsonb;

-- ─── 2. Workflow ID on logs for easier queries ───────────────────

ALTER TABLE crm_workflow_logs
  ADD COLUMN IF NOT EXISTS workflow_id uuid REFERENCES crm_workflows(id) ON DELETE CASCADE;

-- ─── 3. Index for cron runner: active enrollments ready to process

CREATE INDEX IF NOT EXISTS idx_wf_enrollments_ready
  ON crm_workflow_enrollments (status, wait_until)
  WHERE status = 'active';
