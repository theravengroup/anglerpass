-- Migration 00024: Angler-to-club invitation system
--
-- Viral growth loop: anglers sign up, invite their club, club joins,
-- angler auto-activates as a member.
--
-- Flow:
--   1. Angler signs up, enters club name + admin email
--   2. Invitation email sent to club admin
--   3. Angler's status is "pending_club" — can browse but can't book
--   4. Club admin signs up via link → club created
--   5. System auto-creates club_membership for the angler → notifies them
--   6. Angler is now a fully active member

create table if not exists public.angler_club_invitations (
  id uuid primary key default gen_random_uuid(),
  angler_id uuid not null references public.profiles(id) on delete cascade,
  club_name text not null,
  admin_email text not null,
  admin_name text,
  token uuid not null default gen_random_uuid(),
  status text not null default 'sent'
    check (status in ('sent', 'accepted', 'expired')),
  club_id uuid references public.clubs(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_angler_club_invitations_angler on public.angler_club_invitations(angler_id);
create index idx_angler_club_invitations_email on public.angler_club_invitations(admin_email);
create index idx_angler_club_invitations_token on public.angler_club_invitations(token);
create index idx_angler_club_invitations_status on public.angler_club_invitations(status);

comment on table public.angler_club_invitations is
  'Tracks invitations sent by anglers to their club admins, asking them to join AnglerPass. When the club joins, the angler is auto-added as a member.';

-- RLS
alter table public.angler_club_invitations enable row level security;

create policy "Anglers can view own invitations"
  on public.angler_club_invitations for select
  using (angler_id = auth.uid());

create policy "Anglers can create invitations"
  on public.angler_club_invitations for insert
  with check (angler_id = auth.uid());

create policy "Admins can view all invitations"
  on public.angler_club_invitations for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Add new notification types for this flow
-- (notification_preferences already has a flexible schema, just document the new types)
comment on table public.notifications is
  'User notifications. Types include: booking_requested, booking_confirmed, booking_declined, booking_cancelled, member_invited, member_approved, property_access_granted, club_joined_from_invitation, membership_activated';
