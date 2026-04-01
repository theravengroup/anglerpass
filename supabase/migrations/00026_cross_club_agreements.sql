-- Migration 00026: Cross-Club Agreements
--
-- Enables the Cross-Club Network. Two clubs with a mutual agreement allow
-- their members to book each other's properties. Only Standard and Pro tier
-- clubs are eligible for cross-club access.
--
-- Agreement flow:
--   Club A proposes → Club B accepts → agreement is active (bidirectional)
--   Either club can revoke → status changes to revoked
--
-- Booking routing:
--   1. Check if angler's club has direct club_property_access → home-club booking
--   2. If not, check if angler's club has an active cross_club_agreement with
--      a club that DOES have club_property_access → cross-club booking
--   3. If neither, booking is not allowed

create table if not exists public.cross_club_agreements (
  id uuid primary key default gen_random_uuid(),

  -- The two clubs in the agreement (club_a proposes, club_b accepts)
  club_a_id uuid not null references public.clubs(id) on delete cascade,
  club_b_id uuid not null references public.clubs(id) on delete cascade,

  status text not null default 'pending'
    check (status in ('pending', 'active', 'revoked')),

  -- Who initiated and who accepted
  proposed_by uuid not null references public.profiles(id),
  accepted_by uuid references public.profiles(id),

  -- Timestamps
  proposed_at timestamptz not null default now(),
  accepted_at timestamptz,
  revoked_at timestamptz,
  revoked_by uuid references public.profiles(id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Prevent duplicate agreements between the same pair
  -- Always store the smaller UUID as club_a to enforce uniqueness
  constraint unique_club_pair unique (club_a_id, club_b_id),
  constraint different_clubs check (club_a_id <> club_b_id)
);

create index idx_cross_club_agreements_club_a on public.cross_club_agreements(club_a_id);
create index idx_cross_club_agreements_club_b on public.cross_club_agreements(club_b_id);
create index idx_cross_club_agreements_status on public.cross_club_agreements(status);

comment on table public.cross_club_agreements is
  'Reciprocal access agreements between two clubs. When active, members of either club can book properties accessible to the other club (with a $10/rod cross-club fee).';

-- ─── RLS ──────────────────────────────────────────────────────────────

alter table public.cross_club_agreements enable row level security;

-- Club owners/admins can view agreements involving their club
create policy "Club owners can view own agreements"
  on public.cross_club_agreements for select
  using (
    exists (
      select 1 from public.clubs
      where (clubs.id = cross_club_agreements.club_a_id or clubs.id = cross_club_agreements.club_b_id)
        and clubs.owner_id = auth.uid()
    )
  );

-- Club admins (via membership) can view agreements involving their club
create policy "Club admins can view agreements"
  on public.cross_club_agreements for select
  using (
    exists (
      select 1 from public.club_memberships
      where (club_memberships.club_id = cross_club_agreements.club_a_id
             or club_memberships.club_id = cross_club_agreements.club_b_id)
        and club_memberships.user_id = auth.uid()
        and club_memberships.role = 'admin'
        and club_memberships.status = 'active'
    )
  );

-- Club owners can propose agreements (insert)
create policy "Club owners can propose agreements"
  on public.cross_club_agreements for insert
  with check (
    exists (
      select 1 from public.clubs
      where clubs.id = cross_club_agreements.club_a_id
        and clubs.owner_id = auth.uid()
    )
  );

-- Club owners can update agreements (accept/revoke)
create policy "Club owners can update agreements"
  on public.cross_club_agreements for update
  using (
    exists (
      select 1 from public.clubs
      where (clubs.id = cross_club_agreements.club_a_id or clubs.id = cross_club_agreements.club_b_id)
        and clubs.owner_id = auth.uid()
    )
  );

-- Platform admins can view all
create policy "Admins can view all agreements"
  on public.cross_club_agreements for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ─── Helper function: check cross-club eligibility ───────────────────

create or replace function public.is_cross_club_eligible(p_club_id uuid)
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from public.clubs
    where id = p_club_id
      and subscription_tier in ('standard', 'pro')
  );
$$;

comment on function public.is_cross_club_eligible is
  'Returns true if the club is on a Standard or Pro tier (eligible for cross-club agreements).';
