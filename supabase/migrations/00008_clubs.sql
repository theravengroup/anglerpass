-- Phase 4: Club Management & Trust Layer
-- Creates clubs, club_memberships, and club_property_access tables.
-- Links into existing club_invitations table from migration 00007.

-- ─── Clubs ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES profiles(id),
  name text NOT NULL,
  description text,
  location text,
  rules text,
  website text,
  logo_url text,
  subscription_tier text NOT NULL DEFAULT 'starter'
    CHECK (subscription_tier IN ('starter', 'standard', 'pro')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clubs_owner ON clubs(owner_id);

-- ─── Club Memberships ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS club_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member'
    CHECK (role IN ('admin', 'member')),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'inactive', 'declined')),
  invited_email text,
  invited_at timestamptz,
  joined_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(club_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_club_memberships_club ON club_memberships(club_id);
CREATE INDEX IF NOT EXISTS idx_club_memberships_user ON club_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_club_memberships_email ON club_memberships(invited_email);

-- ─── Club–Property Access (many-to-many with approval) ─────────────
CREATE TABLE IF NOT EXISTS club_property_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'declined')),
  requested_by uuid NOT NULL REFERENCES profiles(id),
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(club_id, property_id)
);

CREATE INDEX IF NOT EXISTS idx_club_property_access_club ON club_property_access(club_id);
CREATE INDEX IF NOT EXISTS idx_club_property_access_property ON club_property_access(property_id);

-- ─── Link club_invitations to actual clubs ─────────────────────────
ALTER TABLE club_invitations ADD COLUMN IF NOT EXISTS club_id uuid REFERENCES clubs(id);

-- ─── RLS: clubs ────────────────────────────────────────────────────
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;

-- Club owners can manage their own clubs
CREATE POLICY "Club owners can view own clubs"
  ON clubs FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Club owners can update own clubs"
  ON clubs FOR UPDATE
  USING (owner_id = auth.uid());

-- Authenticated users can view clubs (for discovery / association)
CREATE POLICY "Authenticated users can view clubs"
  ON clubs FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Club admins can create clubs
CREATE POLICY "Authenticated users can create clubs"
  ON clubs FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- Admins can view all clubs
CREATE POLICY "Admins can view all clubs"
  ON clubs FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- ─── RLS: club_memberships ─────────────────────────────────────────
ALTER TABLE club_memberships ENABLE ROW LEVEL SECURITY;

-- Club owners can manage memberships for their clubs
CREATE POLICY "Club owners can view memberships"
  ON club_memberships FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM clubs WHERE clubs.id = club_memberships.club_id AND clubs.owner_id = auth.uid())
  );

CREATE POLICY "Club owners can create memberships"
  ON club_memberships FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM clubs WHERE clubs.id = club_memberships.club_id AND clubs.owner_id = auth.uid())
  );

CREATE POLICY "Club owners can update memberships"
  ON club_memberships FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM clubs WHERE clubs.id = club_memberships.club_id AND clubs.owner_id = auth.uid())
  );

-- Members can view their own membership
CREATE POLICY "Members can view own membership"
  ON club_memberships FOR SELECT
  USING (user_id = auth.uid());

-- Admins can view all memberships
CREATE POLICY "Admins can view all memberships"
  ON club_memberships FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- ─── RLS: club_property_access ─────────────────────────────────────
ALTER TABLE club_property_access ENABLE ROW LEVEL SECURITY;

-- Club owners can view and manage property access for their clubs
CREATE POLICY "Club owners can view property access"
  ON club_property_access FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM clubs WHERE clubs.id = club_property_access.club_id AND clubs.owner_id = auth.uid())
  );

CREATE POLICY "Club owners can update property access"
  ON club_property_access FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM clubs WHERE clubs.id = club_property_access.club_id AND clubs.owner_id = auth.uid())
  );

-- Property owners can view and create property access requests
CREATE POLICY "Property owners can view property access"
  ON club_property_access FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM properties WHERE properties.id = club_property_access.property_id AND properties.owner_id = auth.uid())
  );

CREATE POLICY "Property owners can create property access"
  ON club_property_access FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM properties WHERE properties.id = club_property_access.property_id AND properties.owner_id = auth.uid())
  );

-- Admins can view all property access
CREATE POLICY "Admins can view all property access"
  ON club_property_access FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );
