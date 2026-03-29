-- Phase 5: Angler Discovery & Booking
-- Bookings flow through club membership — anglers cannot book without belonging
-- to a club that has access to the property.

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  angler_id uuid NOT NULL REFERENCES profiles(id),
  club_membership_id uuid NOT NULL REFERENCES club_memberships(id),
  booking_date date NOT NULL,
  duration text NOT NULL DEFAULT 'full_day'
    CHECK (duration IN ('full_day', 'half_day')),
  party_size integer NOT NULL DEFAULT 1
    CHECK (party_size >= 1 AND party_size <= 20),
  base_rate numeric(10,2) NOT NULL,
  platform_fee numeric(10,2) NOT NULL DEFAULT 0,
  total_amount numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'declined', 'cancelled', 'completed')),
  message text,
  landowner_notes text,
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bookings_property ON bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_bookings_angler ON bookings(angler_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_membership ON bookings(club_membership_id);

-- Prevent double-booking: same property + same date + confirmed
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_unique_confirmed
  ON bookings(property_id, booking_date)
  WHERE status IN ('pending', 'confirmed');

-- RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Anglers can view their own bookings
CREATE POLICY "Anglers can view own bookings"
  ON bookings FOR SELECT
  USING (angler_id = auth.uid());

-- Anglers can create bookings
CREATE POLICY "Anglers can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (angler_id = auth.uid());

-- Anglers can cancel their own pending bookings
CREATE POLICY "Anglers can update own bookings"
  ON bookings FOR UPDATE
  USING (angler_id = auth.uid());

-- Property owners can view bookings for their properties
CREATE POLICY "Landowners can view property bookings"
  ON bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = bookings.property_id
      AND properties.owner_id = auth.uid()
    )
  );

-- Property owners can update booking status (confirm/decline)
CREATE POLICY "Landowners can update property bookings"
  ON bookings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = bookings.property_id
      AND properties.owner_id = auth.uid()
    )
  );

-- Club admins can view bookings made through their club
CREATE POLICY "Club admins can view club bookings"
  ON bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM club_memberships cm
      JOIN clubs c ON c.id = cm.club_id
      WHERE cm.id = bookings.club_membership_id
      AND c.owner_id = auth.uid()
    )
  );

-- Admins can view all bookings
CREATE POLICY "Admins can view all bookings"
  ON bookings FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );
