/**
 * National Weather Service (NWS) API Client
 *
 * Implements the NWS forecast flow:
 *   1. GET /points/{lat},{lng}       → grid metadata, forecast URLs
 *   2. GET {forecastUrl}             → 14-period (7-day) forecast
 *   3. GET {forecastHourlyUrl}       → hourly forecast for today
 *   4. GET {forecastGridDataUrl}     → sunrise/sunset, precip amounts, wind gusts
 *
 * Steps 2–4 run in parallel. All data is normalized into AnglerPass types.
 *
 * API docs: https://www.weather.gov/documentation/services-web-api
 */

import type {
  ForecastDay,
  ForecastHour,
  PropertyForecast,
  WeatherCondition,
  FishingCondition,
} from "./types";
import { roundCurrency } from "@/lib/constants/fees";

const NWS_BASE = "https://api.weather.gov";
const USER_AGENT = "AnglerPass/1.0 (support@anglerpass.com)";
const FETCH_TIMEOUT_MS = 8000;

/* ═══════════════════════════════════════════════════════════════════════
   RAW NWS RESPONSE TYPES (internal only)
   ═══════════════════════════════════════════════════════════════════════ */

interface NwsPointsResponse {
  properties: {
    forecast: string;
    forecastHourly: string;
    forecastGridData: string;
    relativeLocation?: {
      properties?: { city?: string; state?: string };
    };
    gridId?: string;
    timeZone?: string;
  };
}

interface NwsForecastPeriod {
  number: number;
  name: string;
  startTime: string;
  endTime: string;
  isDaytime: boolean;
  temperature: number;
  temperatureUnit: string;
  probabilityOfPrecipitation?: { value: number | null };
  windSpeed: string;
  windDirection: string;
  shortForecast: string;
  detailedForecast: string;
}

interface NwsForecastResponse {
  properties: {
    updated: string;
    elevation?: { value: number; unitCode: string };
    periods: NwsForecastPeriod[];
  };
}

interface NwsHourlyPeriod {
  startTime: string;
  temperature: number;
  probabilityOfPrecipitation?: { value: number | null };
  windSpeed: string;
  windDirection: string;
  shortForecast: string;
  isDaytime: boolean;
}

interface NwsHourlyResponse {
  properties: {
    periods: NwsHourlyPeriod[];
  };
}

/** NWS gridData value entry — used for time-series data like precip, gusts. */
interface GridValue {
  validTime: string; // ISO8601 interval: "2024-01-15T06:00:00+00:00/PT6H"
  value: number | null;
}

interface NwsGridDataResponse {
  properties: {
    quantitativePrecipitation?: { values: GridValue[] };
    windGust?: { values: GridValue[] };
    /** Sunrise/sunset not directly in gridData — we'll compute from lat/lng */
  };
}

/* ═══════════════════════════════════════════════════════════════════════
   PUBLIC API
   ═══════════════════════════════════════════════════════════════════════ */

/**
 * Fetch and normalize a 7-day + hourly forecast from NWS.
 * Returns null if the API is unavailable or the location is not supported.
 */
