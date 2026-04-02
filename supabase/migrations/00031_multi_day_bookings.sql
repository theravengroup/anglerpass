-- Add multi-day booking support
-- Each day in a multi-day booking gets its own booking record,
-- linked by a shared booking_group_id.

alter table public.bookings
  add column if not exists booking_group_id uuid,
  add column if not exists booking_days integer not null default 1,
  add column if not exists booking_start_date date,
  add column if not exists booking_end_date date;

-- Index for grouping multi-day bookings
create index if not exists idx_bookings_group on public.bookings(booking_group_id)
  where booking_group_id is not null;

comment on column public.bookings.booking_group_id is
  'Groups individual day records in a multi-day booking. Null for single-day bookings.';
comment on column public.bookings.booking_days is
  'Total number of days in the booking (1 for single-day).';
comment on column public.bookings.booking_start_date is
  'First date of the booking range. Same as booking_date for single-day.';
comment on column public.bookings.booking_end_date is
  'Last date of the booking range (inclusive). Same as booking_date for single-day.';
