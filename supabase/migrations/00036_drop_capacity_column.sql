-- Drop the deprecated `capacity` column from properties.
-- This column was replaced by `max_rods` and `max_guests` in migration 00020.
-- Data was migrated in 00020; all application code now uses the new columns.

ALTER TABLE public.properties DROP COLUMN IF EXISTS capacity;
