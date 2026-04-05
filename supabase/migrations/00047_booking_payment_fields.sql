-- Migration 00047: Add payment tracking fields to bookings
--
-- Supports the Stripe Payment Intent lifecycle:
--   - hold (requires_capture) → capture (succeeded) → payout (transferred)
--   - or: hold → cancel (released)

alter table public.bookings
  add column if not exists stripe_payment_intent_id text,
  add column if not exists payment_status text default 'unpaid'
    check (payment_status in ('unpaid', 'hold', 'succeeded', 'failed', 'refunded', 'partial_refund')),
  add column if not exists amount_cents integer,
  add column if not exists platform_fee_cents integer,
  add column if not exists paid_at timestamptz,
  add column if not exists refunded_at timestamptz;

create index if not exists idx_bookings_payment_intent
  on public.bookings(stripe_payment_intent_id);

create index if not exists idx_bookings_payment_status
  on public.bookings(payment_status);

comment on column public.bookings.stripe_payment_intent_id is
  'Stripe Payment Intent ID for this booking';
comment on column public.bookings.payment_status is
  'Payment lifecycle: unpaid → hold → succeeded → refunded';
comment on column public.bookings.amount_cents is
  'Total amount charged to angler in cents (rod fee + platform fee + cross-club fee)';
comment on column public.bookings.platform_fee_cents is
  'Platform fee portion in cents (15% of base rod fee)';

-- ============================================================
-- Webhook event log for idempotency
-- ============================================================

create table if not exists public.stripe_webhook_events (
  id text primary key,                    -- Stripe event ID (evt_...)
  type text not null,                     -- e.g. payment_intent.succeeded
  processed_at timestamptz not null default now(),
  data jsonb                              -- summary of what was processed
);

comment on table public.stripe_webhook_events is
  'Idempotency table for Stripe webhook events. Prevents double-processing.';