export async function fetchNwsForecast(
  latitude: number,
  longitude: number
): Promise<PropertyForecast | null> {
  try {
    // Step 1: Resolve lat/lng to NWS grid metadata
    const pointsUrl = `${NWS_BASE}/points/${latitude.toFixed(4)},${longitude.toFixed(4)}`;
    const pointsRes = await fetchWithTimeout(pointsUrl);

    if (!pointsRes.ok) {
      console.warn(
        `[weather/nws] Points lookup failed: ${pointsRes.status} for ${latitude},${longitude}`
      );
      return null;
    }

    const pointsData = (await pointsRes.json()) as NwsPointsResponse;
    const props = pointsData.properties;

    if (!props?.forecast) {
      console.warn("[weather/nws] No forecast URL in points response");
      return null;
    }

    const relLoc = props.relativeLocation?.properties;
    const locationLabel =
      relLoc?.city && relLoc?.state
        ? `${relLoc.city}, ${relLoc.state}`
        : null;

    const timeZone = props.timeZone ?? "America/New_York";

    // Steps 2–4: Fetch forecast, hourly, and gridData in parallel
    const [forecastRes, hourlyRes, gridRes] = await Promise.all([
      fetchWithTimeout(props.forecast),
      props.forecastHourly
        ? fetchWithTimeout(props.forecastHourly)
        : Promise.resolve(null),
      props.forecastGridData
        ? fetchWithTimeout(props.forecastGridData)
        : Promise.resolve(null),
    ]);

    if (!forecastRes.ok) {
      console.warn(
        `[weather/nws] Forecast fetch failed: ${forecastRes.status}`
      );
      return null;
    }

    const forecastData = (await forecastRes.json()) as NwsForecastResponse;
    const periods = forecastData.properties?.periods;

    if (!periods?.length) {
      console.warn("[weather/nws] Empty forecast periods");
      return null;
    }

    // Parse optional data (failures here don't block the forecast)
    let hourlyPeriods: NwsHourlyPeriod[] = [];
    if (hourlyRes && hourlyRes.ok) {
      try {
        const hourlyData = (await hourlyRes.json()) as NwsHourlyResponse;
        hourlyPeriods = hourlyData.properties?.periods ?? [];
      } catch {
        // Hourly data is optional — proceed without it
      }
    }

    let gridPrecip: GridValue[] = [];
    let gridGusts: GridValue[] = [];
    if (gridRes && gridRes.ok) {
      try {
        const gridData = (await gridRes.json()) as NwsGridDataResponse;
        gridPrecip =
          gridData.properties?.quantitativePrecipitation?.values ?? [];
        gridGusts = gridData.properties?.windGust?.values ?? [];
      } catch {
        // Grid data is optional — proceed without it
      }
    }

    // Normalize elevation (NWS returns meters)
    const elevMeters = forecastData.properties.elevation?.value;
    const elevationFt =
      elevMeters != null ? Math.round(elevMeters * 3.28084) : null;

    // Compute sunrise/sunset from lat/lng (no external API needed)
    const sunTimes = computeSunTimesForWeek(latitude, longitude, timeZone);

    // Build daily precip map from gridData
    const dailyPrecip = aggregateGridByDate(gridPrecip, "sum");
    const dailyGusts = aggregateGridByDate(gridGusts, "max");

    // Normalize into AnglerPass forecast days
    const days = normalizePeriods(
      periods,
      sunTimes,
      dailyPrecip,
      dailyGusts
    );

    // Normalize hourly data (today only)
    const hourly = normalizeHourly(hourlyPeriods);

    return {
      days,
      hourly,
      updatedAt: new Date().toISOString(),
      locationLabel,
      elevationFt,
    };
  } catch (err) {
    console.error("[weather/nws] Fetch error:", err);
    return null;
  }
}

/* ═══════════════════════════════════════════════════════════════════════
   DAILY NORMALIZATION
   ═══════════════════════════════════════════════════════════════════════ */

