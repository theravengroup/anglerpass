-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  00033 — Verified Trip Review System                               ║
-- ║  Tables: trip_reviews, review_category_ratings, review_flags,      ║
-- ║          review_responses                                          ║
-- ║  Alters: bookings (add cancellation_fault column)                  ║
-- ║  Purpose: Angler-written, verified reviews of properties/trips     ║
-- ║  Separate from the existing guide-angler mutual review system.     ║
-- ╚══════════════════════════════════════════════════════════════════════╝

-- ── 0. Add cancellation_fault to bookings ──────────────────────────────
-- Tracks whether a cancellation was the landowner's fault, enabling
-- review eligibility for cancelled trips.

alter table public.bookings
  add column if not exists cancellation_fault text
    check (cancellation_fault in (
      'none',
      'landowner_gate_failure',
      'landowner_no_response',
      'landowner_access_denied',
      'landowner_initiated'
    ));

comment on column public.bookings.cancellation_fault is
  'Fault attribution for cancellations. Non-null landowner values enable review with trip_completed=false.';

-- ── 1. trip_reviews ────────────────────────────────────────────────────

create table public.trip_reviews (
  id uuid primary key default gen_random_uuid(),

  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  angler_user_id uuid not null references public.profiles(id),

  -- Ratings
  overall_rating int not null check (overall_rating between 1 and 5),
  review_text text not null check (char_length(review_text) >= 50),
  would_fish_again boolean not null,

  -- Private feedback (landowner-only visibility)
  private_feedback_text text,

  -- Timestamps
  submitted_at timestamptz,
  published_at timestamptz,

  -- Review window (21 days from last fishing day)
  review_window_expires_at timestamptz not null,
  extension_requested boolean not null default false,
  extension_expires_at timestamptz,

  -- Status workflow
  status text not null default 'draft'
    check (status in ('draft', 'submitted', 'published', 'flagged', 'suppressed', 'removed')),
  moderation_reason text,
  moderation_resolved_at timestamptz,

  -- Host response (denormalized for fast reads; canonical in review_responses)
  host_response_text text,
  host_response_published_at timestamptz,

  -- Trip metadata
  trip_completed boolean not null,
  is_anonymous boolean not null default false check (is_anonymous = false),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_trip_reviews_property on public.trip_reviews(property_id);
create index idx_trip_reviews_angler on public.trip_reviews(angler_user_id);
create index idx_trip_reviews_status on public.trip_reviews(status);
create index idx_trip_reviews_published on public.trip_reviews(property_id, published_at)
  where status = 'published';

comment on table public.trip_reviews is
  'Verified angler reviews of properties/trips. One review per booking.';
comment on column public.trip_reviews.booking_id is
  'FK to bookings. Unique constraint ensures one review per booking.';
comment on column public.trip_reviews.review_window_expires_at is
  'Last fishing day + 21 days. After this timestamp, review submission is blocked.';
comment on column public.trip_reviews.extension_expires_at is
  'review_window_expires_at + 7 days, set when extension is requested.';
comment on column public.trip_reviews.trip_completed is
  'False if the booking was a landowner-fault cancellation.';
comment on column public.trip_reviews.is_anonymous is
  'Always false. Anonymous reviews are not allowed.';

alter table public.trip_reviews enable row level security;

-- Anglers can read published reviews
create policy "trip_reviews_published_read"
  on public.trip_reviews for select
  using (status = 'published');

-- Anglers can read their own reviews (any status)
create policy "trip_reviews_own_read"
  on public.trip_reviews for select
  using (angler_user_id = auth.uid());

-- Property owners can read reviews on their property
create policy "trip_reviews_owner_read"
  on public.trip_reviews for select
  using (
    exists (
      select 1 from public.properties
      where id = trip_reviews.property_id
      and owner_id = auth.uid()
    )
  );

-- Admins can read all
create policy "trip_reviews_admin_read"
  on public.trip_reviews for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Anglers can insert their own reviews
create policy "trip_reviews_own_insert"
  on public.trip_reviews for insert
  with check (angler_user_id = auth.uid());

-- Anglers can update their own draft reviews
create policy "trip_reviews_own_update"
  on public.trip_reviews for update
  using (angler_user_id = auth.uid() and status = 'draft');

-- ── 2. review_category_ratings ─────────────────────────────────────────

create table public.review_category_ratings (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.trip_reviews(id) on delete cascade,

  category_key text not null
    check (category_key in (
      'accuracy_of_listing',
      'ease_of_access',
      'property_condition',
      'quality_of_fishing_experience',
      'privacy_crowding',
      'host_communication',
      'value_for_price'
    )),

  rating_value int not null check (rating_value between 1 and 5),

  unique(review_id, category_key)
);

create index idx_review_categories_review on public.review_category_ratings(review_id);

comment on table public.review_category_ratings is
  'Per-category ratings for a trip review. 7 categories for completed trips, 3 for landowner-fault cancellations.';

alter table public.review_category_ratings enable row level security;

-- Read access follows trip_reviews visibility
create policy "review_categories_read"
  on public.review_category_ratings for select
  using (
    exists (
      select 1 from public.trip_reviews r
      where r.id = review_category_ratings.review_id
      and (
        r.status = 'published'
        or r.angler_user_id = auth.uid()
        or exists (
          select 1 from public.properties p
          where p.id = r.property_id and p.owner_id = auth.uid()
        )
        or exists (
          select 1 from public.profiles
          where id = auth.uid() and role = 'admin'
        )
      )
    )
  );

-- Insert follows trip_reviews ownership
create policy "review_categories_insert"
  on public.review_category_ratings for insert
  with check (
    exists (
      select 1 from public.trip_reviews
      where id = review_category_ratings.review_id
      and angler_user_id = auth.uid()
    )
  );

-- ── 3. review_flags ────────────────────────────────────────────────────

create table public.review_flags (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.trip_reviews(id) on delete cascade,

  flagged_by_user_id uuid not null references public.profiles(id),
  flagged_by_role text not null
    check (flagged_by_role in ('landowner', 'club_admin', 'angler', 'anglerpass_staff')),

  flag_reason text not null
    check (flag_reason in (
      'threat', 'hate_speech', 'doxxing', 'illegal_conduct',
      'extortion', 'irrelevant', 'factually_impossible', 'other'
    )),
  flag_notes text,

  flagged_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  resolved_at timestamptz,

  resolution text
    check (resolution in ('removed', 'suppressed', 'upheld', 'dismissed')),
  resolved_by_user_id uuid references public.profiles(id)
);

create index idx_review_flags_review on public.review_flags(review_id);
create index idx_review_flags_unresolved on public.review_flags(review_id)
  where resolved_at is null;

comment on table public.review_flags is
  'Content flags raised against trip reviews. Only landowners/club_admins for their properties can flag.';

alter table public.review_flags enable row level security;

-- Flaggers can read their own flags
create policy "review_flags_own_read"
  on public.review_flags for select
  using (flagged_by_user_id = auth.uid());

-- Admins can read all flags
create policy "review_flags_admin_read"
  on public.review_flags for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Landowners/club admins can insert flags (server validates association)
create policy "review_flags_insert"
  on public.review_flags for insert
  with check (flagged_by_user_id = auth.uid());

-- Admins can update flags (resolve)
create policy "review_flags_admin_update"
  on public.review_flags for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ── 4. review_responses ────────────────────────────────────────────────

create table public.review_responses (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null unique references public.trip_reviews(id) on delete cascade,

  responder_user_id uuid not null references public.profiles(id),
  responder_role text not null
    check (responder_role in ('landowner', 'club_admin')),

  response_text text not null check (char_length(response_text) >= 1),

  submitted_at timestamptz not null default now(),
  published_at timestamptz not null default now(),

  status text not null default 'published'
    check (status in ('published', 'flagged', 'removed')),

  updated_at timestamptz not null default now()
);

create index idx_review_responses_review on public.review_responses(review_id);

comment on table public.review_responses is
  'Landowner or club admin responses to trip reviews. One response per review.';

alter table public.review_responses enable row level security;

-- Published responses are visible to all who can see the review
create policy "review_responses_published_read"
  on public.review_responses for select
  using (status = 'published');

-- Responders can read their own
create policy "review_responses_own_read"
  on public.review_responses for select
  using (responder_user_id = auth.uid());

-- Admins can read all
create policy "review_responses_admin_read"
  on public.review_responses for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Responders can insert (server validates association)
create policy "review_responses_insert"
  on public.review_responses for insert
  with check (responder_user_id = auth.uid());

-- Responders can update their own (server enforces 24h lock)
create policy "review_responses_own_update"
  on public.review_responses for update
  using (responder_user_id = auth.uid());

-- Admins can update any (for moderation)
create policy "review_responses_admin_update"
  on public.review_responses for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ── 5. Helper: property review stats (materialized view) ──────────────
-- Used for search ranking and property detail pages.

create or replace view public.property_review_stats as
select
  property_id,
  count(*) as review_count,
  round(avg(overall_rating)::numeric, 2) as avg_rating,
  count(*) filter (where would_fish_again) as would_fish_again_count,
  max(published_at) as latest_review_at
from public.trip_reviews
where status = 'published'
group by property_id;

comment on view public.property_review_stats is
  'Aggregated review statistics per property. Only includes published reviews.';
