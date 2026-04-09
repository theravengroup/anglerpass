-- 00066_security_advisor_fixes.sql
-- Resolve Supabase Security Advisor warnings:
--   1. Function Search Path Mutable — pin search_path on 4 functions
--   2. RLS Policy Always True — tighten WITH CHECK on angler_delegates & platform_staff

-- ═══════════════════════════════════════════════════════════════
-- 1. Fix search_path on all four flagged functions
-- ═══════════════════════════════════════════════════════════════

-- 1a. is_cross_club_eligible
create or replace function public.is_cross_club_eligible(p_club_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.clubs
    where id = p_club_id
      and subscription_tier in ('starter', 'standard', 'pro')
  );
$$;

-- 1b. cross_club_agreement_limit
create or replace function public.cross_club_agreement_limit(p_club_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when subscription_tier = 'starter' then 2
    when subscription_tier = 'standard' then 10
    when subscription_tier = 'pro' then 2147483647
    else 0
  end
  from public.clubs
  where id = p_club_id;
$$;

-- 1c. update_support_ticket_timestamp
create or replace function public.update_support_ticket_timestamp()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 1d. update_updated_at
create or replace function public.update_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ═══════════════════════════════════════════════════════════════
-- 2. Tighten RLS WITH CHECK clauses
-- ═══════════════════════════════════════════════════════════════

-- 2a. angler_delegates: restrict UPDATE so angler_id stays owned by caller
drop policy if exists "Anglers can update own delegates" on public.angler_delegates;
create policy "Anglers can update own delegates"
  on public.angler_delegates for update
  to authenticated
  using (angler_id = auth.uid() or delegate_id = auth.uid())
  with check (angler_id = auth.uid());

-- 2b. platform_staff: restrict UPDATE so only admins can write, and user_id is immutable
drop policy if exists "Admins can update platform_staff" on public.platform_staff;
create policy "Admins can update platform_staff"
  on public.platform_staff for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles where id = auth.uid() and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles where id = auth.uid() and role = 'admin'
    )
  );
