-- Migration 00025: Update platform fee from 10% to 15%
--
-- AnglerPass platform fee is a markup on the landowner's rod fee, paid by the
-- angler. The fee covers the booking platform, payment processing, and trust
-- infrastructure. Rod fees flow through untouched to the landowner/club split.
--
-- Home-club booking:  rod fee + 15% platform fee
-- Cross-club booking: rod fee + 15% platform fee + $10/rod cross-club fee

update public.platform_settings
  set value = '15',
      description = 'Platform fee percentage added to rod fees on each booking (0-100)',
      updated_at = now()
  where key = 'platform_fee_percentage';
