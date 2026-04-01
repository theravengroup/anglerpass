-- Migration 00030: Corporate memberships
--
-- Adds corporate membership support per-club. A corporation pays a one-time
-- corporate initiation fee and can invite unlimited employees. Each employee
-- pays only the standard annual dues (no individual initiation fee).
--
-- Flow:
--   1. Club enables corporate memberships and sets a corporate initiation fee
--   2. Corporate contact joins, pays corporate initiation + their own annual dues
--   3. Corporate contact invites employees via email
--   4. Each employee accepts invite, pays annual dues only, becomes a full angler

-- ============================================================
-- 1. Add corporate membership columns to clubs
-- ============================================================

alter table public.clubs
  add column if not exists corporate_memberships_enabled boolean not null default false,
  add column if not exists corporate_initiation_fee numeric(10,2);

comment on column public.clubs.corporate_memberships_enabled is
  'Whether this club offers corporate memberships. Clubs opt in individually.';
comment on column public.clubs.corporate_initiation_fee is
  'One-time corporate initiation fee. Null when corporate memberships are disabled.';

-- ============================================================
-- 2. Add corporate fields to club_memberships
-- ============================================================

alter table public.club_memberships
  add column if not exists membership_type text not null default 'individual'
    check (membership_type in ('individual', 'corporate', 'corporate_employee')),
  add column if not exists company_name text,
  add column if not exists corporate_sponsor_id uuid references public.club_memberships(id) on delete set null;

comment on column public.club_memberships.membership_type is
  'individual = standard member, corporate = company contact who can invite employees, corporate_employee = invited by a corporate member';
comment on column public.club_memberships.company_name is
  'Company/organization name. Set for corporate and corporate_employee membership types.';
comment on column public.club_memberships.corporate_sponsor_id is
  'References the corporate member''s club_membership.id. Only set for corporate_employee type.';

create index if not exists idx_club_memberships_sponsor on public.club_memberships(corporate_sponsor_id);
create index if not exists idx_club_memberships_type on public.club_memberships(membership_type);

-- ============================================================
-- 3. Corporate invitations table
-- ============================================================

create table if not exists public.corporate_invitations (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  corporate_member_id uuid not null references public.club_memberships(id) on delete cascade,
  email text not null,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'expired')),
  token text unique not null default encode(gen_random_bytes(32), 'hex'),
  invited_at timestamptz not null default now(),
  accepted_at timestamptz
);

create index idx_corporate_invitations_token on public.corporate_invitations(token);
create index idx_corporate_invitations_email on public.corporate_invitations(email);
create index idx_corporate_invitations_corporate_member on public.corporate_invitations(corporate_member_id);
create index idx_corporate_invitations_club on public.corporate_invitations(club_id);

comment on table public.corporate_invitations is
  'Tracks employee invitations sent by corporate members. Each invitation has a unique token used in the join link.';

-- ============================================================
-- 4. RLS: corporate_invitations
-- ============================================================

alter table public.corporate_invitations enable row level security;

-- Corporate members can view invitations they sent
create policy "Corporate members can view own invitations"
  on public.corporate_invitations for select
  using (
    exists (
      select 1 from public.club_memberships
      where id = corporate_invitations.corporate_member_id
        and user_id = auth.uid()
    )
  );

-- Corporate members can create invitations
create policy "Corporate members can create invitations"
  on public.corporate_invitations for insert
  with check (
    exists (
      select 1 from public.club_memberships
      where id = corporate_invitations.corporate_member_id
        and user_id = auth.uid()
        and membership_type = 'corporate'
        and status = 'active'
    )
  );

-- Corporate members can update their invitations (e.g. resend)
create policy "Corporate members can update own invitations"
  on public.corporate_invitations for update
  using (
    exists (
      select 1 from public.club_memberships
      where id = corporate_invitations.corporate_member_id
        and user_id = auth.uid()
    )
  );

-- Anyone can read an invitation by token (for the join flow — validated in app code)
create policy "Anyone can view invitation by token"
  on public.corporate_invitations for select
  using (true);

-- Club owners can view all corporate invitations for their clubs
create policy "Club owners can view corporate invitations"
  on public.corporate_invitations for select
  using (
    exists (
      select 1 from public.clubs
      where id = corporate_invitations.club_id
        and owner_id = auth.uid()
    )
  );

-- Admins can view all corporate invitations
create policy "Admins can view all corporate invitations"
  on public.corporate_invitations for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- 5. Add corporate notification types
-- ============================================================

comment on table public.notifications is
  'User notifications. Types include: booking_requested, booking_confirmed, booking_declined, booking_cancelled, member_invited, member_approved, property_access_granted, club_joined_from_invitation, membership_activated, corporate_invite_sent, corporate_invite_accepted';
