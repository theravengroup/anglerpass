"use client";

import { useEffect, useState } from "react";
import {
  Droplets,
  Loader2,
  Wind,
  Sunrise,
  Sunset,
  Fish,
  ChevronDown,
} from "lucide-react";
import type {
  PropertyForecast,
  ForecastDay,
  FishingCondition,
} from "@/lib/weather/types";
import { DayCard, HourCard } from "./WeatherDayCard";

interface PropertyWeatherProps {
  propertyId: string;
}

export default function PropertyWeather({ propertyId }: PropertyWeatherProps) {
  const [forecast, setForecast] = useState<PropertyForecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [hourlyOpen, setHourlyOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/properties/${propertyId}/weather`);
        if (res.ok && !cancelled) {
          setForecast(await res.json());
        } else if (!cancelled) {
          setFailed(true);
        }
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-text-light">
        <Loader2 className="size-4 animate-spin" />
        Loading forecast…
      </div>
    );
  }

  if (failed || !forecast?.days.length) {
    return null;
  }

  const updatedLabel = formatUpdatedTime(forecast.updatedAt);
  const todayForecast = forecast.days[0];

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-primary">
          7-Day Forecast
        </h3>
        <span className="text-[11px] text-text-light">
          Updated {updatedLabel}
        </span>
      </div>

      {/* Day cards — horizontal scroll on mobile, grid on desktop */}
      <div className="flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-7 sm:overflow-visible">
        {forecast.days.map((day) => (
          <DayCard key={day.date} day={day} />
        ))}
      </div>

      {/* Today's details row: sunrise/sunset + fishing conditions */}
      {todayForecast && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-stone-light/15 bg-white px-3 py-2.5">
          {/* Fishing conditions badge */}
          <FishingBadge condition={todayForecast.fishingCondition} />

          {/* Sunrise */}
          {todayForecast.sunrise && (
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <Sunrise className="size-3.5 text-bronze" />
              {todayForecast.sunrise}
            </div>
          )}

          {/* Sunset */}
          {todayForecast.sunset && (
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <Sunset className="size-3.5 text-river" />
              {todayForecast.sunset}
            </div>
          )}

          {/* Wind gusts */}
          {todayForecast.windGustMph != null &&
            todayForecast.windGustMph > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                <Wind className="size-3.5 text-text-light" />
                Gusts {todayForecast.windGustMph} mph
              </div>
            )}

          {/* Precip amount */}
          {todayForecast.precipAmountIn != null &&
            todayForecast.precipAmountIn > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                <Droplets className="size-3.5 text-river" />
                {todayForecast.precipAmountIn}&Prime; expected
              </div>
            )}
        </div>
      )}

      {/* Hourly today toggle */}
      {forecast.hourly.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setHourlyOpen((prev) => !prev)}
            className="flex items-center gap-1 text-xs font-medium text-river transition-colors hover:text-river-light"
          >
            Today hour by hour
            <ChevronDown
              className={`size-3.5 transition-transform duration-200 ${
                hourlyOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {hourlyOpen && (
            <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
              {forecast.hourly.map((hour) => (
                <HourCard key={hour.time} hour={hour} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Planning signals */}
      <PlanningSignals days={forecast.days} />

      {/* Disclaimer */}
      <p className="text-[11px] leading-relaxed text-text-light">
        Forecast for the area near this property
        {forecast.locationLabel ? ` (${forecast.locationLabel})` : ""}
        {forecast.elevationFt
          ? ` · ${forecast.elevationFt.toLocaleString()} ft elevation`
          : ""}
        . Conditions on the water may vary.
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   FISHING CONDITIONS BADGE
   ═══════════════════════════════════════════════════════════════════════ */

const FISHING_BADGE_STYLES: Record<FishingCondition, string> = {
  excellent: "bg-forest/10 text-forest border-forest/20",
  good: "bg-river/10 text-river border-river/20",
  fair: "bg-bronze/10 text-bronze border-bronze/20",
  challenging: "bg-stone/10 text-text-secondary border-stone-light/20",
};

function FishingBadge({ condition }: { condition: FishingCondition }) {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${FISHING_BADGE_STYLES[condition]}`}
    >
      <Fish className="size-3.5" />
      <span className="capitalize">{condition}</span>
      <span className="text-[10px] font-normal opacity-70">fishing</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   PLANNING SIGNALS
   ═══════════════════════════════════════════════════════════════════════ */

function PlanningSignals({ days }: { days: ForecastDay[] }) {
  const rainDays: string[] = [];
  const windyDays: string[] = [];
  const gustWarnings: string[] = [];
  let bestDay: string | null = null;
  let bestScore = -Infinity;

  for (const day of days) {
    if ((day.precipChance ?? 0) >= 40) {
      rainDays.push(day.label);
    }

    const maxWind = extractMaxWind(day.wind);
    if (maxWind >= 15) {
      windyDays.push(day.label);
    }

    if (day.windGustMph != null && day.windGustMph >= 25) {
      gustWarnings.push(`${day.label} (${day.windGustMph} mph)`);
    }

    const precipPenalty = ((day.precipChance ?? 0) / 100) * 50;
    const windPenalty = Math.min(maxWind, 30) * 1.5;
    const tempScore = day.highF >= 50 && day.highF <= 85 ? 20 : 0;
    const score = tempScore - precipPenalty - windPenalty;

    if (score > bestScore) {
      bestScore = score;
      bestDay = day.label;
    }
  }

  const hasSignals =
    bestDay ||
    rainDays.length > 0 ||
    windyDays.length > 0 ||
    gustWarnings.length > 0;

  if (!hasSignals) return null;

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 rounded-lg border border-stone-light/15 bg-offwhite/60 px-3 py-2">
      <span className="w-full text-[11px] font-medium uppercase tracking-wider text-text-light">
        Planning signals
      </span>
      {bestDay && (
        <span className="text-xs text-forest">
          <span className="font-medium">Best day:</span> {bestDay}
        </span>
      )}
      {rainDays.length > 0 && (
        <span className="text-xs text-river">
          <span className="font-medium">Rain likely:</span>{" "}
          {rainDays.join(", ")}
        </span>
      )}
      {windyDays.length > 0 && (
        <span className="text-xs text-bronze">
          <span className="font-medium">Windy:</span>{" "}
          {windyDays.join(", ")}
        </span>
      )}
      {gustWarnings.length > 0 && (
        <span className="text-xs text-text-secondary">
          <span className="font-medium">Gusts:</span>{" "}
          {gustWarnings.join(", ")}
        </span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════════ */

function formatUpdatedTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);

  if (mins < 2) return "just now";
  if (mins < 60) return `${mins}m ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;

  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function extractMaxWind(wind: string): number {
  const numbers = wind.match(/\d+/g);
  if (!numbers) return 0;
  return Math.max(...numbers.map(Number));
}
