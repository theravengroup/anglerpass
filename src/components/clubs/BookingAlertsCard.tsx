"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertTriangle,
  ShieldAlert,
  Ban,
  Loader2,
} from "lucide-react";
import type { BookingStanding } from "@/lib/constants/booking-limits";

interface BookingAlert {
  user_id: string;
  display_name: string;
  standing: BookingStanding;
  concurrent_cap: number;
  cancellation_score: number;
}

const STANDING_CONFIG: Record<
  Exclude<BookingStanding, "good">,
  { label: string; icon: typeof AlertTriangle; color: string; bg: string }
> = {
  warned: {
    label: "Warned",
    icon: AlertTriangle,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  restricted: {
    label: "Restricted",
    icon: ShieldAlert,
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  suspended: {
    label: "Suspended",
    icon: Ban,
    color: "text-red-600",
    bg: "bg-red-50",
  },
};

export default function BookingAlertsCard({ clubId }: { clubId: string }) {
  const [alerts, setAlerts] = useState<BookingAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/clubs/${clubId}/booking-alerts`)
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        setAlerts(data.alerts ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [clubId]);

  // Don't render at all if no alerts
  if (!loading && alerts.length === 0) return null;

  return (
    <Card className="border-amber-200 bg-amber-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="size-4 text-amber-600" />
          Booking Alerts
        </CardTitle>
        <CardDescription>
          Club members with elevated cancellation rates
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="size-5 animate-spin text-amber-600" />
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => {
              const config =
                STANDING_CONFIG[
                  alert.standing as Exclude<BookingStanding, "good">
                ] ?? STANDING_CONFIG.warned;
              const Icon = config.icon;

              return (
                <div
                  key={alert.user_id}
                  className="flex items-center justify-between rounded-lg border border-stone-light/20 bg-white px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex size-8 items-center justify-center rounded-full ${config.bg}`}
                    >
                      <Icon className={`size-4 ${config.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {alert.display_name}
                      </p>
                      <p className="text-xs text-text-light">
                        {(alert.cancellation_score * 100).toFixed(0)}%
                        cancellation rate &middot; Cap: {alert.concurrent_cap}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${config.bg} ${config.color}`}
                  >
                    {config.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
