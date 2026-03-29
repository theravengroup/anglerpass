-- Phase 8: Map & Search — Add geolocation columns to properties
-- Separate numeric lat/lng columns for spatial queries and map display

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision;

-- Backfill from existing coordinates string column ("lat, lng" format)
UPDATE properties
SET
  latitude = CAST(split_part(coordinates, ',', 1) AS double precision),
  longitude = CAST(split_part(coordinates, ',', 2) AS double precision)
WHERE coordinates IS NOT NULL
  AND coordinates ~ '^-?\d+\.?\d*\s*,\s*-?\d+\.?\d*$'
  AND latitude IS NULL;

-- Index for bounding-box queries (map viewport)
CREATE INDEX IF NOT EXISTS idx_properties_lat_lng
  ON properties(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
