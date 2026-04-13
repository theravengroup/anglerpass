-- Extend calendar token system for aggregate landowner feeds and club feeds.
-- Landowner tokens cover ALL properties owned by that user (auto-updates on add/revoke).
-- Club tokens cover ALL bookings across club-associated properties.

-- ═══ Landowner aggregate calendar tokens ════════════════════════════════

CREATE TABLE IF NOT EXISTS landowner_calendar_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_landowner_calendar_tokens_token
  ON landowner_calendar_tokens(token);

ALTER TABLE landowner_calendar_tokens ENABLE ROW LEVEL SECURITY;

-- Landowners can manage their own token (service-role handles API access)

-- ═══ Club calendar tokens ═══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS club_calendar_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  token uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(club_id)
);

CREATE INDEX IF NOT EXISTS idx_club_calendar_tokens_token
  ON club_calendar_tokens(token);

ALTER TABLE club_calendar_tokens ENABLE ROW LEVEL SECURITY;

-- Club admins can manage their own token (service-role handles API access)
