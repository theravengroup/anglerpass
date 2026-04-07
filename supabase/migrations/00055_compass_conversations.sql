-- Compass AI conversation history
-- Stores chat sessions so users can resume conversations

create table public.compass_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text,
  messages jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.compass_conversations enable row level security;

create policy "Users can manage their own conversations"
  on public.compass_conversations
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create index idx_compass_conversations_user
  on public.compass_conversations(user_id, updated_at desc);
