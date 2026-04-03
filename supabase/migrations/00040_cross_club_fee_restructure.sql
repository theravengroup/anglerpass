-- Cross-club fee restructure: $10 → $15/rod with home club referral split
--
-- New total: $15/rod/day for cross-club bookings
--   $10 → AnglerPass (platform revenue)
--   $5  → Home club (referral / network maintenance)
--
-- Adds home_club_referral column to bookings table.
-- Existing cross_club_fee values remain unchanged (they were $10/rod historically).
-- Going forward, cross_club_fee stores the full $15 and home_club_referral stores $5.

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS home_club_referral numeric(10,2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN bookings.home_club_referral IS
  'Home club referral ($5/rod) from the cross-club access fee. Paid to the angler''s home club for facilitating network access. $0 for home-club bookings.';

COMMENT ON COLUMN bookings.cross_club_fee IS
  'Cross-Club Network access fee ($15/rod total), $0 for home-club bookings. Paid by angler. Split: $10 AnglerPass + $5 home club referral.';
