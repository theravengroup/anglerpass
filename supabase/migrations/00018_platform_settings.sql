-- Platform-wide configuration settings
create table if not exists public.platform_settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_at timestamptz default now(),
  updated_by uuid references public.profiles(id)
);

-- RLS
alter table public.platform_settings enable row level security;

-- Admins can read and update
create policy "Admins can view platform settings"
  on public.platform_settings for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can update platform settings"
  on public.platform_settings for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can insert platform settings"
  on public.platform_settings for insert
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Seed default settings
insert into public.platform_settings (key, value, description) values
  ('staff_discount_own_club', '50', 'Percentage discount on rod fees for staff at their own club (0-100)'),
  ('staff_discount_cross_club', '25', 'Percentage discount on rod fees for staff at cross-club properties (0-100)'),
  ('platform_fee_percentage', '10', 'Platform fee percentage taken from each booking (0-100)'),
  ('booking_cancellation_hours', '48', 'Hours before a booking that free cancellation is allowed'),
  ('max_properties_per_owner', '20', 'Maximum number of properties a landowner can list'),
  ('require_photo_minimum', '3', 'Minimum number of photos required for property listings'),
  ('cross_club_network_enabled', 'true', 'Whether the Cross-Club Network is active')
on conflict (key) do nothing;
