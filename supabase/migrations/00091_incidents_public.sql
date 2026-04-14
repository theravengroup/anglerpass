-- Public incidents log for the /status page.
--
-- Admins post incidents here during/after an outage so customers have a
-- single authoritative page to check. Separate from the internal
-- `clubos_incidents` table (which is club-scoped, member-facing).
--
-- Columns mirror the standard statuspage.io shape so future migration to
-- a managed vendor is a straight copy.

create table if not exists public.incidents_public (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  status text not null check (status in ('investigating','identified','monitoring','resolved')),
  severity text not null check (severity in ('minor','major','critical')),
  affected_systems text[] not null default '{}'::text[],
  started_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists incidents_public_started_idx
  on public.incidents_public (started_at desc);
create index if not exists incidents_public_unresolved_idx
  on public.incidents_public (resolved_at)
  where resolved_at is null;

alter table public.incidents_public enable row level security;

-- Everyone (including unauthenticated visitors) can read incidents.
-- The /status page renders this table without auth.
drop policy if exists incidents_public_read on public.incidents_public;
create policy incidents_public_read
  on public.incidents_public
  for select
  using (true);

-- Only admins can write. The service-role client bypasses RLS anyway,
-- so these policies are belt-and-braces.
drop policy if exists incidents_public_insert_admin on public.incidents_public;
create policy incidents_public_insert_admin
  on public.incidents_public
  for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists incidents_public_update_admin on public.incidents_public;
create policy incidents_public_update_admin
  on public.incidents_public
  for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- updated_at trigger
create or replace function public.tg_incidents_public_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists incidents_public_updated_at on public.incidents_public;
create trigger incidents_public_updated_at
  before update on public.incidents_public
  for each row execute function public.tg_incidents_public_updated_at();
