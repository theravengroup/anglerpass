-- ============================================================
-- Migration 00034: Review Prompt Log
-- Tracks all email/SMS review prompts sent per booking
-- ============================================================

-- Prompt types: initial_email, initial_sms, reminder_email, reminder_sms
create table if not exists review_prompt_log (
  id            uuid primary key default gen_random_uuid(),
  booking_id    uuid not null references bookings(id) on delete cascade,
  angler_id     uuid not null references auth.users(id) on delete cascade,
  property_id   uuid not null references properties(id) on delete cascade,
  prompt_type   text not null check (prompt_type in ('initial_email', 'initial_sms', 'reminder_email', 'reminder_sms')),
  sent_at       timestamptz not null default now(),
  channel       text not null check (channel in ('email', 'sms')),
  status        text not null default 'sent' check (status in ('sent', 'failed', 'skipped')),
  error_message text,
  created_at    timestamptz not null default now()
);

-- Indexes for efficient lookups
create index idx_review_prompt_log_booking on review_prompt_log(booking_id);
create index idx_review_prompt_log_angler on review_prompt_log(angler_id);

-- Unique constraint: one prompt of each type per booking
create unique index idx_review_prompt_log_unique
  on review_prompt_log(booking_id, prompt_type)
  where status = 'sent';

-- RLS
alter table review_prompt_log enable row level security;

-- Anglers can see their own prompt history
create policy "Anglers can view own prompt log"
  on review_prompt_log for select
  using (angler_id = auth.uid());

-- Only service role inserts (cron job)
-- No insert/update/delete policies for regular users
