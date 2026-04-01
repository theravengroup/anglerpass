-- Migration 00023: Membership cancellations, club removals, and rejoin fees
--
-- Member voluntary cancellation:
--   - Membership stays active through paid period
--   - 14-day undo window to reverse the cancellation
--   - After effective date, status → 'cancelled'
--   - Future bookings past effective date are auto-cancelled
--
-- Club-initiated removal (for cause):
--   - Immediate, no refund or proration
--   - Status → 'removed'
--   - All future bookings auto-cancelled
--
-- Rejoining after cancellation:
--   - Rejoin fee = 50% of current initiation fee
--   - Must also pay current annual dues
--   - No new application required (already vetted)

-- ============================================================
-- 1. Extend club_memberships status to include 'cancelled' and 'removed'
-- ============================================================

-- Drop the existing inline check constraint
-- Postgres names inline check constraints as: {table}_{column}_check
alter table public.club_memberships
  drop constraint if exists club_memberships_status_check;

-- Recreate with new statuses
alter table public.club_memberships
  add constraint club_memberships_status_check
    check (status in ('pending', 'active', 'inactive', 'declined', 'cancelled', 'removed'));

-- ============================================================
-- 2. Add cancellation/removal tracking fields to club_memberships
-- ============================================================

alter table public.club_memberships
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancellation_effective_date date,
  add column if not exists cancellation_undo_deadline date,
  add column if not exists removed_at timestamptz,
  add column if not exists removed_by uuid references public.profiles(id),
  add column if not exists removal_reason text;

comment on column public.club_memberships.cancelled_at is
  'When the member initiated voluntary cancellation. Null if not cancelled.';
comment on column public.club_memberships.cancellation_effective_date is
  'Date when cancellation takes effect (end of paid period). Membership active until then.';
comment on column public.club_memberships.cancellation_undo_deadline is
  'Member can undo cancellation until this date (cancelled_at + 14 days).';
comment on column public.club_memberships.removed_at is
  'When the club removed this member for cause. Immediate effect.';
comment on column public.club_memberships.removed_by is
  'Club admin or owner who initiated the removal.';
comment on column public.club_memberships.removal_reason is
  'Reason for club-initiated removal (required, shown to member).';

-- ============================================================
-- 3. Extend membership_payments type to include 'rejoin'
-- ============================================================

-- Drop the existing type check constraint
alter table public.membership_payments
  drop constraint if exists membership_payments_type_check;

-- Recreate with 'rejoin' added
alter table public.membership_payments
  add constraint membership_payments_type_check
    check (type in ('initiation', 'annual_dues', 'rejoin'));

-- ============================================================
-- 4. Platform settings for cancellation/rejoin
-- ============================================================

insert into public.platform_settings (key, value, description) values
  ('membership_cancellation_undo_days', '14', 'Number of days a member can undo a voluntary cancellation'),
  ('rejoin_fee_percentage', '50', 'Percentage of current initiation fee charged as rejoin fee (0-100)')
on conflict (key) do nothing;
