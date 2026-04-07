-- Seed the initial platform admin account.
--
-- PREREQUISITE: The user support@anglerpass.com must already exist in
-- Supabase Auth (Authentication → Users → Add User → Create New User).
-- The signup trigger in migration 00002 auto-creates their profile with
-- role = 'angler'. This migration promotes them to admin.
--
-- If the auth user doesn't exist yet, this migration is a safe no-op.

-- Promote support@anglerpass.com to admin
update public.profiles
set
  role = 'admin',
  display_name = coalesce(display_name, 'AnglerPass Support'),
  updated_at = now()
where id = (
  select id from auth.users where email = 'support@anglerpass.com' limit 1
)
and role != 'admin';

-- Also ensure they have a platform_staff record as super_admin
insert into public.platform_staff (user_id, role, granted_by)
select
  p.id,
  'super_admin',
  p.id  -- self-granted (bootstrap)
from public.profiles p
join auth.users u on u.id = p.id
where u.email = 'support@anglerpass.com'
  and p.role = 'admin'
  and not exists (
    select 1 from public.platform_staff ps
    where ps.user_id = p.id and ps.revoked_at is null
  );
