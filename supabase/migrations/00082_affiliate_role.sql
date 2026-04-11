-- Migration 00082: Add "affiliate" to profiles role check constraint
--
-- The affiliate role grants access to a dedicated affiliate management
-- dashboard for managing brand partnerships, product catalogs, click
-- tracking, and revenue analytics — without access to user data,
-- financials, or admin functions.

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('landowner', 'club_admin', 'angler', 'admin', 'guide', 'corporate', 'affiliate'));

comment on constraint profiles_role_check on public.profiles is
  'Valid user roles: landowner, club_admin, angler, admin, guide, corporate, affiliate';
