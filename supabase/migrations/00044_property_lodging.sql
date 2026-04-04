-- Property Lodging (V1: landowner-managed, external listing link)
-- V2 fields included as nullable for future Hospitable.com integration

-- ═══════════════════════════════════════════════════════════════
-- 1. property_lodging table
-- ═══════════════════════════════════════════════════════════════

create table public.property_lodging (
  id uuid default gen_random_uuid() primary key,
  property_id uuid not null references public.properties(id) on delete cascade,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,

  -- V1 fields (landowner fills in)
  is_active boolean default false not null,
  lodging_name text,
  lodging_type text check (lodging_type in (
    'cabin', 'house', 'lodge_room', 'cottage', 'glamping', 'rv_hookup', 'other'
  )),
  lodging_type_other text,
  lodging_description text,
  sleeps integer,
  bedrooms integer,
  bathrooms numeric(3,1),
  amenities jsonb default '{}' not null,
  nightly_rate_min integer,
  nightly_rate_max integer,
  min_nights integer default 1 not null,
  pet_policy text check (pet_policy in ('allowed', 'not_allowed', 'case_by_case')) default 'not_allowed' not null,
  checkin_time time,
  checkout_time time,
  external_listing_url text,

  -- V2 fields (nullable now, populated when Hospitable integration goes live)
  hospitable_property_uuid uuid,
  hospitable_last_synced_at timestamptz,
  hospitable_sync_status text check (hospitable_sync_status in ('active', 'error', 'disconnected')),
  hospitable_listing_url text,

  constraint property_lodging_property_id_unique unique (property_id)
);

-- RLS
alter table public.property_lodging enable row level security;

-- READ: property owner can see their own lodging data
create policy "Landowners can view own property lodging"
  on public.property_lodging for select
  using (
    exists (
      select 1 from public.properties
      where properties.id = property_lodging.property_id
      and properties.owner_id = auth.uid()
    )
  );

-- READ: any authenticated user can view lodging for published properties (when active)
create policy "Published property lodging is visible to authenticated users"
  on public.property_lodging for select
  using (
    is_active = true
    and exists (
      select 1 from public.properties
      where properties.id = property_lodging.property_id
      and properties.status = 'published'
    )
  );

-- READ: admins can see all
create policy "Admins can view all property lodging"
  on public.property_lodging for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- INSERT: property owner
create policy "Landowners can create property lodging"
  on public.property_lodging for insert
  with check (
    exists (
      select 1 from public.properties
      where properties.id = property_lodging.property_id
      and properties.owner_id = auth.uid()
    )
  );

-- UPDATE: property owner
create policy "Landowners can update own property lodging"
  on public.property_lodging for update
  using (
    exists (
      select 1 from public.properties
      where properties.id = property_lodging.property_id
      and properties.owner_id = auth.uid()
    )
  );

-- DELETE: property owner
create policy "Landowners can delete own property lodging"
  on public.property_lodging for delete
  using (
    exists (
      select 1 from public.properties
      where properties.id = property_lodging.property_id
      and properties.owner_id = auth.uid()
    )
  );

-- updated_at trigger (reuse existing function from 00002)
create trigger property_lodging_updated_at
  before update on public.property_lodging
  for each row execute function public.update_updated_at();

-- Index for fast lookups
create index idx_property_lodging_property_id on public.property_lodging(property_id);


-- ═══════════════════════════════════════════════════════════════
-- 2. hospitable_connections table (V2 prep — empty for now)
-- ═══════════════════════════════════════════════════════════════

create table public.hospitable_connections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,

  hospitable_access_token text,
  hospitable_refresh_token text,
  hospitable_connected_at timestamptz,
  hospitable_token_expires_at timestamptz,
  connection_status text check (connection_status in ('active', 'expired', 'revoked')) default 'active',

  constraint hospitable_connections_user_id_unique unique (user_id)
);

alter table public.hospitable_connections enable row level security;

-- RLS: only the user themselves
create policy "Users can view own hospitable connection"
  on public.hospitable_connections for select
  using (auth.uid() = user_id);

create policy "Users can create own hospitable connection"
  on public.hospitable_connections for insert
  with check (auth.uid() = user_id);

create policy "Users can update own hospitable connection"
  on public.hospitable_connections for update
  using (auth.uid() = user_id);

create policy "Users can delete own hospitable connection"
  on public.hospitable_connections for delete
  using (auth.uid() = user_id);

create trigger hospitable_connections_updated_at
  before update on public.hospitable_connections
  for each row execute function public.update_updated_at();


-- ═══════════════════════════════════════════════════════════════
-- 3. Add lodging columns to bookings table (V2 prep)
-- ═══════════════════════════════════════════════════════════════

alter table public.bookings add column if not exists includes_lodging boolean default false;
alter table public.bookings add column if not exists lodging_checkin_date date;
alter table public.bookings add column if not exists lodging_checkout_date date;
alter table public.bookings add column if not exists lodging_nightly_rate integer;
alter table public.bookings add column if not exists lodging_nights integer;
alter table public.bookings add column if not exists lodging_subtotal integer;
alter table public.bookings add column if not exists lodging_platform_fee integer;
alter table public.bookings add column if not exists lodging_source text check (lodging_source in ('manual', 'hospitable', 'external'));
alter table public.bookings add column if not exists hospitable_reservation_uuid text;
