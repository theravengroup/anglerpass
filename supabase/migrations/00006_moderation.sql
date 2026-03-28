-- Phase 3: Moderation workflow

-- Add changes_requested status to properties
alter table public.properties
  drop constraint if exists properties_status_check;

alter table public.properties
  add constraint properties_status_check
  check (status in ('draft', 'pending_review', 'changes_requested', 'published', 'archived'));

-- Moderation notes table — tracks every moderation action
create table if not exists public.moderation_notes (
  id bigserial primary key,
  property_id uuid not null references public.properties (id) on delete cascade,
  admin_id uuid not null references public.profiles (id),
  action text not null check (action in ('approved', 'changes_requested', 'rejected')),
  notes text not null,
  created_at timestamptz default now()
);

-- Index for looking up notes by property
create index if not exists idx_moderation_notes_property
  on public.moderation_notes (property_id, created_at desc);

-- Enable RLS
alter table public.moderation_notes enable row level security;

-- Admins can insert moderation notes
create policy "Admins can create moderation notes"
  on public.moderation_notes for insert
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Admins can view all moderation notes
create policy "Admins can view all moderation notes"
  on public.moderation_notes for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Landowners can view moderation notes on their own properties
create policy "Landowners can view own property moderation notes"
  on public.moderation_notes for select
  using (
    exists (
      select 1 from public.properties
      where properties.id = moderation_notes.property_id
      and properties.owner_id = auth.uid()
    )
  );

-- Allow admins to read audit_log
create policy "Admins can view audit log"
  on public.audit_log for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Allow admins to insert into audit_log
create policy "Admins can insert audit log"
  on public.audit_log for insert
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );
