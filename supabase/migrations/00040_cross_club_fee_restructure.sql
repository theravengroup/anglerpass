-- Cross-club fee restructure: add home club referral tracking
--
-- Current total: $25/rod/day for cross-club bookings
--   $20 → AnglerPass (platform revenue)
--   $5  → Home club (referral / network maintenance)
--
-- Adds home_club_referral column to bookings table.
-- cross_club_fee stores the full fee amount, home_club_referral stores the $5 portion.
-- Fee amounts are determined at runtime by src/lib/constants/fees.ts.

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS home_club_referral numeric(10,2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN bookings.home_club_referral IS
  'Home club referral ($5/rod) from the cross-club access fee. Paid to the angler''s home club for facilitating network access. $0 for home-club bookings.';

COMMENT ON COLUMN bookings.cross_club_fee IS
  'Cross-Club Network access fee ($25/rod total), $0 for home-club bookings. Paid by angler. Split: $20 AnglerPass + $5 home club referral.';
