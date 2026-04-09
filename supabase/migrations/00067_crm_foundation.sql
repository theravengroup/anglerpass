-- 00067_crm_foundation.sql
-- Marketing Automation / CRM foundation tables
-- Lean Customer.io-style campaign engine built into the platform

-- ═══════════════════════════════════════════════════════════════
-- 1. Segments — reusable audience definitions
-- ═══════════════════════════════════════════════════════════════

create table public.segments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  is_dynamic boolean not null default true,
  rules jsonb not null default '[]',
  cached_count int,
  cached_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.segments enable row level security;
-- No public policies — admin-only via service-role client

-- ═══════════════════════════════════════════════════════════════
-- 2. Campaigns — broadcast, drip, or triggered email campaigns
-- ═══════════════════════════════════════════════════════════════

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  type text not null check (type in ('broadcast', 'drip', 'triggered')),
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'completed', 'archived')),
  from_name text not null default 'AnglerPass',
  from_email text not null default 'hello@anglerpass.com',
  reply_to text,
  segment_id uuid references public.segments(id) on delete set null,
  trigger_event text,
  trigger_config jsonb not null default '{}',
  is_prebuilt boolean not null default false,
  prebuilt_key text unique,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

alter table public.campaigns enable row level security;

-- ═══════════════════════════════════════════════════════════════
-- 3. Campaign steps — individual emails in a sequence
-- ═══════════════════════════════════════════════════════════════

create table public.campaign_steps (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  step_order smallint not null default 1,
  subject text not null,
  html_body text not null,
  plain_body text,
  delay_minutes int not null default 0,
  cta_label text,
  cta_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, step_order)
);

alter table public.campaign_steps enable row level security;

-- ═══════════════════════════════════════════════════════════════
-- 4. Campaign enrollments — user progress through drip sequences
-- ═══════════════════════════════════════════════════════════════

create table public.campaign_enrollments (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  recipient_id uuid references public.profiles(id) on delete set null,
  recipient_email text not null,
  recipient_type text not null default 'user' check (recipient_type in ('user', 'lead')),
  lead_id uuid references public.leads(id) on delete set null,
  current_step smallint not null default 0,
  status text not null default 'active' check (status in ('active', 'completed', 'paused', 'unsubscribed', 'cancelled')),
  enrolled_at timestamptz not null default now(),
  completed_at timestamptz,
  last_step_sent_at timestamptz,
  next_step_due_at timestamptz,
  unique (campaign_id, recipient_email)
);

alter table public.campaign_enrollments enable row level security;

create index idx_enrollments_active
  on public.campaign_enrollments (campaign_id, status)
  where status = 'active';

create index idx_enrollments_next_due
  on public.campaign_enrollments (status, next_step_due_at)
  where status = 'active';

-- ═══════════════════════════════════════════════════════════════
-- 5. Campaign sends — individual email delivery log
-- ═══════════════════════════════════════════════════════════════

create table public.campaign_sends (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  step_id uuid not null references public.campaign_steps(id) on delete cascade,
  recipient_id uuid references public.profiles(id) on delete set null,
  recipient_email text not null,
  recipient_type text not null default 'user' check (recipient_type in ('user', 'lead')),
  lead_id uuid references public.leads(id) on delete set null,
  status text not null default 'queued' check (status in ('queued', 'sending', 'sent', 'delivered', 'bounced', 'failed', 'skipped')),
  resend_message_id text,
  sent_at timestamptz,
  delivered_at timestamptz,
  bounced_at timestamptz,
  bounce_reason text,
  opened_at timestamptz,
  open_count smallint not null default 0,
  clicked_at timestamptz,
  click_count smallint not null default 0,
  unsubscribed_at timestamptz,
  drip_scheduled_for timestamptz,
  created_at timestamptz not null default now()
);

alter table public.campaign_sends enable row level security;

create index idx_sends_campaign_status
  on public.campaign_sends (campaign_id, status);

create index idx_sends_recipient
  on public.campaign_sends (recipient_id)
  where recipient_id is not null;

create index idx_sends_drip_schedule
  on public.campaign_sends (status, drip_scheduled_for)
  where status = 'queued';

create index idx_sends_resend_id
  on public.campaign_sends (resend_message_id)
  where resend_message_id is not null;

-- ═══════════════════════════════════════════════════════════════
-- 6. Engagement events — granular open/click/bounce log
-- ═══════════════════════════════════════════════════════════════

create table public.engagement_events (
  id uuid primary key default gen_random_uuid(),
  send_id uuid not null references public.campaign_sends(id) on delete cascade,
  event_type text not null check (event_type in ('open', 'click', 'bounce', 'complaint', 'unsubscribe')),
  url text,
  user_agent text,
  ip_address inet,
  created_at timestamptz not null default now()
);

alter table public.engagement_events enable row level security;

create index idx_engagement_send
  on public.engagement_events (send_id);

create index idx_engagement_type_time
  on public.engagement_events (event_type, created_at);

-- ═══════════════════════════════════════════════════════════════
-- 7. Email suppression list — hard bounces and complaints
-- ═══════════════════════════════════════════════════════════════

create table public.email_suppression_list (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  reason text not null check (reason in ('hard_bounce', 'complaint', 'manual')),
  source text,
  created_at timestamptz not null default now()
);

alter table public.email_suppression_list enable row level security;

-- ═══════════════════════════════════════════════════════════════
-- 8. Add email_marketing opt-out to notification_preferences
-- ═══════════════════════════════════════════════════════════════

alter table public.notification_preferences
  add column if not exists email_marketing boolean not null default true;

-- ═══════════════════════════════════════════════════════════════
-- 9. Updated_at triggers for new tables
-- ═══════════════════════════════════════════════════════════════

create trigger set_segments_updated_at
  before update on public.segments
  for each row execute function public.update_updated_at();

create trigger set_campaigns_updated_at
  before update on public.campaigns
  for each row execute function public.update_updated_at();

create trigger set_campaign_steps_updated_at
  before update on public.campaign_steps
  for each row execute function public.update_updated_at();
