-- Club invitations: allows landowners to invite clubs to associate with their properties
-- This is a pre-Phase 4 table that enables the club association flow on property registration.
-- When Phase 4 builds the full clubs table, invitations will be linked to actual club records.

CREATE TABLE IF NOT EXISTS club_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL REFERENCES profiles(id),
  club_name text NOT NULL,
  admin_email text NOT NULL,
  token uuid NOT NULL DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'accepted', 'declined', 'expired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for looking up invitations by property
CREATE INDEX IF NOT EXISTS idx_club_invitations_property ON club_invitations(property_id);

-- Index for looking up invitations by email (for when club admin signs up)
CREATE INDEX IF NOT EXISTS idx_club_invitations_email ON club_invitations(admin_email);

-- Index for token lookup (for invitation links)
CREATE INDEX IF NOT EXISTS idx_club_invitations_token ON club_invitations(token);

-- RLS
ALTER TABLE club_invitations ENABLE ROW LEVEL SECURITY;

-- Landowners can view invitations for their own properties
CREATE POLICY "Landowners can view own property invitations"
  ON club_invitations FOR SELECT
  USING (
    invited_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM properties WHERE properties.id = club_invitations.property_id AND properties.owner_id = auth.uid()
    )
  );

-- Landowners can create invitations for their own properties
CREATE POLICY "Landowners can create invitations for own properties"
  ON club_invitations FOR INSERT
  WITH CHECK (
    invited_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM properties WHERE properties.id = club_invitations.property_id AND properties.owner_id = auth.uid()
    )
  );

-- Admins can view all invitations
CREATE POLICY "Admins can view all invitations"
  ON club_invitations FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );
