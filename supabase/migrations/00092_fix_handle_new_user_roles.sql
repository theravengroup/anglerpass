-- Fix handle_new_user trigger so `roles` array is initialized to the signup
-- role, not the column default of '{angler}'.
--
-- Before this fix, a user signing up with role='club_admin' landed a row where
-- roles=['angler'] (column default). The login flow reads `roles[0]` as the
-- primary role and OVERWRITES `role` with it — so every non-angler signup was
-- silently demoted to angler on first login, and saw the angler dashboard.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  signup_role text;
begin
  signup_role := coalesce(new.raw_user_meta_data ->> 'role', 'angler');

  insert into public.profiles (id, display_name, role, roles)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'first_name'
    ),
    signup_role,
    array[signup_role]
  );
  return new;
end;
$$;

-- Backfill: any profile whose roles array doesn't include its active role was
-- hit by the old trigger. Sync roles to include the active role.
-- Temporarily disable the self-role-escalation guard so the backfill can run
-- under the migration role. It's re-enabled immediately after.
alter table public.profiles disable trigger profiles_no_self_role_escalation;

update public.profiles
set roles = array[role]
where role <> 'angler'
  and (
    roles is null
    or not (role = any(roles))
    or (array_length(roles, 1) = 1 and roles[1] = 'angler')
  );

alter table public.profiles enable trigger profiles_no_self_role_escalation;
