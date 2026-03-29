-- Phase 11: Admin Permissions & User Management
-- Adds suspension support and admin RLS policies for user management

-- Add suspension columns to profiles
alter table public.profiles
  add column if not exists suspended_at timestamptz,
  add column if not exists suspended_reason text;

-- Admin can read all profiles (for user management)
create policy "Admins can read all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Admin can update all profiles (role changes, suspension)
create policy "Admins can update all profiles"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Admin can read audit_log
create policy "Admins can read audit log"
  on public.audit_log for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Admin can insert audit_log entries
create policy "Admins can insert audit log"
  on public.audit_log for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Index for searching profiles by role
create index if not exists profiles_role_idx on public.profiles (role);

-- Index for suspended users
create index if not exists profiles_suspended_idx on public.profiles (suspended_at)
  where suspended_at is not null;
