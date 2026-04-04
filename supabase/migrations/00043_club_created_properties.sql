-- Migration 00043: Club-created properties, landowner claim invitations, consultation requests
-- Supports: (1) clubs creating properties on behalf of landowners, (2) landowner claim flow,
-- (3) consultation booking for white-glove migration.

-- ─── 1. Allow properties without an owner (club-created, unclaimed) ────────────

ALTER TABLE properties ALTER COLUMN owner_id DROP NOT NULL;

ALTER TABLE properties
  ADD COLUMN created_by_club_id uuid REFERENCES clubs(id) ON DELETE SET NULL;

CREATE INDEX idx_properties_created_by_club ON properties(created_by_club_id)
  WHERE created_by_club_id IS NOT NULL;

-- Every property must have either an owner or a creating club
ALTER TABLE properties
  ADD CONSTRAINT chk_property_has_owner_or_club
  CHECK (owner_id IS NOT NULL OR created_by_club_id IS NOT NULL);

-- ─── 2. Property claim invitations ────────────────────────────────────────────

CREATE TABLE property_claim_invitations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  club_id     uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  landowner_email text NOT NULL,
  token       uuid NOT NULL DEFAULT gen_random_uuid(),
  status      text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'claimed', 'expired', 'cancelled')),
  reminder_count  integer NOT NULL DEFAULT 0,
  last_reminded_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  claimed_at  timestamptz,
  claimed_by  uuid REFERENCES profiles(id)
);

CREATE UNIQUE INDEX idx_claim_invitation_token ON property_claim_invitations(token);
CREATE INDEX idx_claim_invitation_property ON property_claim_invitations(property_id);
CREATE INDEX idx_claim_invitation_email ON property_claim_invitations(landowner_email);
CREATE INDEX idx_claim_invitation_pending ON property_claim_invitations(status)
  WHERE status = 'pending';

-- ─── 3. Consultation requests ─────────────────────────────────────────────────

CREATE TABLE consultation_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  email           text NOT NULL,
  organization    text NOT NULL,
  property_count  integer,
  preferred_dates text,
  notes           text,
  status          text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'contacted', 'completed', 'cancelled')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── 4. RLS policies ──────────────────────────────────────────────────────────

-- Property claim invitations: club staff can view and create for their club
ALTER TABLE property_claim_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Club staff can view claim invitations for their club"
  ON property_claim_invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM club_memberships cm
      WHERE cm.club_id = property_claim_invitations.club_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
        AND cm.role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "Club staff can create claim invitations for their club"
  ON property_claim_invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM club_memberships cm
      WHERE cm.club_id = property_claim_invitations.club_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
        AND cm.role IN ('owner', 'admin', 'manager')
    )
  );

-- Consultation requests: admin only via service role
ALTER TABLE consultation_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read consultation requests"
  ON consultation_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Club staff can view properties they created
CREATE POLICY "Club staff can view club-created properties"
  ON properties FOR SELECT
  USING (
    created_by_club_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM club_memberships cm
      WHERE cm.club_id = properties.created_by_club_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
        AND cm.role IN ('owner', 'admin', 'manager')
    )
  );

-- Club staff can update unclaimed properties they created
CREATE POLICY "Club staff can update unclaimed club-created properties"
  ON properties FOR UPDATE
  USING (
    owner_id IS NULL
    AND created_by_club_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM club_memberships cm
      WHERE cm.club_id = properties.created_by_club_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
        AND cm.role IN ('owner', 'admin', 'manager')
    )
  );
