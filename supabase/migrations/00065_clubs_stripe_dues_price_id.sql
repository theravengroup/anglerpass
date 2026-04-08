-- Add stripe_dues_price_id to clubs table.
-- This column stores the Stripe Price ID for recurring annual dues,
-- enabling membership-checkout to create subscriptions automatically.

alter table clubs
  add column if not exists stripe_dues_price_id text;

comment on column clubs.stripe_dues_price_id is
  'Stripe Price ID for the recurring annual dues product. Set by club admin when configuring dues billing.';
