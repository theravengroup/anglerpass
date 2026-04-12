-- Migration 00022: Membership fees, applications, and payment tracking
--
-- Clubs set their own initiation fees and annual dues.
-- AnglerPass adds a 5% platform fee on top, paid by the member.
-- Clubs receive 100% of their stated fees.
--
-- Flow: Application → Club Approval → Payment (initiation + first year dues) → Active
-- Annual dues auto-renew via Stripe Subscription with 7-day grace period.

-- ============================================================
-- 1. Add membership fee columns to clubs
-- ============================================================

alter table public.clubs
  add column if not exists initiation_fee numeric(10,2) default 0,
  add column if not exists annual_dues numeric(10,2) default 0,
  add column if not exists membership_application_required boolean not null default true;

comment on column public.clubs.initiation_fee is
  'One-time initiation fee set by the club (e.g. $350). Paid by new members.';
comment on column public.clubs.annual_dues is
  'Annual membership dues set by the club (e.g. $175). Auto-renews via Stripe.';
comment on column public.clubs.membership_application_required is
  'Whether new members must be approved by club admin before paying.';

-- ============================================================
-- 2. Membership applications (apply → approve/decline → pay)
-- ============================================================

create table if not exists public.membership_applications (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'declined', 'withdrawn', 'payment_pending', 'completed')),
  application_note text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  declined_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(club_id, user_id)
);

create index idx_membership_applications_club on public.membership_applications(club_id);
create index idx_membership_applications_user on public.membership_applications(user_id);
create index idx_membership_applications_status on public.membership_applications(status);

comment on table public.membership_applications is
  'Tracks membership applications. Flow: pending → approved → payment_pending → completed';

-- RLS
alter table public.membership_applications enable row level security;

create policy "Users can view own applications"
  on public.membership_applications for select
  using (user_id = auth.uid());

create policy "Users can create applications"
  on public.membership_applications for insert
  with check (user_id = auth.uid());

create policy "Users can withdraw own applications"
  on public.membership_applications for update
  using (user_id = auth.uid() and status = 'pending')
  with check (status = 'withdrawn');

create policy "Club admins can view applications for their clubs"
  on public.membership_applications for select
  using (
    exists (
      select 1 from public.club_memberships
      where club_id = membership_applications.club_id
        and user_id = auth.uid()
        and role = 'admin'
        and status = 'active'
    )
  );

create policy "Club admins can update applications for their clubs"
  on public.membership_applications for update
  using (
    exists (
      select 1 from public.club_memberships
      where club_id = membership_applications.club_id
        and user_id = auth.uid()
        and role = 'admin'
        and status = 'active'
    )
  );

create policy "Club owners can view applications"
  on public.membership_applications for select
  using (
    exists (
      select 1 from public.clubs
      where id = membership_applications.club_id
        and owner_id = auth.uid()
    )
  );

create policy "Club owners can update applications"
  on public.membership_applications for update
  using (
    exists (
      select 1 from public.clubs
      where id = membership_applications.club_id
        and owner_id = auth.uid()
    )
  );

create policy "Admins can view all applications"
  on public.membership_applications for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- 3. Membership payments (initiation fees + annual dues)
-- ============================================================

create table if not exists public.membership_payments (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  membership_id uuid references public.club_memberships(id) on delete set null,
  application_id uuid references public.membership_applications(id) on delete set null,

  -- Payment type
  type text not null check (type in ('initiation', 'annual_dues')),

  -- Amounts
  club_amount numeric(10,2) not null,          -- what the club set (e.g. $350)
  processing_fee numeric(10,2) not null,       -- 5% platform fee of club_amount (e.g. $17.50)
  total_charged numeric(10,2) not null,        -- club_amount + processing_fee (member pays this)
  club_payout numeric(10,2) not null,          -- same as club_amount (club gets 100%)

  -- Stripe references
  stripe_payment_intent_id text,
  stripe_subscription_id text,                 -- for annual dues recurring
  stripe_invoice_id text,

  -- Status
  status text not null default 'pending'
    check (status in ('pending', 'succeeded', 'failed', 'refunded', 'past_due', 'grace_period')),

  -- Subscription period (for annual dues)
  period_start date,
  period_end date,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_membership_payments_club on public.membership_payments(club_id);
create index idx_membership_payments_user on public.membership_payments(user_id);
create index idx_membership_payments_membership on public.membership_payments(membership_id);
create index idx_membership_payments_status on public.membership_payments(status);
create index idx_membership_payments_stripe_sub on public.membership_payments(stripe_subscription_id);

comment on table public.membership_payments is
  'Tracks all membership-related payments. Platform fee (5%) is added on top and paid by the member. Club receives 100% of their stated fee.';

-- RLS
alter table public.membership_payments enable row level security;

create policy "Users can view own payments"
  on public.membership_payments for select
  using (user_id = auth.uid());

create policy "Club admins can view payments for their clubs"
  on public.membership_payments for select
  using (
    exists (
      select 1 from public.club_memberships
      where club_id = membership_payments.club_id
        and user_id = auth.uid()
        and role = 'admin'
        and status = 'active'
    )
  );

create policy "Club owners can view payments"
  on public.membership_payments for select
  using (
    exists (
      select 1 from public.clubs
      where id = membership_payments.club_id
        and owner_id = auth.uid()
    )
  );

create policy "Admins can view all payments"
  on public.membership_payments for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- 4. Add Stripe customer/subscription fields to club_memberships
-- ============================================================

alter table public.club_memberships
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists dues_status text default 'none'
    check (dues_status in ('none', 'active', 'past_due', 'grace_period', 'lapsed', 'exempt')),
  add column if not exists dues_paid_through date,
  add column if not exists grace_period_ends date;

comment on column public.club_memberships.stripe_customer_id is
  'Stripe Customer ID for this member (used for subscription billing and portal access)';
comment on column public.club_memberships.stripe_subscription_id is
  'Stripe Subscription ID for recurring annual dues';
comment on column public.club_memberships.dues_status is
  'Current dues payment status: active, past_due (within grace), grace_period, lapsed, or exempt';
comment on column public.club_memberships.dues_paid_through is
  'Date through which annual dues are paid';
comment on column public.club_memberships.grace_period_ends is
  'End of 7-day grace period after failed renewal. Membership lapses if not resolved.';

-- ============================================================
-- 5. Platform settings for membership processing
-- ============================================================

insert into public.platform_settings (key, value, description) values
  ('membership_processing_fee_pct', '5', 'Platform fee percentage added to membership payments (paid by member)'),
  ('membership_renewal_grace_days', '7', 'Number of days grace period after failed annual dues renewal')
on conflict (key) do nothing;
