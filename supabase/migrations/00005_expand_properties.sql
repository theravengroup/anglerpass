-- Expand properties table for full property management (Layer 2)

-- Add new columns to existing properties table
alter table public.properties
  add column if not exists description text,
  add column if not exists location_description text,
  add column if not exists coordinates text,
  add column if not exists water_type text check (water_type is null or water_type in ('river', 'stream', 'lake', 'pond', 'spring_creek', 'tailwater', 'reservoir')),
  add column if not exists species text[] default '{}',
  add column if not exists regulations text,
  add column if not exists photos text[] default '{}',
  add column if not exists capacity integer,
  add column if not exists rate_adult_full_day numeric,
  add column if not exists rate_youth_full_day numeric,
  add column if not exists rate_child_full_day numeric,
  add column if not exists half_day_allowed boolean default false,
  add column if not exists rate_adult_half_day numeric,
  add column if not exists rate_youth_half_day numeric,
  add column if not exists rate_child_half_day numeric,
  add column if not exists water_miles numeric,
  add column if not exists access_notes text,
  add column if not exists gate_code_required boolean default false,
  add column if not exists gate_code text;

-- RLS policies for properties
-- Landowners can read their own properties
create policy "Landowners can view own properties"
  on public.properties for select
  using (owner_id = auth.uid());

-- Landowners can insert properties they own
create policy "Landowners can create properties"
  on public.properties for insert
  with check (owner_id = auth.uid());

-- Landowners can update their own properties
create policy "Landowners can update own properties"
  on public.properties for update
  using (owner_id = auth.uid());

-- Landowners can delete their own draft properties
create policy "Landowners can delete own draft properties"
  on public.properties for delete
  using (owner_id = auth.uid() and status = 'draft');

-- Anyone authenticated can view published properties (excluding private fields)
create policy "Published properties are visible to all authenticated users"
  on public.properties for select
  using (status = 'published');

-- Admins can view all properties (for moderation)
create policy "Admins can view all properties"
  on public.properties for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Admins can update any property (for moderation)
create policy "Admins can update any property"
  on public.properties for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Index for owner lookups
create index if not exists idx_properties_owner_id on public.properties (owner_id);

-- Index for status filtering
create index if not exists idx_properties_status on public.properties (status);

-- Create storage bucket for property photos
insert into storage.buckets (id, name, public)
values ('property-photos', 'property-photos', true)
on conflict (id) do nothing;

-- Storage RLS: landowners can upload photos
create policy "Landowners can upload property photos"
  on storage.objects for insert
  with check (
    bucket_id = 'property-photos'
    and auth.uid() is not null
  );

-- Storage RLS: anyone can view property photos (public bucket)
create policy "Property photos are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'property-photos');

-- Storage RLS: landowners can delete their own photos
create policy "Landowners can delete own property photos"
  on storage.objects for delete
  using (
    bucket_id = 'property-photos'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );
