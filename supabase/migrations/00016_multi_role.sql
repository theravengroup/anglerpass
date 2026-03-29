-- Add roles array to support users with multiple roles.
-- The existing `role` column remains as the "active" role for routing.
-- The new `roles` column tracks all roles the user has enabled.
alter table public.profiles
  add column if not exists roles text[] default '{angler}';

-- Backfill: set roles from current single role
update public.profiles
  set roles = array[role]
  where roles = '{angler}' and role != 'angler';

-- Also ensure angler is always in the array (everyone can fish)
update public.profiles
  set roles = array_append(roles, role)
  where not (role = any(roles));
