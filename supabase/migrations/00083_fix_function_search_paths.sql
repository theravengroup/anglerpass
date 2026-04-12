-- Fix "Function Search Path Mutable" warnings from Supabase Security Advisor.
-- Setting search_path = '' prevents search-path hijacking by ensuring all
-- table/type references use schema-qualified names (which plpgsql does by
-- default for tables referenced in DML).

-- ═══ Compass usage & credits (from 00061) ═══════════════════════════════

create or replace function public.update_compass_usage_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql set search_path = '';

create or replace function public.update_compass_credits_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql set search_path = '';

create or replace function public.increment_compass_usage(
  p_user_id uuid,
  p_period text
) returns int as $$
declare
  new_count int;
begin
  insert into public.compass_usage (user_id, period, message_count)
  values (p_user_id, p_period, 1)
  on conflict (user_id, period)
  do update set message_count = public.compass_usage.message_count + 1
  returning message_count into new_count;
  return new_count;
end;
$$ language plpgsql security definer set search_path = '';

create or replace function public.decrement_compass_credits(
  p_user_id uuid
) returns int as $$
declare
  new_balance int;
begin
  update public.compass_credits
  set balance = greatest(balance - 1, 0)
  where user_id = p_user_id
  returning balance into new_balance;
  return coalesce(new_balance, 0);
end;
$$ language plpgsql security definer set search_path = '';

create or replace function public.add_compass_credits(
  p_user_id uuid,
  p_amount int
) returns int as $$
declare
  new_balance int;
begin
  insert into public.compass_credits (user_id, balance)
  values (p_user_id, p_amount)
  on conflict (user_id)
  do update set balance = public.compass_credits.balance + p_amount
  returning balance into new_balance;
  return new_balance;
end;
$$ language plpgsql security definer set search_path = '';

-- ═══ Booking abuse prevention (from 00062) ══════════════════════════════

create or replace function public.calculate_cancellation_score(p_user_id uuid)
returns numeric as $$
declare
  total_count int;
  cancelled_count int;
begin
  select count(*) into total_count
  from (
    select id from public.bookings
    where angler_id = p_user_id
      and booking_group_id is null
      and created_at >= now() - interval '90 days'
      and status in ('confirmed', 'completed', 'cancelled')
    union all
    select distinct on (booking_group_id) id from public.bookings
    where angler_id = p_user_id
      and booking_group_id is not null
      and booking_date = booking_start_date
      and created_at >= now() - interval '90 days'
      and status in ('confirmed', 'completed', 'cancelled')
  ) sub;

  if total_count < 3 then
    return 0;
  end if;

  select count(*) into cancelled_count
  from (
    select id from public.bookings
    where angler_id = p_user_id
      and booking_group_id is null
      and created_at >= now() - interval '90 days'
      and status = 'cancelled'
    union all
    select distinct on (booking_group_id) id from public.bookings
    where angler_id = p_user_id
      and booking_group_id is not null
      and booking_date = booking_start_date
      and created_at >= now() - interval '90 days'
      and status = 'cancelled'
  ) sub;

  return round(cancelled_count::numeric / total_count::numeric, 4);
end;
$$ language plpgsql security definer set search_path = '';

create or replace function public.update_booking_standing_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql set search_path = '';

-- ═══ Generic updated_at trigger (from 00081) ════════════════════════════

create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql set search_path = '';
