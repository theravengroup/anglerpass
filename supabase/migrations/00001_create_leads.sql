-- Create leads table for waitlist, investor, and contact form submissions
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text,
  email text not null,
  interest_type text not null check (interest_type in ('landowner', 'club', 'angler', 'investor', 'other')),
  type text not null default 'waitlist' check (type in ('waitlist', 'investor', 'contact')),
  message text,
  source text default 'homepage',
  created_at timestamptz default now()
);

-- Unique constraint on email + type to prevent duplicate submissions
create unique index if not exists leads_email_type_idx on public.leads (email, type);

-- Enable Row Level Security
alter table public.leads enable row level security;

-- No public policies — this table is accessed via service-role only
