-- ============================================================
-- Staff Notes — internal, non-public notes attached to members,
-- properties, or landowners. Chronological log with timestamps
-- and author attribution.
-- ============================================================

create table if not exists public.staff_notes (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,

  -- Polymorphic target
  entity_type text not null check (entity_type in ('member', 'property', 'landowner')),
  entity_id uuid not null,

  -- Content
  body text not null check (char_length(body) between 1 and 5000),

  -- Author
  created_by uuid not null references public.profiles(id) on delete cascade,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_staff_notes_club on public.staff_notes(club_id);
create index idx_staff_notes_entity on public.staff_notes(entity_type, entity_id);
create index idx_staff_notes_created_by on public.staff_notes(created_by);

comment on table public.staff_notes is
  'Internal staff notes for tracking service/support history on members, properties, and landowners.';

-- RLS
alter table public.staff_notes enable row level security;

-- Club owners can do everything
create policy "Club owners can manage notes"
  on public.staff_notes for all
  using (
    exists (
      select 1 from public.clubs
      where id = staff_notes.club_id
        and owner_id = auth.uid()
    )
  );

-- Club staff (active) can view and create notes for their club
create policy "Club staff can view notes"
  on public.staff_notes for select
  using (
    exists (
      select 1 from public.club_memberships
      where club_id = staff_notes.club_id
        and user_id = auth.uid()
        and role = 'staff'
        and status = 'active'
    )
  );

create policy "Club staff can create notes"
  on public.staff_notes for insert
  with check (
    exists (
      select 1 from public.club_memberships
      where club_id = staff_notes.club_id
        and user_id = auth.uid()
        and role = 'staff'
        and status = 'active'
    )
  );

-- Platform admins can view all notes
create policy "Admins can view all notes"
  on public.staff_notes for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
