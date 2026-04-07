-- Impersonation Sessions
-- Tracks admin-initiated impersonation of user accounts.
-- Allows admins to view the platform from a user's perspective (read-only).

create table public.impersonation_sessions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles(id) on delete cascade,
  admin_email text not null,
  target_user_id uuid not null references public.profiles(id) on delete cascade,
  target_user_email text not null,
  target_user_name text,
  target_role text not null,
  session_token text not null unique,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  is_active boolean not null default true,

  -- Prevent admins from impersonating other admins
  constraint chk_no_admin_impersonation check (target_role != 'admin')
);

-- Indexes
create index idx_impersonation_sessions_token on public.impersonation_sessions(session_token) where is_active = true;
create index idx_impersonation_sessions_admin on public.impersonation_sessions(admin_id, started_at desc);

-- RLS — only service_role can read/write
alter table public.impersonation_sessions enable row level security;

-- No RLS policies = only service_role (bypasses RLS) can access.
-- This is intentional — impersonation data is admin-only.

comment on table public.impersonation_sessions is 'Tracks admin impersonation sessions. Only accessible via service_role client.';
comment on column public.impersonation_sessions.session_token is 'Cryptographically random token stored in httpOnly cookie. Used to identify active impersonation.';
