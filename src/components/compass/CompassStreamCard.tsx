"use client";

import { Waves, Thermometer, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface GaugeResult {
  site_id: string;
  site_name: string;
  discharge_cfs: number | null;
  water_temp_f: number | null;
  water_temp_c: number | null;
  last_reading: string | null;
}

interface StreamResult {
  property_name: string;
  gauges: GaugeResult[];
  message?: string;
}

interface CompassStreamCardProps {
  stream: StreamResult;
}

function getTempColor(tempF: number): string {
  if (tempF <= 45) return "text-blue-600";
  if (tempF <= 55) return "text-river";
  if (tempF <= 65) return "text-forest";
  if (tempF <= 70) return "text-bronze";
  return "text-red-600";
}

function getTempLabel(tempF: number): string {
  if (tempF <= 45) return "Cold";
  if (tempF <= 55) return "Cool — Ideal";
  if (tempF <= 65) return "Optimal";
  if (tempF <= 70) return "Warm — Use caution";
  return "Hot — Avoid fishing";
}

export default function CompassStreamCard({
  stream,
}: CompassStreamCardProps) {
  if (!stream.gauges.length) {
    return null;
  }

  return (
    <Card className="border-river/20 bg-river-pale/30 py-3 gap-2">
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h4 className="font-heading text-base font-semibold text-forest-deep">
              Stream Conditions
            </h4>
            <p className="text-xs text-text-secondary truncate">
              {stream.property_name} — USGS gauges nearby
            </p>
          </div>
          <Waves className="size-5 shrink-0 text-river" />
        </div>

        <div className="space-y-2">
          {stream.gauges.map((gauge) => (
            <div
              key={gauge.site_id}
              className="rounded-lg border border-white/60 bg-white/50 p-3 space-y-1.5"
            >
              <div className="flex items-start gap-1.5">
                <MapPin className="mt-0.5 size-3 shrink-0 text-stone" />
                <p className="text-xs font-medium text-text-primary leading-tight">
                  {gauge.site_name}
                </p>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary">
                {gauge.discharge_cfs !== null && (
                  <div className="flex items-center gap-1.5">
                    <Waves className="size-3 text-river" />
                    <span className="font-mono font-semibold text-text-primary">
                      {gauge.discharge_cfs.toLocaleString()} cfs
                    </span>
                  </div>
                )}
                {gauge.water_temp_f !== null && (
                  <div className="flex items-center gap-1.5">
                    <Thermometer
                      className={`size-3 ${getTempColor(gauge.water_temp_f)}`}
                    />
                    <span
                      className={`font-mono font-semibold ${getTempColor(gauge.water_temp_f)}`}
                    >
                      {gauge.water_temp_f}°F
                    </span>
                    <span className="text-[10px] text-text-light">
                      ({getTempLabel(gauge.water_temp_f)})
                    </span>
                  </div>
                )}
              </div>
              {gauge.last_reading && (
                <p className="text-[10px] text-text-light">
                  Last reading:{" "}
                  {new Date(gauge.last_reading).toLocaleString("en-US", {
                    timeZone: "America/Denver",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
