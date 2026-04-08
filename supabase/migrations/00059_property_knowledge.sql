-- Property Knowledge Profile
-- Rich structured data per property to feed Compass AI recommendations.
-- Mirrors the property_lodging pattern: 1:1 relationship, JSONB sections.

-- ═══════════════════════════════════════════════════════════════
-- 1. property_knowledge table
-- ═══════════════════════════════════════════════════════════════

create table public.property_knowledge (
  id uuid default gen_random_uuid() primary key,
  property_id uuid not null references public.properties(id) on delete cascade,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,

  -- Section JSONB columns (each independently nullable)
  water_characteristics jsonb,
  species_detail jsonb,
  hatches_and_patterns jsonb,
  seasonal_conditions jsonb,
  flow_and_gauge jsonb,
  access_and_logistics jsonb,
  regulations_and_rules jsonb,
  equipment_recommendations jsonb,
  safety_and_hazards jsonb,
  amenities jsonb,
  experience_profile jsonb,
  pressure_and_crowding jsonb,

  -- Computed completeness (0-100), updated on each save
  completeness_score integer default 0 not null,

  constraint property_knowledge_property_id_unique unique (property_id)
);

-- ═══════════════════════════════════════════════════════════════
-- 2. RLS policies
-- ═══════════════════════════════════════════════════════════════

alter table public.property_knowledge enable row level security;

-- READ: property owner
create policy "Landowners can view own property knowledge"
  on public.property_knowledge for select
  using (
    exists (
      select 1 from public.properties
      where properties.id = property_knowledge.property_id
      and properties.owner_id = auth.uid()
    )
  );

-- READ: club staff for club-created properties
create policy "Club staff can view club property knowledge"
  on public.property_knowledge for select
  using (
    exists (
      select 1 from public.properties p
      join public.club_members cm on cm.club_id = p.created_by_club_id
      where p.id = property_knowledge.property_id
      and cm.user_id = auth.uid()
      and cm.status = 'active'
    )
  );

-- READ: published property knowledge visible to authenticated users
create policy "Published property knowledge is visible to authenticated users"
  on public.property_knowledge for select
  using (
    exists (
      select 1 from public.properties
      where properties.id = property_knowledge.property_id
      and properties.status in ('published', 'active')
    )
  );

-- READ: admins
create policy "Admins can view all property knowledge"
  on public.property_knowledge for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- INSERT: property owner
create policy "Landowners can create property knowledge"
  on public.property_knowledge for insert
  with check (
    exists (
      select 1 from public.properties
      where properties.id = property_knowledge.property_id
      and properties.owner_id = auth.uid()
    )
  );

-- INSERT: club staff
create policy "Club staff can create club property knowledge"
  on public.property_knowledge for insert
  with check (
    exists (
      select 1 from public.properties p
      join public.club_members cm on cm.club_id = p.created_by_club_id
      where p.id = property_knowledge.property_id
      and cm.user_id = auth.uid()
      and cm.status = 'active'
    )
  );

-- UPDATE: property owner
create policy "Landowners can update own property knowledge"
  on public.property_knowledge for update
  using (
    exists (
      select 1 from public.properties
      where properties.id = property_knowledge.property_id
      and properties.owner_id = auth.uid()
    )
  );

-- UPDATE: club staff
create policy "Club staff can update club property knowledge"
  on public.property_knowledge for update
  using (
    exists (
      select 1 from public.properties p
      join public.club_members cm on cm.club_id = p.created_by_club_id
      where p.id = property_knowledge.property_id
      and cm.user_id = auth.uid()
      and cm.status = 'active'
    )
  );

-- DELETE: property owner
create policy "Landowners can delete own property knowledge"
  on public.property_knowledge for delete
  using (
    exists (
      select 1 from public.properties
      where properties.id = property_knowledge.property_id
      and properties.owner_id = auth.uid()
    )
  );

-- ═══════════════════════════════════════════════════════════════
-- 3. Triggers and indexes
-- ═══════════════════════════════════════════════════════════════

create trigger property_knowledge_updated_at
  before update on public.property_knowledge
  for each row execute function public.update_updated_at();

create index idx_property_knowledge_property_id on public.property_knowledge(property_id);

-- ═══════════════════════════════════════════════════════════════
-- 4. Denormalized completeness on properties table
-- ═══════════════════════════════════════════════════════════════

alter table public.properties
  add column if not exists knowledge_completeness integer default 0;
