-- Add is_active flag to clubs (default false — clubs start inactive until owner activates)
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT false;

-- Index for filtering active/inactive clubs
CREATE INDEX IF NOT EXISTS idx_clubs_is_active ON clubs (is_active);
