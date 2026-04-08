-- Property Availability Management
-- Allows landowners and club admins to block/open dates for properties.
-- Default state is "available" — only blocked dates need records.

CREATE TABLE public.property_availability (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id   uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  date          date NOT NULL,
  status        text NOT NULL DEFAULT 'blocked'
                CHECK (status IN ('available', 'blocked', 'booked', 'maintenance')),
  reason        text,
  booking_id    uuid REFERENCES public.bookings(id),
  created_by    uuid REFERENCES auth.users(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(property_id, date)
);

-- Index for date range lookups
CREATE INDEX idx_property_availability_date_range
  ON property_availability (property_id, date);

-- Index for blocked-date filtering (booking validation)
CREATE INDEX idx_property_availability_blocked
  ON property_availability (property_id, status, date)
  WHERE status IN ('blocked', 'maintenance');

-- RLS
ALTER TABLE property_availability ENABLE ROW LEVEL SECURITY;

-- Property owners can manage their own availability
CREATE POLICY "Property owners can manage availability"
  ON property_availability
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_availability.property_id
      AND properties.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_availability.property_id
      AND properties.owner_id = auth.uid()
    )
  );

-- Anyone can read availability (for booking checks)
CREATE POLICY "Anyone can read availability"
  ON property_availability
  FOR SELECT
  TO authenticated
  USING (true);

-- Club admins/managers can manage availability for their club's properties
CREATE POLICY "Club admins can manage availability"
  ON property_availability
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM club_property_access cpa
      JOIN club_memberships cm ON cm.club_id = cpa.club_id
      WHERE cpa.property_id = property_availability.property_id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('admin', 'manager', 'owner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM club_property_access cpa
      JOIN club_memberships cm ON cm.club_id = cpa.club_id
      WHERE cpa.property_id = property_availability.property_id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('admin', 'manager', 'owner')
    )
  );

-- When a booking is confirmed, auto-mark those dates as "booked"
-- (handled in application code, not a trigger, for flexibility)

COMMENT ON TABLE property_availability IS
  'Tracks property availability. Default is available — only blocked/maintenance/booked dates need records.';
