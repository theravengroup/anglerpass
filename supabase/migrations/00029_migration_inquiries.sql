-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  00029 — Migration inquiry form submissions                       ║
-- ║  Stores club data-migration inquiry requests from the /clubs FAQ  ║
-- ╚══════════════════════════════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS public.migration_inquiries (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_name     text NOT NULL,
  contact_name  text NOT NULL,
  email         text NOT NULL,
  member_count  integer NOT NULL,
  data_source   text NOT NULL,
  website_platform text,
  multiyear_interest text,
  target_launch  date,
  loom_url      text NOT NULL,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Allow the service-role client to insert (no RLS needed — API route only)
ALTER TABLE public.migration_inquiries ENABLE ROW LEVEL SECURITY;
