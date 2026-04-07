/**
 * Solunar and moon phase calculations for fishing.
 * Uses the suncalc package — no external API required.
 *
 * Solunar theory: Fish feed more actively during major/minor solunar periods,
 * which correlate with the moon's position relative to the observer.
 */

import SunCalc from "suncalc";

export interface MoonData {
  phase: number; // 0–1 (0 = new, 0.5 = full)
  phaseName: string;
  illumination: number; // 0–100%
  moonrise: string | null;
  moonset: string | null;
  fishingRating: "excellent" | "good" | "fair" | "poor";
  fishingNotes: string;
}

export interface SolunarPeriod {
  type: "major" | "minor";
  start: string; // HH:mm
  end: string; // HH:mm
  description: string;
}

export interface SolunarData {
  date: string;
  moon: MoonData;
  periods: SolunarPeriod[];
  overallRating: "excellent" | "good" | "fair" | "poor";
}

const PHASE_NAMES: Array<{ max: number; name: string }> = [
  { max: 0.0625, name: "New Moon" },
  { max: 0.1875, name: "Waxing Crescent" },
  { max: 0.3125, name: "First Quarter" },
  { max: 0.4375, name: "Waxing Gibbous" },
  { max: 0.5625, name: "Full Moon" },
  { max: 0.6875, name: "Waning Gibbous" },
  { max: 0.8125, name: "Last Quarter" },
  { max: 0.9375, name: "Waning Crescent" },
  { max: 1.0, name: "New Moon" },
];

function getPhaseName(phase: number): string {
  return PHASE_NAMES.find((p) => phase <= p.max)?.name ?? "New Moon";
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/Denver",
  });
}

/**
 * Determine fishing quality based on moon phase.
 * Best around new moon and full moon (strongest gravitational pull).
 */
function getMoonFishingRating(phase: number): {
  rating: MoonData["fishingRating"];
  notes: string;
} {
  // Distance from new moon (0) or full moon (0.5)
  const distFromNewOrFull = Math.min(phase, Math.abs(phase - 0.5), 1 - phase);

  if (distFromNewOrFull < 0.05) {
    return {
      rating: "excellent",
      notes:
        phase < 0.25
          ? "New moon — strong feeding activity expected, low light conditions favor subsurface patterns"
          : "Full moon — peak solunar influence, fish active throughout the day",
    };
  }
  if (distFromNewOrFull < 0.12) {
    return {
      rating: "good",
      notes: "Near major moon phase — above-average feeding activity likely",
    };
  }
  if (distFromNewOrFull < 0.2) {
    return {
      rating: "fair",
      notes: "Moderate moon influence — standard feeding patterns expected",
    };
  }
  return {
    rating: "poor",
    notes:
      "Quarter moon — weakest solunar period, focus on dawn/dusk windows and hatch timing",
  };
}

/**
 * Calculate solunar periods for a given date and location.
 * Major periods: moon transit (overhead) and moon underfoot (opposite).
 * Minor periods: moonrise and moonset.
 */
export function getSolunarData(
  date: Date,
  latitude: number,
  longitude: number
): SolunarData {
  const moonIllumination = SunCalc.getMoonIllumination(date);
  const moonTimes = SunCalc.getMoonTimes(date, latitude, longitude);
  const moonPosition = SunCalc.getMoonPosition(date, latitude, longitude);

  const phase = moonIllumination.phase;
  const phaseName = getPhaseName(phase);
  const illumination = Math.round(moonIllumination.fraction * 100);
  const { rating, notes } = getMoonFishingRating(phase);

  const periods: SolunarPeriod[] = [];

  // Minor period at moonrise (~1 hour window)
  if (moonTimes.rise) {
    const start = new Date(moonTimes.rise.getTime() - 30 * 60000);
    const end = new Date(moonTimes.rise.getTime() + 30 * 60000);
    periods.push({
      type: "minor",
      start: formatTime(start),
      end: formatTime(end),
      description: "Moonrise — minor feeding period",
    });
  }

  // Minor period at moonset (~1 hour window)
  if (moonTimes.set) {
    const start = new Date(moonTimes.set.getTime() - 30 * 60000);
    const end = new Date(moonTimes.set.getTime() + 30 * 60000);
    periods.push({
      type: "minor",
      start: formatTime(start),
      end: formatTime(end),
      description: "Moonset — minor feeding period",
    });
  }

  // Major period: moon transit (highest point) — ~2 hour window
  // Approximate: midpoint between rise and set, or noon offset by altitude
  const altitudeDeg = (moonPosition.altitude * 180) / Math.PI;
  if (altitudeDeg > -10) {
    // Moon is or will be visible
    const transitTime = moonTimes.rise
      ? new Date(
          moonTimes.rise.getTime() +
            (moonTimes.set
              ? (moonTimes.set.getTime() - moonTimes.rise.getTime()) / 2
              : 6 * 3600000)
        )
      : date;

    const start = new Date(transitTime.getTime() - 60 * 60000);
    const end = new Date(transitTime.getTime() + 60 * 60000);
    periods.push({
      type: "major",
      start: formatTime(start),
      end: formatTime(end),
      description: "Moon overhead — major feeding period",
    });

    // Moon underfoot (opposite side, ~12h offset)
    const underfoot = new Date(transitTime.getTime() + 12 * 3600000);
    const ufStart = new Date(underfoot.getTime() - 60 * 60000);
    const ufEnd = new Date(underfoot.getTime() + 60 * 60000);
    if (underfoot.getDate() === date.getDate()) {
      periods.push({
        type: "major",
        start: formatTime(ufStart),
        end: formatTime(ufEnd),
        description: "Moon underfoot — major feeding period",
      });
    }
  }

  // Sort periods by start time
  periods.sort((a, b) => a.start.localeCompare(b.start));

  return {
    date: date.toISOString().slice(0, 10),
    moon: {
      phase,
      phaseName,
      illumination,
      moonrise: moonTimes.rise ? formatTime(moonTimes.rise) : null,
      moonset: moonTimes.set ? formatTime(moonTimes.set) : null,
      fishingRating: rating,
      fishingNotes: notes,
    },
    periods,
    overallRating: rating,
  };
}
