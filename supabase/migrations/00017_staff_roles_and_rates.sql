-- Migration 00017: Add staff role to club memberships and staff rates to properties
-- Staff members help run a club and get discounted rod fees.

-- 1. Allow 'staff' as a club membership role.
--    The role column currently stores 'admin' or 'member'.
--    We add 'staff' as a valid option. No CHECK constraint exists,
--    so this is purely a documentation/convention update.
--    Add a comment for clarity:
comment on column public.club_memberships.role is
  'Membership role: admin (club owner), staff (helps run the club), member (regular angler)';

-- 2. Add staff discount percentage to properties.
--    Club owners set this per-property so staff get reduced rod fees.
--    Default 0 means no discount; 100 means free.
alter table public.properties
  add column if not exists staff_rate_discount integer default 0
  constraint staff_rate_discount_range check (staff_rate_discount >= 0 and staff_rate_discount <= 100);

comment on column public.properties.staff_rate_discount is
  'Percentage discount on rod fees for staff members (0-100). 100 = free.';
