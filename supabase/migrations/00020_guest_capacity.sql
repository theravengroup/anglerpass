-- Migration 00020: Separate rod limits from total guest capacity
--
-- Landowners set two limits per property:
--   max_rods   — Maximum number of fishing anglers allowed per day
--   max_guests — Maximum total people on property (anglers + non-fishing guests)
--
-- Bookings now track:
--   party_size         — Number of anglers (rods). Only the booking member must be a member.
--   non_fishing_guests — Non-fishing companions (no rod fee charged)
--
-- Constraints:
--   party_size         <= property.max_rods
--   party_size + non_fishing_guests <= property.max_guests

-- Add new capacity columns to properties
alter table public.properties
  add column if not exists max_rods integer,
  add column if not exists max_guests integer;

-- Migrate existing capacity data: treat old capacity as max_rods,
-- and set max_guests to the same value as a starting point
update public.properties
  set max_rods = capacity,
      max_guests = capacity
  where capacity is not null
    and max_rods is null;

-- Add non_fishing_guests to bookings (defaults to 0)
alter table public.bookings
  add column if not exists non_fishing_guests integer not null default 0;

-- Add check constraints
alter table public.bookings
  add constraint bookings_non_fishing_guests_check
    check (non_fishing_guests >= 0 and non_fishing_guests <= 50);

comment on column public.properties.max_rods is
  'Maximum number of fishing rods (anglers) allowed per day';
comment on column public.properties.max_guests is
  'Maximum total people allowed on property per day (anglers + non-fishing guests)';
comment on column public.bookings.non_fishing_guests is
  'Number of non-fishing companions (no rod fee charged, but count toward max_guests)';
