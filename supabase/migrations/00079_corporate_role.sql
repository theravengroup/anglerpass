-- Migration 00079: Add "corporate" to profiles role check constraint
--
-- The corporate membership feature introduces a new first-class user role.
-- Corporate accounts represent companies that purchase club memberships and
-- invite employees as anglers.

-- ============================================================
-- 1. Update profiles role check constraint
-- ============================================================

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('landowner', 'club_admin', 'angler', 'admin', 'guide', 'corporate'));

-- ============================================================
-- 2. Update impersonation constraint to also block corporate
--    from being impersonated (they manage billing/staff)
-- ============================================================

-- No change needed — impersonation only blocks 'admin' target_role,
-- corporate impersonation is fine for support purposes.

comment on constraint profiles_role_check on public.profiles is
  'Valid user roles: landowner, club_admin, angler, admin, guide, corporate';
