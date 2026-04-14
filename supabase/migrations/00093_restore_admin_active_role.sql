-- Restore `role = 'admin'` for any profile whose roles[] contains 'admin'
-- but whose active role is something else.
--
-- Victims of the pre-00092 login-demotion bug: the old login handler read
-- `profile.roles[0]` and overwrote `profile.role`. For an admin whose
-- roles[] was ordered with 'admin' not first (or mutated elsewhere), the
-- active role could flip to club_admin / landowner / angler and route them
-- to the wrong dashboard. Admin is always the correct active role when
-- present.

alter table public.profiles disable trigger profiles_no_self_role_escalation;

update public.profiles
set role = 'admin'
where role <> 'admin'
  and roles is not null
  and 'admin' = any(roles);

alter table public.profiles enable trigger profiles_no_self_role_escalation;