function normalizePeriods(
  periods: NwsForecastPeriod[],
  sunTimes: Map<string, { sunrise: string; sunset: string }>,
  dailyPrecip: Map<string, number>,
  dailyGusts: Map<string, number>
): ForecastDay[] {
  const dayMap = new Map<
    string,
    { day?: NwsForecastPeriod; night?: NwsForecastPeriod }
  >();

  for (const period of periods) {
    const dateKey = period.startTime.slice(0, 10);
    const existing = dayMap.get(dateKey) ?? {};

    if (period.isDaytime) {
      existing.day = period;
    } else {
      existing.night = period;
    }

    dayMap.set(dateKey, existing);
  }

  const today = new Date().toISOString().slice(0, 10);
  const days: ForecastDay[] = [];

  for (const [dateKey, { day, night }] of dayMap) {
    const primary = day ?? night;
    if (!primary) continue;

    const highF = day?.temperature ?? primary.temperature;
    const lowF =
      night?.temperature ?? (day ? day.temperature - 15 : primary.temperature);

    const precipDay = day?.probabilityOfPrecipitation?.value;
    const precipNight = night?.probabilityOfPrecipitation?.value;
    const precipChance =
      precipDay != null || precipNight != null
        ? Math.max(precipDay ?? 0, precipNight ?? 0)
        : null;

    // Precip amount from gridData (mm → inches)
    const precipMm = dailyPrecip.get(dateKey);
    const precipAmountIn =
      precipMm != null ? roundCurrency(precipMm / 25.4) : null;

    // Wind gusts from gridData (km/h → mph)
    const gustKmh = dailyGusts.get(dateKey);
    const windGustMph =
      gustKmh != null ? Math.round(gustKmh * 0.621371) : null;

    // Sunrise/sunset
    const sun = sunTimes.get(dateKey);

    // Fishing conditions
    const fishingCondition = rateFishingConditions(
      precipChance,
      extractMaxWind(primary.windSpeed),
      windGustMph,
      highF,
      lowF,
      primary.shortForecast
    );

    days.push({
      date: dateKey,
      label: dateKey === today ? "Today" : formatDayLabel(dateKey),
      summary: primary.shortForecast,
      condition: classifyCondition(primary.shortForecast),
      highF,
      lowF,
      precipChance,
      precipAmountIn,
      wind: primary.windSpeed,
      windDirection: primary.windDirection,
      windGustMph,
      isDaytime: primary.isDaytime,
      sunrise: sun?.sunrise ?? null,
      sunset: sun?.sunset ?? null,
      fishingCondition,
    });
  }

  return days.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 7);
}

/* ═══════════════════════════════════════════════════════════════════════
   HOURLY NORMALIZATION
   ═══════════════════════════════════════════════════════════════════════ */

function normalizeHourly(periods: NwsHourlyPeriod[]): ForecastHour[] {
  if (!periods.length) return [];

  const now = new Date();
  const cutoff = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const hours: ForecastHour[] = [];

  for (const p of periods) {
    const time = new Date(p.startTime);
    if (time < now || time > cutoff) continue;

    hours.push({
      time: p.startTime,
      label: time.toLocaleTimeString("en-US", {
        hour: "numeric",
        hour12: true,
      }),
      tempF: p.temperature,
      summary: p.shortForecast,
      condition: classifyCondition(p.shortForecast),
      precipChance: p.probabilityOfPrecipitation?.value ?? null,
      wind: p.windSpeed,
      windDirection: p.windDirection,
    });
  }

  return hours;
}

/* ═══════════════════════════════════════════════════════════════════════
   FISHING CONDITIONS RATING
   ═══════════════════════════════════════════════════════════════════════ */

/**
 * Rate fishing conditions based on weather signals.
 *
 * Scoring philosophy:
 * - Overcast/light rain with low wind = excellent (fish feed more actively)
 * - Clear skies, moderate temps, calm wind = good
 * - High wind or heavy rain = challenging
 * - Thunderstorms = challenging
 * - Extreme cold or heat = fair to challenging
 */
function rateFishingConditions(
  precipChance: number | null,
  maxWindMph: number,
  gustMph: number | null,
  highF: number,
  lowF: number,
  summary: string
): FishingCondition {
  const text = summary.toLowerCase();
  let score = 70; // Start at "good"

  // Thunderstorms are always challenging
  if (text.includes("thunder") || text.includes("severe")) {
    return "challenging";
  }

  // Overcast / cloudy = fish tend to feed more (slight boost)
  if (text.includes("cloudy") || text.includes("overcast")) {
    score += 10;
  }

  // Light rain / drizzle = excellent feeding conditions
  if (
    text.includes("drizzle") ||
    (text.includes("light rain") && !text.includes("heavy"))
  ) {
    score += 12;
  }

  // Heavy rain penalizes
  if (text.includes("heavy rain") || text.includes("downpour")) {
    score -= 25;
  }

  // Precipitation chance penalty (moderate)
  if (precipChance != null && precipChance > 60) {
    score -= 10;
  }

  // Wind penalties — gusts matter more than sustained
  const effectiveWind = Math.max(maxWindMph, (gustMph ?? 0) * 0.8);
  if (effectiveWind > 25) {
    score -= 30;
  } else if (effectiveWind > 18) {
    score -= 15;
  } else if (effectiveWind > 12) {
    score -= 5;
  }

  // Temperature — moderate is best for most species
  const avgTemp = (highF + lowF) / 2;
  if (avgTemp >= 50 && avgTemp <= 75) {
    score += 8;
  } else if (avgTemp < 35 || avgTemp > 90) {
    score -= 15;
  } else if (avgTemp < 45 || avgTemp > 85) {
    score -= 5;
  }

  // Snow/ice
  if (text.includes("snow") || text.includes("ice") || text.includes("sleet")) {
    score -= 20;
  }

  // Map score to rating
  if (score >= 80) return "excellent";
  if (score >= 60) return "good";
  if (score >= 40) return "fair";
  return "challenging";
}

