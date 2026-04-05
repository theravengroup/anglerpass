-- Migration 00048: Add platform subscription fields to clubs
--
-- Tracks the Stripe subscription for the club's AnglerPass platform tier
-- (Starter $79/mo, Standard $199/mo, Pro $499/mo).

alter table public.clubs
  add column if not exists stripe_subscription_id text,
  add column if not exists platform_tier text;

comment on column public.clubs.stripe_subscription_id is
  'Stripe Subscription ID for the club platform tier billing';
comment on column public.clubs.platform_tier is
  'AnglerPass platform tier: starter, standard, or pro';

-- Also add stripe_customer_id to profiles for payment method storage
alter table public.profiles
  add column if not exists stripe_customer_id text;

comment on column public.profiles.stripe_customer_id is
  'Stripe Customer ID for storing payment methods and processing payments';
