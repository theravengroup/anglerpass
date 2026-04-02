import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  Droplets,
  Sun,
  Wind,
  Snowflake,
  CloudSun,
} from "lucide-react";
import type {
  ForecastDay,
  ForecastHour,
  WeatherCondition,
  FishingCondition,
} from "@/lib/weather/types";

/* ═══════════════════════════════════════════════════════════════════════
   CONDITION → ICON MAPPING
   ═══════════════════════════════════════════════════════════════════════ */

export const CONDITION_ICONS: Record<WeatherCondition, typeof Sun> = {
  clear: Sun,
  "partly-cloudy": CloudSun,
  cloudy: Cloud,
  rain: CloudDrizzle,
  "rain-heavy": CloudRain,
  thunderstorm: CloudLightning,
  snow: CloudSnow,
  sleet: Snowflake,
  fog: CloudFog,
  wind: Wind,
  unknown: Cloud,
};

const FISHING_DOT_COLORS: Record<FishingCondition, string> = {
  excellent: "bg-forest",
  good: "bg-river",
  fair: "bg-bronze",
  challenging: "bg-stone-light",
};

/** Shorten wind strings like "5 to 10 mph" → "5–10" */
export function compactWind(wind: string): string {
  const match = wind.match(/(\d+)\s*(?:to|and)\s*(\d+)/i);
  if (match) return `${match[1]}–${match[2]}`;

  const single = wind.match(/(\d+)/);
  if (single) return `${single[1]} mph`;

  return wind;
}

/* ═══════════════════════════════════════════════════════════════════════
   DAY CARD
   ═══════════════════════════════════════════════════════════════════════ */

export function DayCard({ day }: { day: ForecastDay }) {
  const Icon = CONDITION_ICONS[day.condition] ?? Cloud;
  const isToday = day.label === "Today";

  return (
    <div
      className={`flex min-w-[88px] shrink-0 flex-col items-center gap-1 rounded-lg border px-2.5 py-3 sm:min-w-0 ${
        isToday
          ? "border-forest/20 bg-forest/5"
          : "border-stone-light/15 bg-white"
      }`}
    >
      <span
        className={`text-xs font-medium ${
          isToday ? "text-forest" : "text-text-secondary"
        }`}
      >
        {day.label}
      </span>

      <Icon
        className={`size-5 ${isToday ? "text-forest" : "text-text-light"}`}
      />

      <div className="flex items-baseline gap-1">
        <span className="text-sm font-semibold text-text-primary">
          {day.highF}°
        </span>
        <span className="text-xs text-text-light">{day.lowF}°</span>
      </div>

      {day.precipChance != null && day.precipChance > 0 ? (
        <div className="flex items-center gap-0.5 text-[11px] text-river">
          <Droplets className="size-3" />
          {day.precipChance}%
          {day.precipAmountIn != null && day.precipAmountIn > 0 && (
            <span className="text-text-light">
              {" "}
              {day.precipAmountIn}&Prime;
            </span>
          )}
        </div>
      ) : (
        <div className="h-4" />
      )}

      <div className="flex items-center gap-0.5 text-[10px] text-text-light">
        <Wind className="size-2.5" />
        {compactWind(day.wind)}
        {day.windGustMph != null && day.windGustMph >= 20 && (
          <span className="font-medium text-bronze">
            g{day.windGustMph}
          </span>
        )}
      </div>

      <div
        className={`size-1.5 rounded-full ${FISHING_DOT_COLORS[day.fishingCondition]}`}
        title={`${day.fishingCondition} fishing conditions`}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   HOUR CARD
   ═══════════════════════════════════════════════════════════════════════ */

export function HourCard({ hour }: { hour: ForecastHour }) {
  const Icon = CONDITION_ICONS[hour.condition] ?? Cloud;

  return (
    <div className="flex min-w-[60px] shrink-0 flex-col items-center gap-1 rounded-md border border-stone-light/10 bg-white px-2 py-2">
      <span className="text-[10px] font-medium text-text-secondary">
        {hour.label}
      </span>
      <Icon className="size-3.5 text-text-light" />
      <span className="text-xs font-semibold text-text-primary">
        {hour.tempF}°
      </span>
      {hour.precipChance != null && hour.precipChance > 0 && (
        <span className="text-[9px] text-river">{hour.precipChance}%</span>
      )}
      <span className="text-[9px] text-text-light">
        {compactWind(hour.wind)}
      </span>
    </div>
  );
}
