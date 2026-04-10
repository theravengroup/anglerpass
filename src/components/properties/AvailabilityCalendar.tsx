"use client";

import { useEffect, useState } from "react";
import { toDateString } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Lock,
  Wrench,
  CalendarCheck,
  Users,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────

interface AvailabilityEntry {
  id: string;
  date: string;
  status: string;
  reason: string | null;
}

interface BookingEntry {
  id: string;
  booking_date: string;
  party_size: number;
  status: string;
}

type DateStatus = "available" | "blocked" | "maintenance" | "booked" | "pending";

// ─── Constants ──────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  DateStatus,
  { label: string; color: string; bg: string; icon: typeof Lock }
> = {
  available: {
    label: "Available",
    color: "text-forest",
    bg: "bg-forest/10 hover:bg-forest/20",
    icon: CalendarCheck,
  },
  blocked: {
    label: "Blocked",
    color: "text-red-600",
    bg: "bg-red-100",
    icon: Lock,
  },
  maintenance: {
    label: "Maintenance",
    color: "text-bronze",
    bg: "bg-bronze/10",
    icon: Wrench,
  },
  booked: {
    label: "Booked",
    color: "text-river",
    bg: "bg-river/10",
    icon: Users,
  },
  pending: {
    label: "Pending",
    color: "text-stone",
    bg: "bg-stone-light",
    icon: Users,
  },
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ─── Component ──────────────────────────────────────────────────────

export default function AvailabilityCalendar({
  propertyId,
  readOnly = false,
}: {
  propertyId: string;
  readOnly?: boolean;
}) {
  const [availability, setAvailability] = useState<AvailabilityEntry[]>([]);
  const [bookings, setBookings] = useState<BookingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());

  async function fetchData() {
    setLoading(true);
    try {
      const start = new Date(currentMonth);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);

      const params = new URLSearchParams({
        start_date: toDateString(start),
        end_date: toDateString(end),
      });

      const res = await fetch(`/api/properties/${propertyId}/availability?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAvailability(data.availability ?? []);
        setBookings(data.bookings ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    setSelectedDates(new Set());
  }, [currentMonth, propertyId]);

  function getDateStatus(dateStr: string): DateStatus {
    const booking = bookings.find((b) => b.booking_date === dateStr);
    if (booking) {
      return booking.status === "confirmed" ? "booked" : "pending";
    }

    const entry = availability.find((a) => a.date === dateStr);
    if (entry) {
      return entry.status as DateStatus;
    }

    return "available";
  }

  function toggleDate(dateStr: string) {
    if (readOnly) return;

    const status = getDateStatus(dateStr);
    if (status === "booked" || status === "pending") return; // Can't select booked dates

    const next = new Set(selectedDates);
    if (next.has(dateStr)) {
      next.delete(dateStr);
    } else {
      next.add(dateStr);
    }
    setSelectedDates(next);
  }

  async function handleAction(action: "blocked" | "available" | "maintenance") {
    if (selectedDates.size === 0) return;
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/properties/${propertyId}/availability`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dates: [...selectedDates],
          status: action,
          reason:
            action === "maintenance" ? "Scheduled maintenance" : undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessage(data.message);
        setSelectedDates(new Set());
        await fetchData();
      } else {
        const err = await res.json();
        setMessage(err.error ?? "Failed to update");
      }
    } finally {
      setSaving(false);
    }
  }

  // ─── Calendar Grid ────────────────────────────────────────────────

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = toDateString();

  const monthLabel = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const cells: Array<{ dateStr: string; dayNum: number } | null> = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ dateStr, dayNum: d });
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() =>
            setCurrentMonth(new Date(year, month - 1, 1))
          }
          className="rounded-md p-1.5 text-text-secondary hover:bg-parchment"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h3 className="text-lg font-semibold text-text-primary">
          {monthLabel}
        </h3>
        <button
          onClick={() =>
            setCurrentMonth(new Date(year, month + 1, 1))
          }
          className="rounded-md p-1.5 text-text-secondary hover:bg-parchment"
          aria-label="Next month"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1">
        {DAY_LABELS.map((day) => (
          <div
            key={day}
            className="py-1 text-center text-xs font-medium text-text-secondary"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-stone" />
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell, idx) => {
            if (!cell) {
              return <div key={`empty-${idx}`} className="h-12" />;
            }

            const { dateStr, dayNum } = cell;
            const status = getDateStatus(dateStr);
            const config = STATUS_CONFIG[status];
            const isSelected = selectedDates.has(dateStr);
            const isPast = dateStr < today;
            const isBookedOrPending =
              status === "booked" || status === "pending";
            const StatusIcon = config.icon;

            return (
              <button
                key={dateStr}
                onClick={() => toggleDate(dateStr)}
                disabled={readOnly || isPast || isBookedOrPending}
                className={`relative flex h-12 flex-col items-center justify-center rounded-md text-sm transition-all ${
                  isPast
                    ? "cursor-default bg-stone-light/50 text-text-light"
                    : isSelected
                      ? "ring-2 ring-forest ring-offset-1 " + config.bg
                      : config.bg
                } ${
                  !readOnly && !isPast && !isBookedOrPending
                    ? "cursor-pointer"
                    : ""
                } ${isBookedOrPending ? "cursor-default" : ""}`}
                title={`${dateStr}: ${config.label}`}
              >
                <span
                  className={`text-sm font-medium ${isPast ? "text-text-light" : config.color}`}
                >
                  {dayNum}
                </span>
                {status !== "available" && !isPast && (
                  <StatusIcon className={`h-3 w-3 ${config.color}`} />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {(Object.entries(STATUS_CONFIG) as Array<[DateStatus, typeof STATUS_CONFIG.available]>).map(
          ([key, config]) => {
            const Icon = config.icon;
            return (
              <div key={key} className="flex items-center gap-1.5">
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded ${config.bg}`}
                >
                  <Icon className={`h-3 w-3 ${config.color}`} />
                </div>
                <span className="text-text-secondary">{config.label}</span>
              </div>
            );
          }
        )}
      </div>

      {/* Actions */}
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-text-secondary">
            {selectedDates.size > 0
              ? `${selectedDates.size} date${selectedDates.size > 1 ? "s" : ""} selected`
              : "Click dates to select, then choose an action"}
          </span>
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => handleAction("blocked")}
              disabled={saving || selectedDates.size === 0}
              className="inline-flex items-center gap-1.5 rounded-md bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-200 disabled:opacity-50"
            >
              <Lock className="h-3.5 w-3.5" />
              Block
            </button>
            <button
              onClick={() => handleAction("maintenance")}
              disabled={saving || selectedDates.size === 0}
              className="inline-flex items-center gap-1.5 rounded-md bg-bronze/10 px-3 py-1.5 text-sm font-medium text-bronze hover:bg-bronze/20 disabled:opacity-50"
            >
              <Wrench className="h-3.5 w-3.5" />
              Maintenance
            </button>
            <button
              onClick={() => handleAction("available")}
              disabled={saving || selectedDates.size === 0}
              className="inline-flex items-center gap-1.5 rounded-md bg-forest/10 px-3 py-1.5 text-sm font-medium text-forest hover:bg-forest/20 disabled:opacity-50"
            >
              <CalendarCheck className="h-3.5 w-3.5" />
              Open
            </button>
          </div>
        </div>
      )}

      {/* Message */}
      {message && (
        <p
          className="rounded-md bg-parchment p-2 text-center text-sm text-text-primary"
          role="alert"
          aria-live="polite"
        >
          {message}
        </p>
      )}

      {saving && (
        <div className="flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-forest" />
        </div>
      )}
    </div>
  );
}
