/**
 * Sunrise / sunset calculations using suncalc.
 * Provides golden-hour and prime fishing window info.
 */

import SunCalc from "suncalc";

export interface SunTimesData {
  date: string;
  sunrise: string;
  sunset: string;
  dawn: string; // civil twilight start
  dusk: string; // civil twilight end
  goldenHourMorning: { start: string; end: string };
  goldenHourEvening: { start: string; end: string };
  dayLengthHours: number;
  primeFishingWindows: Array<{
    label: string;
    start: string;
    end: string;
    notes: string;
  }>;
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
 * Get sun times and prime fishing windows for a date and location.
 */
export function getSunTimes(
  date: Date,
  latitude: number,
  longitude: number
): SunTimesData {
  const times = SunCalc.getTimes(date, latitude, longitude);

  const sunrise = times.sunrise;
  const sunset = times.sunset;
  const dawn = times.dawn; // civil twilight
  const dusk = times.dusk;
  const goldenHourStart = times.goldenHour; // evening golden hour start
  const goldenHourEnd = times.goldenHourEnd; // morning golden hour end (yes, naming is confusing in suncalc)

  const dayLengthMs = sunset.getTime() - sunrise.getTime();
  const dayLengthHours = Math.round((dayLengthMs / 3600000) * 10) / 10;

  // Prime fishing windows
  const windows = [
    {
      label: "Early Morning",
      start: formatTime(new Date(sunrise.getTime() - 30 * 60000)),
      end: formatTime(new Date(sunrise.getTime() + 120 * 60000)),
      notes:
        "Low light triggers insect activity. Best for dry fly and emerger patterns.",
    },
    {
      label: "Late Morning",
      start: formatTime(new Date(sunrise.getTime() + 180 * 60000)),
      end: formatTime(new Date(sunrise.getTime() + 300 * 60000)),
      notes:
        "Water warms, hatches peak (BWOs, PMDs). Fish move to feeding lanes.",
    },
    {
      label: "Evening",
      start: formatTime(new Date(sunset.getTime() - 150 * 60000)),
      end: formatTime(new Date(sunset.getTime() + 30 * 60000)),
      notes:
        "Evening hatch window. Caddis and spinners common. Big fish feed aggressively.",
    },
  ];

  return {
    date: date.toISOString().slice(0, 10),
    sunrise: formatTime(sunrise),
    sunset: formatTime(sunset),
    dawn: formatTime(dawn),
    dusk: formatTime(dusk),
    goldenHourMorning: {
      start: formatTime(sunrise),
      end: formatTime(goldenHourEnd),
    },
    goldenHourEvening: {
      start: formatTime(goldenHourStart),
      end: formatTime(sunset),
    },
    dayLengthHours,
    primeFishingWindows: windows,
  };
}
