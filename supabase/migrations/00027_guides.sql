-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  00027 — Guide Module                                              ║
-- ║  Tables: guide_profiles, guide_water_approvals,                    ║
-- ║          guide_club_affiliations, guide_availability, reviews,     ║
-- ║          messages, message_threads                                 ║
-- ║  Alters: bookings (add guide columns), profiles (add guide role)   ║
-- ║  Storage: guide-credentials bucket                                 ║
-- ╚══════════════════════════════════════════════════════════════════════╝

-- ── 0. Update profiles role constraint to include 'guide' ────────────

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('landowner', 'club_admin', 'angler', 'admin', 'guide'));

-- ── 1a. guide_profiles ──────────────────────────────────────────────

create table public.guide_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,

  -- Display
  display_name text not null,
  bio text,
  profile_photo_url text,
  photos text[] default '{}',

  -- Service details
  techniques text[] default '{}',
  species text[] default '{}',
  skill_levels text[] default '{}',
  max_anglers int not null default 2,
  gear_included boolean not null default true,
  gear_details text,
  languages text[] default '{English}',

  -- Location
  base_location text,
  service_region text,
  closest_airports text,

  -- Pricing (guide sets their own rates)
  rate_full_day numeric(10,2),
  rate_half_day numeric(10,2),
  rate_description text,

  -- Availability
  lead_time_days int not null default 1,

  -- Credentials (paths in Supabase Storage)
  license_url text,
  license_state text,
  license_expiry date,
  insurance_url text,
  insurance_expiry date,
  insurance_amount text,
  first_aid_cert_url text,
  first_aid_expiry date,
  uscg_license_url text,
  uscg_license_expiry date,
  has_motorized_vessel boolean not null default false,

  -- Vetting status
  status text not null default 'draft'
    check (status in ('draft', 'pending_review', 'approved', 'suspended', 'rejected')),
  approved_at timestamptz,
  approved_by uuid references public.profiles(id),
  rejection_reason text,
  suspended_reason text,

  -- Stats (denormalized)
  rating_avg numeric(3,2) default 0,
  rating_count int default 0,
  trips_completed int default 0,
  cancellation_rate numeric(5,2) default 0,
  response_time_hours numeric(5,1),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS
alter table public.guide_profiles enable row level security;

-- Guide can read/update own profile
create policy "guide_profiles_own_read"
  on public.guide_profiles for select
  using (user_id = auth.uid());

create policy "guide_profiles_own_update"
  on public.guide_profiles for update
  using (user_id = auth.uid());

create policy "guide_profiles_own_insert"
  on public.guide_profiles for insert
  with check (user_id = auth.uid());

-- Approved profiles readable by any authenticated user
create policy "guide_profiles_approved_read"
  on public.guide_profiles for select
  using (status = 'approved');

-- Admin can read/update all
create policy "guide_profiles_admin_read"
  on public.guide_profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "guide_profiles_admin_update"
  on public.guide_profiles for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ── 1b. guide_water_approvals ───────────────────────────────────────

create table public.guide_water_approvals (
  id uuid primary key default gen_random_uuid(),
  guide_id uuid not null references public.guide_profiles(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  club_id uuid not null references public.clubs(id) on delete cascade,

  status text not null default 'pending'
    check (status in ('pending', 'approved', 'declined', 'revoked')),

  requested_at timestamptz not null default now(),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  decline_reason text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(guide_id, property_id)
);

alter table public.guide_water_approvals enable row level security;

-- Guide can read own approvals and create requests
create policy "guide_water_approvals_own_read"
  on public.guide_water_approvals for select
  using (
    guide_id in (
      select id from public.guide_profiles where user_id = auth.uid()
    )
  );

create policy "guide_water_approvals_own_insert"
  on public.guide_water_approvals for insert
  with check (
    guide_id in (
      select id from public.guide_profiles where user_id = auth.uid()
    )
  );

-- Club admins can read and update approvals for their club's waters
create policy "guide_water_approvals_club_read"
  on public.guide_water_approvals for select
  using (
    club_id in (
      select id from public.clubs where owner_id = auth.uid()
    )
  );

create policy "guide_water_approvals_club_update"
  on public.guide_water_approvals for update
  using (
    club_id in (
      select id from public.clubs where owner_id = auth.uid()
    )
  );

-- Admin can read all
create policy "guide_water_approvals_admin_read"
  on public.guide_water_approvals for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ── 1c. guide_club_affiliations ─────────────────────────────────────

create table public.guide_club_affiliations (
  id uuid primary key default gen_random_uuid(),
  guide_id uuid not null references public.guide_profiles(id) on delete cascade,
  club_id uuid not null references public.clubs(id) on delete cascade,

  status text not null default 'pending'
    check (status in ('pending', 'active', 'revoked')),

  label text default 'Affiliated Guide',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(guide_id, club_id)
);

alter table public.guide_club_affiliations enable row level security;

create policy "guide_club_affiliations_own_read"
  on public.guide_club_affiliations for select
  using (
    guide_id in (
      select id from public.guide_profiles where user_id = auth.uid()
    )
  );

create policy "guide_club_affiliations_own_insert"
  on public.guide_club_affiliations for insert
  with check (
    guide_id in (
      select id from public.guide_profiles where user_id = auth.uid()
    )
  );

create policy "guide_club_affiliations_club_read"
  on public.guide_club_affiliations for select
  using (
    club_id in (
      select id from public.clubs where owner_id = auth.uid()
    )
  );

create policy "guide_club_affiliations_club_update"
  on public.guide_club_affiliations for update
  using (
    club_id in (
      select id from public.clubs where owner_id = auth.uid()
    )
  );

-- ── 1d. guide_availability ──────────────────────────────────────────

create table public.guide_availability (
  id uuid primary key default gen_random_uuid(),
  guide_id uuid not null references public.guide_profiles(id) on delete cascade,
  date date not null,
  status text not null default 'available'
    check (status in ('available', 'blocked', 'booked')),
  booking_id uuid references public.bookings(id) on delete set null,

  created_at timestamptz not null default now(),

  unique(guide_id, date)
);

alter table public.guide_availability enable row level security;

create policy "guide_availability_own_read"
  on public.guide_availability for select
  using (
    guide_id in (
      select id from public.guide_profiles where user_id = auth.uid()
    )
  );

create policy "guide_availability_own_manage"
  on public.guide_availability for all
  using (
    guide_id in (
      select id from public.guide_profiles where user_id = auth.uid()
    )
  );

-- Public: anyone can read availability for approved guides
create policy "guide_availability_public_read"
  on public.guide_availability for select
  using (
    guide_id in (
      select id from public.guide_profiles where status = 'approved'
    )
  );

-- ── 1e. Modify bookings table — add guide columns ──────────────────

alter table public.bookings
  add column if not exists guide_id uuid references public.guide_profiles(id) on delete set null,
  add column if not exists guide_rate numeric(10,2) default 0,
  add column if not exists guide_service_fee numeric(10,2) default 0,
  add column if not exists guide_payout numeric(10,2) default 0;

-- ── 1f. reviews ─────────────────────────────────────────────────────

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,

  reviewer_id uuid not null references public.profiles(id),
  reviewer_role text not null check (reviewer_role in ('angler', 'guide')),
  subject_id uuid not null references public.profiles(id),
  subject_role text not null check (subject_role in ('angler', 'guide')),

  rating int not null check (rating between 1 and 5),
  title text,
  body text,

  is_revealed boolean not null default false,
  review_window_closes_at timestamptz not null,

  created_at timestamptz not null default now(),

  unique(booking_id, reviewer_role)
);

