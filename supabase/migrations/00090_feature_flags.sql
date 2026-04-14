-- ═══════════════════════════════════════════════════════════════════
-- 00090: feature_flags — launch kill switches
--
-- Instant off-switches for the critical Layer-2 surfaces. When something
-- is on fire, an admin flips a row and every new request to that surface
-- gets a 503. No redeploy, no rollback, no migration.
--
-- The server-side cache has a short TTL (≤30s), so a flip propagates
-- across the fleet within seconds.
-- ═══════════════════════════════════════════════════════════════════

create table if not exists public.feature_flags (
  key         text primary key,
  enabled     boolean not null default true,
  description text,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users(id) on delete set null
);

comment on table public.feature_flags is
  'Launch kill switches. A row with enabled=false causes the matching API route to 503. Only platform admins can mutate. Server caches reads for ≤30s.';

alter table public.feature_flags enable row level security;

-- Anyone authenticated may read (so client components could hide UI when
-- a feature is off) — no secrets live here, just a boolean per key.
create policy feature_flags_read on public.feature_flags
  for select using (auth.role() = 'authenticated');

-- Only platform admins may write. The admin API route uses the
-- service-role client, which bypasses RLS — this policy is a defence
-- in depth against any future anon/user-level writes.
create policy feature_flags_admin_write on public.feature_flags
  for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  ) with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ─── Seed the launch kill-switch keys ──────────────────────────────
-- All default to enabled=true. Admins flip to false when on fire.
insert into public.feature_flags (key, description) values
  ('bookings.create',              'Angler-initiated booking creation.'),
  ('stripe.payout',                'Landowner/club/guide payout distribution.'),
  ('stripe.membership_checkout',   'New club membership + corporate-seat checkout.'),
  ('stripe.guide_verification',    'Guide verification fee payment.'),
  ('stripe.compass_credits',       'Compass credit pack purchases.'),
  ('messaging.send',               'New in-platform messages.'),
  ('guide.verification_submit',    'Guide verification profile submission.'),
  ('cross_club.agreements',        'Proposing new cross-club agreements.'),
  ('corporate.invitations',        'Corporate members inviting new seats.'),
  ('property.claim',               'Landowner property-claim flow.'),
  ('webhooks.resend',              'Resend email webhook processing.'),
  ('webhooks.stripe',              'Stripe (main) webhook processing.'),
  ('webhooks.stripe_verification', 'Stripe guide-verification webhook.'),
  ('webhooks.checkr',              'Checkr background-check webhook.')
on conflict (key) do nothing;
