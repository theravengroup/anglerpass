"use client";

import {
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Wind,
  CloudFog,
  CloudDrizzle,
  Thermometer,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface WeatherDay {
  date: string;
  label: string;
  summary: string;
  high: number;
  low: number;
  precip_chance: number | null;
  wind: string;
  wind_direction: string;
  sunrise: string | null;
  sunset: string | null;
  fishing_condition: "excellent" | "good" | "fair" | "challenging";
}

interface WeatherResult {
  property_name: string;
  location: string | null;
  elevation_ft: number | null;
  days: WeatherDay[];
}

interface CompassWeatherCardProps {
  weather: WeatherResult;
}

const CONDITION_ICON: Record<string, typeof Sun> = {
  clear: Sun,
  "partly-cloudy": Cloud,
  cloudy: Cloud,
  rain: CloudRain,
  "rain-heavy": CloudDrizzle,
  thunderstorm: CloudLightning,
  snow: CloudSnow,
  sleet: CloudSnow,
  fog: CloudFog,
  wind: Wind,
};

const FISHING_COLORS: Record<string, string> = {
  excellent: "bg-forest/15 text-forest",
  good: "bg-river/15 text-river",
  fair: "bg-bronze/15 text-bronze",
  challenging: "bg-red-100 text-red-700",
};

export default function CompassWeatherCard({
  weather,
}: CompassWeatherCardProps) {
  return (
    <Card className="border-river/20 bg-river-pale/30 py-3 gap-2">
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h4 className="font-heading text-base font-semibold text-forest-deep">
              Weather Forecast
            </h4>
            <p className="text-xs text-text-secondary truncate">
              {weather.property_name}
              {weather.location ? ` — ${weather.location}` : ""}
              {weather.elevation_ft
                ? ` (${weather.elevation_ft.toLocaleString()} ft)`
                : ""}
            </p>
          </div>
          <Thermometer className="size-5 shrink-0 text-river" />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {weather.days.slice(0, 7).map((day) => {
            const IconComponent =
              CONDITION_ICON[day.summary.toLowerCase()] ?? Cloud;
            const fishingClass =
              FISHING_COLORS[day.fishing_condition] ?? FISHING_COLORS.fair;

            return (
              <div
                key={day.date}
                className="rounded-lg border border-white/60 bg-white/50 p-2 text-center space-y-1"
              >
                <p className="text-xs font-semibold text-text-primary">
                  {day.label}
                </p>
                <IconComponent className="mx-auto size-5 text-river" />
                <p className="text-[10px] text-text-secondary leading-tight">
                  {day.summary}
                </p>
                <p className="text-xs font-mono text-text-primary">
                  {day.high}° / {day.low}°
                </p>
                {day.precip_chance != null && day.precip_chance > 0 && (
                  <p className="text-[10px] text-river">
                    {day.precip_chance}% precip
                  </p>
                )}
                <span
                  className={`inline-block rounded-full px-1.5 py-0.5 text-[9px] font-semibold capitalize ${fishingClass}`}
                >
                  {day.fishing_condition}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
