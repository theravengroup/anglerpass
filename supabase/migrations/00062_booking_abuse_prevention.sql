-- Booking abuse prevention: standing system, late-cancel fees, property limits
-- Adds per-user booking standing, cancellation scoring, and property-level controls

-- ─── Booking Standing ─────────────────────────────────────────────────

create table if not exists booking_standing (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade unique,
  standing text not null default 'good'
    check (standing in ('good', 'warned', 'restricted', 'suspended')),
  concurrent_cap int not null default 6,
  cancellation_score numeric(5,4) not null default 0,
  cancellation_score_updated_at timestamptz,
  updated_by uuid references profiles(id),
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_booking_standing_user on booking_standing(user_id);
create index if not exists idx_booking_standing_standing on booking_standing(standing);

alter table booking_standing enable row level security;

create policy "Users can view own standing"
  on booking_standing for select
  using (auth.uid() = user_id);

-- ─── Late-Cancel Fee on Bookings ──────────────────────────────────────

alter table bookings add column if not exists late_cancel_fee numeric(10,2) default 0;

-- ─── Property-Level Booking Limits ────────────────────────────────────

alter table properties add column if not exists max_bookings_per_member_per_month int;
alter table properties add column if not exists advance_booking_days int;

-- ─── Performance Index for Active Booking Counts ──────────────────────

create index if not exists idx_bookings_angler_active
  on bookings(angler_id, status)
  where status in ('confirmed', 'pending');

-- ─── Cancellation Score Function ──────────────────────────────────────
-- Calculates rolling 90-day cancellation ratio for a user.
-- Deduplicates multi-day bookings: counts booking groups as one logical booking.

create or replace function calculate_cancellation_score(p_user_id uuid)
returns numeric as $$
declare
  total_count int;
  cancelled_count int;
begin
  -- Count logical bookings in last 90 days:
  -- Single-day bookings (no group) + one record per multi-day group (primary record)
  select count(*) into total_count
  from (
    -- Single-day bookings
    select id from bookings
    where angler_id = p_user_id
      and booking_group_id is null
      and created_at >= now() - interval '90 days'
      and status in ('confirmed', 'completed', 'cancelled')
    union all
    -- Multi-day groups: count only the primary record
    select distinct on (booking_group_id) id from bookings
    where angler_id = p_user_id
      and booking_group_id is not null
      and booking_date = booking_start_date
      and created_at >= now() - interval '90 days'
      and status in ('confirmed', 'completed', 'cancelled')
  ) sub;

  if total_count < 3 then
    return 0; -- Not enough data to score
  end if;

  -- Count cancelled logical bookings in same window
  select count(*) into cancelled_count
  from (
    select id from bookings
    where angler_id = p_user_id
      and booking_group_id is null
      and created_at >= now() - interval '90 days'
      and status = 'cancelled'
    union all
    select distinct on (booking_group_id) id from bookings
    where angler_id = p_user_id
      and booking_group_id is not null
      and booking_date = booking_start_date
      and created_at >= now() - interval '90 days'
      and status = 'cancelled'
  ) sub;

  return round(cancelled_count::numeric / total_count::numeric, 4);
end;
$$ language plpgsql security definer;

-- ─── Updated-at Trigger ───────────────────────────────────────────────

create or replace function update_booking_standing_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger booking_standing_updated_at
  before update on booking_standing
  for each row execute function update_booking_standing_updated_at();
