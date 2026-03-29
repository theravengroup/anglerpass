-- Migration 00019: Add cancellation and refund tracking to bookings
-- Supports the tiered refund policy:
--   >48h before: 100% refund
--   <48h but before day of: 50% refund
--   Day of: 0% refund

alter table public.bookings
  add column if not exists refund_percentage integer default 0,
  add column if not exists refund_amount numeric default 0,
  add column if not exists cancellation_reason text;

comment on column public.bookings.refund_percentage is
  'Refund percentage applied at cancellation (0, 50, or 100)';
comment on column public.bookings.refund_amount is
  'Calculated refund amount in dollars';
comment on column public.bookings.cancellation_reason is
  'Optional reason provided by the angler when cancelling';
