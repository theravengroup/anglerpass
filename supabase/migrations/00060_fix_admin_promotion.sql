-- Re-run admin promotion for support@anglerpass.com
-- Migration 00058 was a no-op if the auth user didn't exist yet at migration time.
-- This ensures the promotion happens now that the user exists.

-- Promote to admin role
update public.profiles
set
  role = 'admin',
  roles = array['admin', 'landowner', 'club_admin', 'angler'],
  display_name = coalesce(display_name, 'AnglerPass Support'),
  updated_at = now()
where id = (
  select id from auth.users where email = 'support@anglerpass.com' limit 1
)
and role != 'admin';

-- Ensure platform_staff record exists
insert into public.platform_staff (user_id, role, granted_by)
select
  p.id,
  'super_admin',
  p.id
from public.profiles p
join auth.users u on u.id = p.id
where u.email = 'support@anglerpass.com'
  and p.role = 'admin'
  and not exists (
    select 1 from public.platform_staff ps
    where ps.user_id = p.id and ps.revoked_at is null
  );
