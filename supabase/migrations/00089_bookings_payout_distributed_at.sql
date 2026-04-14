-- ═══════════════════════════════════════════════════════════════════
-- 00089: bookings.payout_distributed_at
--
-- Adds a single-source-of-truth timestamp so the payout API can enforce
-- idempotency at the application layer: the first successful distribution
-- stamps this column inside a transaction, and subsequent calls short-circuit
-- with 409 instead of double-paying every participant.
--
-- Paired with Stripe-level idempotency_key on each createTransfer call.
-- ═══════════════════════════════════════════════════════════════════

alter table public.bookings
  add column if not exists payout_distributed_at timestamptz;

comment on column public.bookings.payout_distributed_at is
  'Set by /api/stripe/payout once all transfers have been created. Used as an application-level idempotency guard — a second call with this column set returns 409.';

create index if not exists idx_bookings_payout_distributed_at
  on public.bookings(payout_distributed_at)
  where payout_distributed_at is null;