/* ═══════════════════════════════════════════════════════════════════════
   SUNRISE / SUNSET CALCULATION
   ═══════════════════════════════════════════════════════════════════════ */

/**
 * Compute sunrise and sunset for the next 7 days using the solar position algorithm.
 * No external API call needed — pure math from lat/lng.
 */
function computeSunTimesForWeek(
  lat: number,
  lng: number,
  timeZone: string
): Map<string, { sunrise: string; sunset: string }> {
  const result = new Map<string, { sunrise: string; sunset: string }>();

  for (let i = 0; i < 8; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const dateKey = date.toISOString().slice(0, 10);

    const times = computeSunriseSunset(
      lat,
      lng,
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
      timeZone
    );

    if (times) {
      result.set(dateKey, times);
    }
  }

  return result;
}

/**
 * Calculate sunrise/sunset using the NOAA Solar Calculator algorithm.
 * Returns formatted time strings in the property's local timezone.
 */
function computeSunriseSunset(
  lat: number,
  lng: number,
  year: number,
  month: number,
  day: number,
  timeZone: string
): { sunrise: string; sunset: string } | null {
  try {
    // Julian day
    const a = Math.floor((14 - month) / 12);
    const y = year + 4800 - a;
    const m = month + 12 * a - 3;
    const jd =
      day +
      Math.floor((153 * m + 2) / 5) +
      365 * y +
      Math.floor(y / 4) -
      Math.floor(y / 100) +
      Math.floor(y / 400) -
      32045;

    // Julian century
    const jc = (jd - 2451545) / 36525;

    // Solar calculations
    const geomMeanLongSun = (280.46646 + jc * (36000.76983 + 0.0003032 * jc)) % 360;
    const geomMeanAnomSun = 357.52911 + jc * (35999.05029 - 0.0001537 * jc);
    const eccentEarthOrbit = 0.016708634 - jc * (0.000042037 + 0.0000001267 * jc);

    const sunEqOfCtr =
      Math.sin(toRad(geomMeanAnomSun)) * (1.914602 - jc * (0.004817 + 0.000014 * jc)) +
      Math.sin(toRad(2 * geomMeanAnomSun)) * (0.019993 - 0.000101 * jc) +
      Math.sin(toRad(3 * geomMeanAnomSun)) * 0.000289;

    const sunTrueLong = geomMeanLongSun + sunEqOfCtr;
    const sunAppLong =
      sunTrueLong - 0.00569 - 0.00478 * Math.sin(toRad(125.04 - 1934.136 * jc));

    const meanObliqEcliptic =
      23 + (26 + (21.448 - jc * (46.815 + jc * (0.00059 - jc * 0.001813))) / 60) / 60;
    const obliqCorr =
      meanObliqEcliptic + 0.00256 * Math.cos(toRad(125.04 - 1934.136 * jc));

    const sunDeclin = toDeg(
      Math.asin(Math.sin(toRad(obliqCorr)) * Math.sin(toRad(sunAppLong)))
    );

    const varY = Math.tan(toRad(obliqCorr / 2)) ** 2;
    const eqOfTime =
      4 *
      toDeg(
        varY * Math.sin(2 * toRad(geomMeanLongSun)) -
          2 * eccentEarthOrbit * Math.sin(toRad(geomMeanAnomSun)) +
          4 * eccentEarthOrbit * varY * Math.sin(toRad(geomMeanAnomSun)) * Math.cos(2 * toRad(geomMeanLongSun)) -
          0.5 * varY * varY * Math.sin(4 * toRad(geomMeanLongSun)) -
          1.25 * eccentEarthOrbit * eccentEarthOrbit * Math.sin(2 * toRad(geomMeanAnomSun))
      );

    const haSunrise = toDeg(
      Math.acos(
        Math.cos(toRad(90.833)) / (Math.cos(toRad(lat)) * Math.cos(toRad(sunDeclin))) -
          Math.tan(toRad(lat)) * Math.tan(toRad(sunDeclin))
      )
    );

    if (isNaN(haSunrise)) return null; // No sunrise/sunset (polar)

    // Solar noon in minutes from midnight UTC
    const solarNoon = (720 - 4 * lng - eqOfTime) / 1440;
    const sunriseUTC = solarNoon - (haSunrise * 4) / 1440;
    const sunsetUTC = solarNoon + (haSunrise * 4) / 1440;

    // Convert fractional day to a Date and format in the property's timezone
    const baseDate = new Date(year, month - 1, day, 0, 0, 0);

    const sunriseDate = new Date(baseDate.getTime() + sunriseUTC * 86400000);
    const sunsetDate = new Date(baseDate.getTime() + sunsetUTC * 86400000);

    const fmt = (d: Date) =>
      d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone,
      });

    return {
      sunrise: fmt(sunriseDate),
      sunset: fmt(sunsetDate),
    };
  } catch {
    return null;
  }
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/* ═══════════════════════════════════════════════════════════════════════
   GRID DATA AGGREGATION
   ═══════════════════════════════════════════════════════════════════════ */

/**
 * Aggregate NWS gridData time-series values by date.
 * GridData uses ISO8601 intervals like "2024-01-15T06:00:00+00:00/PT6H".
 */
function aggregateGridByDate(
  values: GridValue[],
  mode: "sum" | "max"
): Map<string, number> {
  const result = new Map<string, number>();

  for (const entry of values) {
    if (entry.value == null) continue;

    const dateKey = entry.validTime.slice(0, 10);
    const existing = result.get(dateKey);

    if (existing == null) {
      result.set(dateKey, entry.value);
    } else if (mode === "sum") {
      result.set(dateKey, existing + entry.value);
    } else {
      result.set(dateKey, Math.max(existing, entry.value));
    }
  }

  return result;
}

/* ═══════════════════════════════════════════════════════════════════════
   CONDITION CLASSIFICATION
   ═══════════════════════════════════════════════════════════════════════ */

function classifyCondition(shortForecast: string): WeatherCondition {
  const text = shortForecast.toLowerCase();

  if (text.includes("thunder")) return "thunderstorm";
  if (text.includes("sleet") || text.includes("ice") || text.includes("freezing rain"))
    return "sleet";
  if (text.includes("snow") || text.includes("blizzard")) return "snow";
  if (text.includes("heavy rain") || text.includes("downpour"))
    return "rain-heavy";
  if (text.includes("rain") || text.includes("shower") || text.includes("drizzle"))
    return "rain";
  if (text.includes("fog") || text.includes("mist") || text.includes("haze"))
    return "fog";
  if (text.includes("wind") && !text.includes("cloud") && !text.includes("rain"))
    return "wind";
  if (text.includes("cloudy") || text.includes("overcast")) {
    if (text.includes("partly") || text.includes("mostly sunny"))
      return "partly-cloudy";
    return "cloudy";
  }
  if (text.includes("sunny") || text.includes("clear") || text.includes("fair"))
    return "clear";
  if (text.includes("partly")) return "partly-cloudy";

  return "unknown";
}

function formatDayLabel(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

function extractMaxWind(wind: string): number {
  const numbers = wind.match(/\d+/g);
  if (!numbers) return 0;
  return Math.max(...numbers.map(Number));
}

/* ═══════════════════════════════════════════════════════════════════════
   FETCH HELPER
   ═══════════════════════════════════════════════════════════════════════ */

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/geo+json",
      },
      cache: "no-store",
    });
  } finally {
    clearTimeout(timeout);
  }
}
