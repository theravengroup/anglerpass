-- Compass AI usage metering tables
-- Tracks monthly message counts, purchased credit balances, and purchase history

-- Monthly message counts per user
create table if not exists compass_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  period text not null, -- YYYY-MM format
  message_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, period)
);

-- Purchased credit balance per user
create table if not exists compass_credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade unique,
  balance int not null default 0,
  updated_at timestamptz not null default now()
);

-- Purchase audit trail
create table if not exists compass_credit_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  stripe_payment_intent_id text,
  pack_key text not null,
  messages_purchased int not null,
  amount_cents int not null,
  status text not null default 'pending' check (status in ('pending', 'succeeded', 'failed')),
  created_at timestamptz not null default now()
);

-- Indexes for common queries
create index if not exists idx_compass_usage_user_period on compass_usage(user_id, period);
create index if not exists idx_compass_credits_user on compass_credits(user_id);
create index if not exists idx_compass_credit_purchases_user on compass_credit_purchases(user_id);
create index if not exists idx_compass_credit_purchases_stripe on compass_credit_purchases(stripe_payment_intent_id);

-- RLS policies: users can read their own rows, service role handles writes
alter table compass_usage enable row level security;
alter table compass_credits enable row level security;
alter table compass_credit_purchases enable row level security;

create policy "Users can view own usage"
  on compass_usage for select
  using (auth.uid() = user_id);

create policy "Users can view own credits"
  on compass_credits for select
  using (auth.uid() = user_id);

create policy "Users can view own purchases"
  on compass_credit_purchases for select
  using (auth.uid() = user_id);

-- updated_at trigger for compass_usage
create or replace function update_compass_usage_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger compass_usage_updated_at
  before update on compass_usage
  for each row execute function update_compass_usage_updated_at();

-- updated_at trigger for compass_credits
create or replace function update_compass_credits_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger compass_credits_updated_at
  before update on compass_credits
  for each row execute function update_compass_credits_updated_at();

-- Atomic helper: increment monthly usage, inserting row if needed.
-- Returns the new message_count.
create or replace function increment_compass_usage(
  p_user_id uuid,
  p_period text
) returns int as $$
declare
  new_count int;
begin
  insert into compass_usage (user_id, period, message_count)
  values (p_user_id, p_period, 1)
  on conflict (user_id, period)
  do update set message_count = compass_usage.message_count + 1
  returning message_count into new_count;
  return new_count;
end;
$$ language plpgsql security definer;

-- Atomic helper: decrement credit balance by 1 (floor at 0).
create or replace function decrement_compass_credits(
  p_user_id uuid
) returns int as $$
declare
  new_balance int;
begin
  update compass_credits
  set balance = greatest(balance - 1, 0)
  where user_id = p_user_id
  returning balance into new_balance;
  return coalesce(new_balance, 0);
end;
$$ language plpgsql security definer;

-- Atomic helper: add credits to a user's balance, inserting row if needed.
create or replace function add_compass_credits(
  p_user_id uuid,
  p_amount int
) returns int as $$
declare
  new_balance int;
begin
  insert into compass_credits (user_id, balance)
  values (p_user_id, p_amount)
  on conflict (user_id)
  do update set balance = compass_credits.balance + p_amount
  returning balance into new_balance;
  return new_balance;
end;
$$ language plpgsql security definer;
