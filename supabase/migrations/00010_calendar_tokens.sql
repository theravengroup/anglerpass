-- Phase 5b: Calendar Feeds (iCal)
-- Private calendar tokens for landowner property feeds

CREATE TABLE IF NOT EXISTS calendar_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  token uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(property_id)
);

CREATE INDEX IF NOT EXISTS idx_calendar_tokens_token ON calendar_tokens(token);

-- RLS
ALTER TABLE calendar_tokens ENABLE ROW LEVEL SECURITY;

-- Property owners can manage their calendar tokens
CREATE POLICY "Property owners can view own tokens"
  ON calendar_tokens FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = calendar_tokens.property_id
      AND properties.owner_id = auth.uid()
    )
  );

CREATE POLICY "Property owners can create tokens"
  ON calendar_tokens FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = calendar_tokens.property_id
      AND properties.owner_id = auth.uid()
    )
  );

CREATE POLICY "Property owners can delete tokens"
  ON calendar_tokens FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = calendar_tokens.property_id
      AND properties.owner_id = auth.uid()
    )
  );

-- Admins can view all tokens
CREATE POLICY "Admins can view all tokens"
  ON calendar_tokens FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );
