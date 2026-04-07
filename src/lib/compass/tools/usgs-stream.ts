/**
 * USGS Water Services — Real-time stream flow (CFS) and water temperature.
 * https://waterservices.usgs.gov/rest/IV-Service.html
 *
 * Free, no API key required. Rate limit: ~100 req/min.
 * Parameter codes: 00060 = Discharge (cfs), 00010 = Water Temp (°C)
 */

const USGS_BASE = "https://waterservices.usgs.gov/nwis/iv";
const PARAM_DISCHARGE = "00060";
const PARAM_WATER_TEMP = "00010";

export interface StreamConditions {
  siteId: string;
  siteName: string;
  latitude: number;
  longitude: number;
  dischargeCfs: number | null;
  dischargeDateTime: string | null;
  waterTempC: number | null;
  waterTempF: number | null;
  waterTempDateTime: string | null;
}

interface USGSSite {
  sourceInfo: {
    siteName: string;
    siteCode: Array<{ value: string }>;
    geoLocation: {
      geogLocation: { latitude: number; longitude: number };
    };
  };
  values: Array<{
    value: Array<{ value: string; dateTime: string }>;
  }>;
  variable: {
    variableCode: Array<{ value: string }>;
  };
}

interface USGSResponse {
  value: {
    timeSeries: USGSSite[];
  };
}

/**
 * Find USGS stream gauges near a lat/lng and return current conditions.
 * Searches within a bounding box (~30 miles by default).
 */
export async function getStreamConditions(
  latitude: number,
  longitude: number,
  radiusMiles: number = 30
): Promise<StreamConditions[]> {
  // Convert miles to approximate degrees (1 degree ≈ 69 miles at mid-latitudes)
  const degOffset = radiusMiles / 69;
  const west = longitude - degOffset;
  const east = longitude + degOffset;
  const south = latitude - degOffset;
  const north = latitude + degOffset;

  const params = new URLSearchParams({
    format: "json",
    bBox: `${west.toFixed(4)},${south.toFixed(4)},${east.toFixed(4)},${north.toFixed(4)}`,
    parameterCd: `${PARAM_DISCHARGE},${PARAM_WATER_TEMP}`,
    siteType: "ST", // streams only
    siteStatus: "active",
  });

  const url = `${USGS_BASE}?${params.toString()}`;

  try {
    const response = await fetch(url, {
      next: { revalidate: 900 }, // Cache 15 minutes
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.error(`USGS API error: ${response.status}`);
      return [];
    }

    const data: USGSResponse = await response.json();
    const timeSeries = data.value?.timeSeries ?? [];

    // Group by site
    const siteMap = new Map<string, StreamConditions>();

    for (const series of timeSeries) {
      const siteId = series.sourceInfo.siteCode[0]?.value;
      if (!siteId) continue;

      if (!siteMap.has(siteId)) {
        siteMap.set(siteId, {
          siteId,
          siteName: series.sourceInfo.siteName,
          latitude: series.sourceInfo.geoLocation.geogLocation.latitude,
          longitude: series.sourceInfo.geoLocation.geogLocation.longitude,
          dischargeCfs: null,
          dischargeDateTime: null,
          waterTempC: null,
          waterTempF: null,
          waterTempDateTime: null,
        });
      }

      const site = siteMap.get(siteId)!;
      const latestValue = series.values[0]?.value?.[0];
      if (!latestValue) continue;

      const paramCode = series.variable.variableCode[0]?.value;
      const val = parseFloat(latestValue.value);

      if (isNaN(val) || val < 0) continue;

      if (paramCode === PARAM_DISCHARGE) {
        site.dischargeCfs = Math.round(val);
        site.dischargeDateTime = latestValue.dateTime;
      } else if (paramCode === PARAM_WATER_TEMP) {
        site.waterTempC = Math.round(val * 10) / 10;
        site.waterTempF = Math.round(val * 9 / 5 + 32);
        site.waterTempDateTime = latestValue.dateTime;
      }
    }

    // Sort by distance from target coordinates (closest first)
    return [...siteMap.values()].sort((a, b) => {
      const distA = Math.hypot(a.latitude - latitude, a.longitude - longitude);
      const distB = Math.hypot(b.latitude - latitude, b.longitude - longitude);
      return distA - distB;
    });
  } catch (err) {
    console.error("USGS fetch failed:", err);
    return [];
  }
}

/**
 * Get conditions for a specific USGS gauge by site number.
 */
export async function getGaugeConditions(
  siteNumber: string
): Promise<StreamConditions | null> {
  const params = new URLSearchParams({
    format: "json",
    sites: siteNumber,
    parameterCd: `${PARAM_DISCHARGE},${PARAM_WATER_TEMP}`,
  });

  const url = `${USGS_BASE}?${params.toString()}`;

  try {
    const response = await fetch(url, {
      next: { revalidate: 900 },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return null;

    const data: USGSResponse = await response.json();
    const timeSeries = data.value?.timeSeries ?? [];

    if (timeSeries.length === 0) return null;

    const result: StreamConditions = {
      siteId: siteNumber,
      siteName: timeSeries[0].sourceInfo.siteName,
      latitude: timeSeries[0].sourceInfo.geoLocation.geogLocation.latitude,
      longitude: timeSeries[0].sourceInfo.geoLocation.geogLocation.longitude,
      dischargeCfs: null,
      dischargeDateTime: null,
      waterTempC: null,
      waterTempF: null,
      waterTempDateTime: null,
    };

    for (const series of timeSeries) {
      const latestValue = series.values[0]?.value?.[0];
      if (!latestValue) continue;

      const paramCode = series.variable.variableCode[0]?.value;
      const val = parseFloat(latestValue.value);
      if (isNaN(val) || val < 0) continue;

      if (paramCode === PARAM_DISCHARGE) {
        result.dischargeCfs = Math.round(val);
        result.dischargeDateTime = latestValue.dateTime;
      } else if (paramCode === PARAM_WATER_TEMP) {
        result.waterTempC = Math.round(val * 10) / 10;
        result.waterTempF = Math.round(val * 9 / 5 + 32);
        result.waterTempDateTime = latestValue.dateTime;
      }
    }

    return result;
  } catch {
    return null;
  }
}
