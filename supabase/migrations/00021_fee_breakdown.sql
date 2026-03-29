-- Migration 00021: Add fee breakdown columns to bookings
--
-- Stores the full fee split for each booking to support Stripe payouts:
--   cross_club_fee     — $10/rod if cross-club, else $0
--   club_commission    — $5/rod from the landowner's rate, paid to the club
--   landowner_payout   — base_rate minus club_commission
--   is_cross_club      — whether this booking went through the Cross-Club Network
--
-- Existing columns already in bookings:
--   base_rate      — rod fee * party_size (total rod fees)
--   platform_fee   — 5% of base_rate
--   total_amount   — angler pays this (base_rate + platform_fee + cross_club_fee)

alter table public.bookings
  add column if not exists cross_club_fee numeric not null default 0,
  add column if not exists club_commission numeric not null default 0,
  add column if not exists landowner_payout numeric not null default 0,
  add column if not exists is_cross_club boolean not null default false;

-- Backfill landowner_payout for existing bookings (base_rate - $5 * party_size)
-- For existing bookings, club_commission = $5 * party_size
update public.bookings
  set club_commission = 5 * party_size,
      landowner_payout = base_rate - (5 * party_size)
  where landowner_payout = 0
    and base_rate > 0;

comment on column public.bookings.cross_club_fee is
  'Cross-Club Network fee ($10/rod), $0 for home-club bookings. Paid by angler, goes to AnglerPass.';
comment on column public.bookings.club_commission is
  'Per-rod club commission ($5/rod), deducted from landowner rate. Goes to the associated club.';
comment on column public.bookings.landowner_payout is
  'Net payout to landowner (base_rate - club_commission).';
comment on column public.bookings.is_cross_club is
  'Whether this booking was made through the Cross-Club Network.';
