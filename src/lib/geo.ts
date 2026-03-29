/**
 * Geolocation utilities for parsing and working with coordinates
 */

const COORD_REGEX = /^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/;

/**
 * Parse a "lat, lng" string into separate numeric values.
 * Returns null values if the string is empty or invalid.
 */
export function parseCoordinates(coords?: string): {
  latitude: number | null;
  longitude: number | null;
} {
  if (!coords) return { latitude: null, longitude: null };

  const match = coords.trim().match(COORD_REGEX);
  if (!match) return { latitude: null, longitude: null };

  const lat = parseFloat(match[1]);
  const lng = parseFloat(match[2]);

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return { latitude: null, longitude: null };
  }

  return { latitude: lat, longitude: lng };
}

/**
 * Check if a point is within a bounding box
 */
export function isInBounds(
  lat: number,
  lng: number,
  bounds: { north: number; south: number; east: number; west: number }
): boolean {
  return (
    lat >= bounds.south &&
    lat <= bounds.north &&
    lng >= bounds.west &&
    lng <= bounds.east
  );
}

/**
 * Calculate approximate distance between two points in miles (Haversine formula)
 */
export function distanceMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