alter table public.reviews enable row level security;

-- Users can create reviews where they are the reviewer
create policy "reviews_own_insert"
  on public.reviews for insert
  with check (reviewer_id = auth.uid());

-- Users can read revealed reviews
create policy "reviews_revealed_read"
  on public.reviews for select
  using (is_revealed = true);

-- Users can read their own reviews (even unrevealed)
create policy "reviews_own_read"
  on public.reviews for select
  using (reviewer_id = auth.uid());

-- Admin can read all
create policy "reviews_admin_read"
  on public.reviews for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ── 1g. messages + message_threads ──────────────────────────────────

create table public.message_threads (
  id uuid primary key default gen_random_uuid(),
  participant_a uuid not null references public.profiles(id),
  participant_b uuid not null references public.profiles(id),

  booking_id uuid references public.bookings(id) on delete set null,

  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),

  unique(participant_a, participant_b, booking_id)
);

alter table public.message_threads enable row level security;

create policy "message_threads_participant_read"
  on public.message_threads for select
  using (participant_a = auth.uid() or participant_b = auth.uid());

create policy "message_threads_participant_insert"
  on public.message_threads for insert
  with check (participant_a = auth.uid() or participant_b = auth.uid());

create policy "message_threads_participant_update"
  on public.message_threads for update
  using (participant_a = auth.uid() or participant_b = auth.uid());

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.message_threads(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  recipient_id uuid not null references public.profiles(id),

  body text not null,
  read_at timestamptz,

  booking_id uuid references public.bookings(id) on delete set null,

  created_at timestamptz not null default now()
);

create index idx_messages_thread on public.messages(thread_id);
create index idx_messages_recipient on public.messages(recipient_id, read_at);
create index idx_messages_sender on public.messages(sender_id);
create index idx_messages_booking on public.messages(booking_id);

alter table public.messages enable row level security;

create policy "messages_participant_read"
  on public.messages for select
  using (sender_id = auth.uid() or recipient_id = auth.uid());

create policy "messages_sender_insert"
  on public.messages for insert
  with check (sender_id = auth.uid());

create policy "messages_recipient_update"
  on public.messages for update
  using (recipient_id = auth.uid());

-- ── 1h. Platform settings for guides ────────────────────────────────

insert into public.platform_settings (key, value, description) values
  ('guide_service_fee_pct', '10', 'Service fee percentage added to guide rates on bookings (paid by angler)'),
  ('guide_review_window_days', '14', 'Number of days after a trip that reviews can be submitted'),
  ('guide_min_insurance_amount', '1000000', 'Minimum liability insurance per-occurrence amount required for guides')
on conflict (key) do nothing;

-- ── Storage bucket for guide credentials ────────────────────────────

insert into storage.buckets (id, name, public)
values ('guide-credentials', 'guide-credentials', false)
on conflict (id) do nothing;

-- Guides can upload their own credentials
create policy "guide_credentials_upload"
  on storage.objects for insert
  with check (
    bucket_id = 'guide-credentials'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Guides can read their own credentials
create policy "guide_credentials_own_read"
  on storage.objects for select
  using (
    bucket_id = 'guide-credentials'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admins can read all guide credentials
create policy "guide_credentials_admin_read"
  on storage.objects for select
  using (
    bucket_id = 'guide-credentials'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Guides can delete their own credentials (for re-upload)
create policy "guide_credentials_own_delete"
  on storage.objects for delete
  using (
    bucket_id = 'guide-credentials'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
