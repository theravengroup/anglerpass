-- ═══════════════════════════════════════════════════════════════════
-- 00037: Guide Verification System
-- Adds mandatory verification workflow with background check support,
-- credential expiration tracking, and verification event logging.
-- ═══════════════════════════════════════════════════════════════════

begin;

-- ─── 1. Migrate guide_profiles status values ──────────────────────

-- Drop existing constraint
alter table guide_profiles drop constraint if exists guide_profiles_status_check;

-- Migrate existing data
update guide_profiles set status = 'pending' where status = 'pending_review';
update guide_profiles set status = 'live' where status = 'approved';

-- Add new constraint with updated values
alter table guide_profiles add constraint guide_profiles_status_check
  check (status in ('draft', 'pending', 'verified', 'live', 'rejected', 'suspended'));

-- ─── 2. Add verification columns to guide_profiles ────────────────

-- Checkr background check
alter table guide_profiles add column if not exists checkr_candidate_id text;
alter table guide_profiles add column if not exists checkr_report_id text;
alter table guide_profiles add column if not exists checkr_status text
  check (checkr_status in ('pending', 'clear', 'consider', 'suspended'));
alter table guide_profiles add column if not exists checkr_completed_at timestamptz;

-- Verification fee (Stripe)
alter table guide_profiles add column if not exists verification_fee_paid boolean not null default false;
alter table guide_profiles add column if not exists verification_fee_session_id text;
alter table guide_profiles add column if not exists verification_fee_paid_at timestamptz;

-- Verification lifecycle
alter table guide_profiles add column if not exists verified_at timestamptz;
alter table guide_profiles add column if not exists verified_by uuid references profiles(id);
alter table guide_profiles add column if not exists live_at timestamptz;
alter table guide_profiles add column if not exists suspension_type text
  check (suspension_type in ('credential_expiry', 'admin', 'background_check'));

-- Guide license (separate from fishing license)
alter table guide_profiles add column if not exists guide_license_url text;
alter table guide_profiles add column if not exists guide_license_expiry date;

-- ─── 3. Create verification events table ──────────────────────────

create table if not exists guide_verification_events (
  id uuid primary key default gen_random_uuid(),
  guide_id uuid not null references guide_profiles(id) on delete cascade,
  event_type text not null,
  old_status text,
  new_status text,
  metadata jsonb not null default '{}',
  actor_id uuid references profiles(id),
  created_at timestamptz not null default now()
);

comment on table guide_verification_events is
  'Immutable event log for guide verification lifecycle';

create index idx_verification_events_guide on guide_verification_events(guide_id);
create index idx_verification_events_type on guide_verification_events(event_type);

-- RLS
alter table guide_verification_events enable row level security;

-- Admins can read all events
create policy verification_events_admin_read on guide_verification_events
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Guides can read their own events
create policy verification_events_guide_read on guide_verification_events
  for select using (
    guide_id in (select id from guide_profiles where user_id = auth.uid())
  );

-- Only service role inserts (via API routes)
-- No insert policy needed since API routes use admin client

-- ─── 4. Add platform settings ─────────────────────────────────────

insert into platform_settings (key, value, description)
values (
  'guide_verification_fee_cents',
  '4900',
  'One-time verification fee charged to guides (in cents)'
)
on conflict (key) do nothing;

-- ─── 5. Update RLS policies for status = live ─────────────────────

-- Drop old policies that reference 'approved'
drop policy if exists guide_profiles_approved_read on guide_profiles;
drop policy if exists guide_availability_public_read on guide_availability;

-- Recreate with 'live' status
create policy guide_profiles_live_read on guide_profiles
  for select using (status = 'live');

create policy guide_availability_live_read on guide_availability
  for select using (
    guide_id in (select id from guide_profiles where status = 'live')
  );

-- ─── 6. Add indexes ───────────────────────────────────────────────

create index if not exists idx_guide_profiles_status on guide_profiles(status);
create index if not exists idx_guide_profiles_checkr on guide_profiles(checkr_candidate_id)
  where checkr_candidate_id is not null;
create index if not exists idx_guide_profiles_expiries on guide_profiles(
  license_expiry, insurance_expiry, first_aid_expiry, guide_license_expiry
);

commit;
