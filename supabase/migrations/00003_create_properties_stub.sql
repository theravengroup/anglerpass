-- Minimal properties table — Layer 2 prep
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  status text not null default 'draft' check (status in ('draft', 'pending_review', 'published', 'archived')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.properties enable row level security;

-- Auto-update updated_at
create or replace trigger properties_updated_at
  before update on public.properties
  for each row execute function public.update_updated_at();
