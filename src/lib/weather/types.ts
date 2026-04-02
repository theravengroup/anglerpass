/**
 * AnglerPass Weather Types
 *
 * Provider-agnostic forecast types. The frontend only consumes these shapes,
 * never raw NWS responses. This normalization layer makes it trivial to swap
 * providers later without touching any UI code.
 */

/** A single day's forecast in the AnglerPass-normalized shape. */
export interface ForecastDay {
  /** ISO date string (YYYY-MM-DD) */
  date: string;
  /** Human-readable day label: "Today", "Mon", "Tue", etc. */
  label: string;
  /** One-line condition summary, e.g. "Partly Cloudy" */
  summary: string;
  /** Simplified condition key for icon selection */
  condition: WeatherCondition;
  /** High temperature in °F */
  highF: number;
  /** Low temperature in °F */
  lowF: number;
  /** Probability of precipitation as a percentage (0–100), null if unavailable */
  precipChance: number | null;
  /** Expected precipitation amount in inches, null if unavailable */
  precipAmountIn: number | null;
  /** Wind speed summary, e.g. "5 to 10 mph" */
  wind: string;
  /** Wind direction abbreviation, e.g. "NW", "SSE" */
  windDirection: string;
  /** Wind gust speed in mph, null if unavailable or calm */
  windGustMph: number | null;
  /** Whether this is the daytime period (true) or nighttime (false) */
  isDaytime: boolean;
  /** Sunrise time as "H:MM AM/PM", null if unavailable */
  sunrise: string | null;
  /** Sunset time as "H:MM AM/PM", null if unavailable */
  sunset: string | null;
  /** Fishing conditions rating for this day */
  fishingCondition: FishingCondition;
}

/** A single hour's forecast for the hourly Today view. */
export interface ForecastHour {
  /** ISO timestamp */
  time: string;
  /** Hour label, e.g. "6 AM", "2 PM" */
  label: string;
  /** Temperature in °F */
  tempF: number;
  /** One-line condition summary */
  summary: string;
  /** Simplified condition key for icon selection */
  condition: WeatherCondition;
  /** Probability of precipitation (0–100), null if unavailable */
  precipChance: number | null;
  /** Wind speed summary, e.g. "10 mph" */
  wind: string;
  /** Wind direction abbreviation */
  windDirection: string;
}

/** The full forecast response returned to the frontend. */
export interface PropertyForecast {
  /** Array of daily forecasts (up to 7 days) */
  days: ForecastDay[];
  /** Hourly forecast for today (up to 24 hours from now) */
  hourly: ForecastHour[];
  /** ISO timestamp of when this forecast was fetched and cached */
  updatedAt: string;
  /** Nearest NWS grid location name, e.g. "Grand Junction, CO" */
  locationLabel: string | null;
  /** Elevation of the forecast grid point, if available */
  elevationFt: number | null;
}

/**
 * Simplified condition keys used for icon mapping.
 * Derived from NWS short forecast text.
 */
export type WeatherCondition =
  | "clear"
  | "partly-cloudy"
  | "cloudy"
  | "rain"
  | "rain-heavy"
  | "thunderstorm"
  | "snow"
  | "sleet"
  | "fog"
  | "wind"
  | "unknown";

/** Fishing conditions rating derived from weather signals. */
export type FishingCondition = "excellent" | "good" | "fair" | "challenging";
