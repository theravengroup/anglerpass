-- ============================================================
-- 00073: CRM visual workflow builder
--
-- Adds:
--   1. crm_workflows — workflow definitions
--   2. crm_workflow_nodes — nodes in the workflow graph
--   3. crm_workflow_edges — connections between nodes
--   4. crm_workflow_enrollments — users progressing through workflows
--   5. crm_workflow_logs — execution audit trail
-- ============================================================

-- ─── 1. Workflows ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS crm_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  trigger_event text,
  segment_id uuid REFERENCES segments(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  activated_at timestamptz,
  paused_at timestamptz
);

ALTER TABLE crm_workflows ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_workflows_status ON crm_workflows (status);
CREATE INDEX idx_workflows_trigger ON crm_workflows (trigger_event) WHERE trigger_event IS NOT NULL;

-- ─── 2. Workflow Nodes ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS crm_workflow_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES crm_workflows(id) ON DELETE CASCADE,
  type text NOT NULL
    CHECK (type IN ('trigger', 'send_email', 'delay', 'condition', 'split', 'end')),
  label text NOT NULL DEFAULT '',
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  position_x real NOT NULL DEFAULT 0,
  position_y real NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE crm_workflow_nodes ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_workflow_nodes_workflow ON crm_workflow_nodes (workflow_id);

-- ─── 3. Workflow Edges ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS crm_workflow_edges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES crm_workflows(id) ON DELETE CASCADE,
  source_node_id uuid NOT NULL REFERENCES crm_workflow_nodes(id) ON DELETE CASCADE,
  target_node_id uuid NOT NULL REFERENCES crm_workflow_nodes(id) ON DELETE CASCADE,
  source_handle text DEFAULT 'default',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE crm_workflow_edges ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_workflow_edges_workflow ON crm_workflow_edges (workflow_id);
CREATE INDEX idx_workflow_edges_source ON crm_workflow_edges (source_node_id);

-- ─── 4. Workflow Enrollments ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS crm_workflow_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES crm_workflows(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text NOT NULL,
  current_node_id uuid REFERENCES crm_workflow_nodes(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'paused', 'exited')),
  wait_until timestamptz,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  last_processed_at timestamptz
);

ALTER TABLE crm_workflow_enrollments ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_wf_enrollments_workflow ON crm_workflow_enrollments (workflow_id, status);
CREATE INDEX idx_wf_enrollments_waiting ON crm_workflow_enrollments (wait_until)
  WHERE status = 'active' AND wait_until IS NOT NULL;
CREATE UNIQUE INDEX idx_wf_enrollments_unique ON crm_workflow_enrollments (workflow_id, email)
  WHERE status = 'active';

-- ─── 5. Workflow Execution Logs ───────────────────────────────────

CREATE TABLE IF NOT EXISTS crm_workflow_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES crm_workflow_enrollments(id) ON DELETE CASCADE,
  node_id uuid REFERENCES crm_workflow_nodes(id) ON DELETE SET NULL,
  action text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE crm_workflow_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_wf_logs_enrollment ON crm_workflow_logs (enrollment_id, created_at DESC);
