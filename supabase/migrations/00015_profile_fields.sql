-- Add profile fields for bio, location, avatar, and fishing preferences
alter table public.profiles
  add column if not exists bio text,
  add column if not exists location text,
  add column if not exists avatar_url text,
  add column if not exists fishing_experience text check (fishing_experience in ('beginner', 'intermediate', 'advanced', 'expert')),
  add column if not exists favorite_species text[] default '{}';

-- Index for location-based queries
create index if not exists idx_profiles_location on public.profiles (location)
  where location is not null;
