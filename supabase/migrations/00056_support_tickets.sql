-- Support Tickets
-- User-facing support ticket system with admin management.

create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category text not null check (
    category in ('Booking Issue', 'Account', 'Technical Bug', 'Billing', 'Guide', 'Other')
  ),
  subject text not null,
  message text not null,
  status text not null default 'open' check (
    status in ('open', 'in_progress', 'resolved')
  ),
  priority text not null default 'normal' check (
    priority in ('low', 'normal', 'high')
  ),
  assigned_to text, -- plain text name, not a FK
  admin_notes text  -- internal admin-only notes
);

-- Auto-update updated_at on row change
create or replace function public.update_support_ticket_timestamp()
  returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_support_tickets_updated_at
  before update on public.support_tickets
  for each row
  execute function public.update_support_ticket_timestamp();

-- Indexes
create index idx_support_tickets_user on public.support_tickets(user_id, created_at desc);
create index idx_support_tickets_status on public.support_tickets(status, created_at desc);

-- RLS
alter table public.support_tickets enable row level security;

-- Users can insert their own tickets
create policy "Users can create their own tickets"
  on public.support_tickets
  for insert
  with check (user_id = auth.uid());

-- Users can read only their own tickets
create policy "Users can read their own tickets"
  on public.support_tickets
  for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Admins can update any ticket
create policy "Admins can update any ticket"
  on public.support_tickets
  for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );
