-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  00051 — Guide Trip Proposals                                      ║
-- ║  Tables: guide_trip_proposals, guide_trip_proposal_invitees         ║
-- ║  Allows guides to build and send proposed trips to anglers.         ║
-- ║  On acceptance, a confirmed booking is created.                     ║
-- ╚══════════════════════════════════════════════════════════════════════╝

-- ── 1. guide_trip_proposals ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS guide_trip_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id uuid NOT NULL REFERENCES guide_profiles(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,

  proposed_date date NOT NULL,
  start_time time NOT NULL,
  duration_hours integer NOT NULL CHECK (duration_hours >= 1 AND duration_hours <= 16),
  max_anglers integer NOT NULL DEFAULT 1 CHECK (max_anglers >= 1 AND max_anglers <= 20),
  guide_fee_per_angler numeric(10,2) NOT NULL CHECK (guide_fee_per_angler >= 0),
  notes text,

  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'accepted', 'declined', 'expired', 'cancelled')),

  expires_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_proposals_guide ON guide_trip_proposals(guide_id);
CREATE INDEX IF NOT EXISTS idx_proposals_property ON guide_trip_proposals(property_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON guide_trip_proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_date ON guide_trip_proposals(proposed_date);
CREATE INDEX IF NOT EXISTS idx_proposals_expires ON guide_trip_proposals(expires_at)
  WHERE status = 'sent';

-- Auto-update updated_at
CREATE OR REPLACE TRIGGER guide_trip_proposals_updated_at
  BEFORE UPDATE ON guide_trip_proposals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS
ALTER TABLE guide_trip_proposals ENABLE ROW LEVEL SECURITY;

-- Guide can view own proposals
CREATE POLICY "guide_trip_proposals_own_read"
  ON guide_trip_proposals FOR SELECT
  USING (
    guide_id IN (
      SELECT id FROM guide_profiles WHERE user_id = auth.uid()
    )
  );

-- Guide can create proposals
CREATE POLICY "guide_trip_proposals_own_insert"
  ON guide_trip_proposals FOR INSERT
  WITH CHECK (
    guide_id IN (
      SELECT id FROM guide_profiles WHERE user_id = auth.uid()
    )
  );

-- Guide can update own proposals (status changes, edits)
CREATE POLICY "guide_trip_proposals_own_update"
  ON guide_trip_proposals FOR UPDATE
  USING (
    guide_id IN (
      SELECT id FROM guide_profiles WHERE user_id = auth.uid()
    )
  );

-- NOTE: invitee_read policy is defined after the invitees table below

-- Admin can view all proposals
CREATE POLICY "guide_trip_proposals_admin_read"
  ON guide_trip_proposals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ── 2. guide_trip_proposal_invitees ────────────────────────────────────

CREATE TABLE IF NOT EXISTS guide_trip_proposal_invitees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES guide_trip_proposals(id) ON DELETE CASCADE,
  angler_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined')),

  responded_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE(proposal_id, angler_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_proposal_invitees_proposal ON guide_trip_proposal_invitees(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_invitees_angler ON guide_trip_proposal_invitees(angler_id);

-- RLS
ALTER TABLE guide_trip_proposal_invitees ENABLE ROW LEVEL SECURITY;

-- Anglers can view invitations sent to them
CREATE POLICY "proposal_invitees_own_read"
  ON guide_trip_proposal_invitees FOR SELECT
  USING (angler_id = auth.uid());

-- Anglers can update their own invitee status (accept/decline)
CREATE POLICY "proposal_invitees_own_update"
  ON guide_trip_proposal_invitees FOR UPDATE
  USING (angler_id = auth.uid());

-- Guide can view invitees on their proposals
CREATE POLICY "proposal_invitees_guide_read"
  ON guide_trip_proposal_invitees FOR SELECT
  USING (
    proposal_id IN (
      SELECT id FROM guide_trip_proposals
      WHERE guide_id IN (
        SELECT id FROM guide_profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Guide can insert invitees on their proposals
CREATE POLICY "proposal_invitees_guide_insert"
  ON guide_trip_proposal_invitees FOR INSERT
  WITH CHECK (
    proposal_id IN (
      SELECT id FROM guide_trip_proposals
      WHERE guide_id IN (
        SELECT id FROM guide_profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Admin can view all
CREATE POLICY "proposal_invitees_admin_read"
  ON guide_trip_proposal_invitees FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ── 3. Deferred RLS policy (requires invitees table) ──────────────────

-- Anglers who are invitees can view the proposal
CREATE POLICY "guide_trip_proposals_invitee_read"
  ON guide_trip_proposals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM guide_trip_proposal_invitees
      WHERE guide_trip_proposal_invitees.proposal_id = guide_trip_proposals.id
        AND guide_trip_proposal_invitees.angler_id = auth.uid()
    )
  );

-- ── 4. Comments ────────────────────────────────────────────────────────

COMMENT ON TABLE guide_trip_proposals IS
  'Guide-initiated trip proposals. Guides build a proposed trip and send it to anglers for acceptance.';

COMMENT ON COLUMN guide_trip_proposals.guide_fee_per_angler IS
  'Guide''s fee per angler for this trip. Subject to AnglerPass service fee (guide_service_fee_pct from platform_settings).';

COMMENT ON COLUMN guide_trip_proposals.expires_at IS
  'Proposal expiry. Set to 72 hours after status changes to sent. NULL for drafts.';

COMMENT ON TABLE guide_trip_proposal_invitees IS
  'Anglers invited to a guide trip proposal. Each invitee can independently accept or decline.';
