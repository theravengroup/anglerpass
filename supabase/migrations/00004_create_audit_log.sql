-- Audit log foundation for tracking all significant actions
create table if not exists public.audit_log (
  id bigserial primary key,
  actor_id uuid,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz default now()
);

-- Index for efficient lookups by entity
create index if not exists audit_log_entity_idx on public.audit_log (entity_type, entity_id);

-- Enable Row Level Security
alter table public.audit_log enable row level security;
