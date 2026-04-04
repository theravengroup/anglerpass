"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";

interface AvailabilityEntry {
  id: string;
  date: string;
  status: string;
  booking_id: string | null;
}

export default function GuideAvailabilityPage() {
  const [availability, setAvailability] = useState<AvailabilityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string | null>(null);

  async function fetchAvailability() {
    setLoading(true);
    try {
      const start = new Date(currentMonth);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);

      const params = new URLSearchParams({
        start_date: start.toISOString().split("T")[0],
        end_date: end.toISOString().split("T")[0],
      });

      const res = await fetch(`/api/guides/availability?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAvailability(data.availability ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAvailability();
  }, [currentMonth]);

  const handleSave = async (status: "blocked" | "available") => {
    if (selectedDates.size === 0) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/guides/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dates: Array.from(selectedDates),
          status,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessage(data.message);
        setSelectedDates(new Set());
        await fetchAvailability();
      }
    } catch {
      setMessage("Failed to update availability");
    } finally {
      setSaving(false);
    }
  };

  // Calendar helpers
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const monthName = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const availabilityMap = new Map(
    availability.map((a) => [a.date, a])
  );
  const today = new Date().toISOString().split("T")[0];

  const handleDateClick = (dateStr: string) => {
    const entry = availabilityMap.get(dateStr);
    if (entry?.status === "booked") return; // Can't modify booked dates
    if (dateStr < today) return; // Can't modify past dates

    setSelectedDates((prev) => {
      const next = new Set(prev);
      if (next.has(dateStr)) {
        next.delete(dateStr);
      } else {
        next.add(dateStr);
      }
      return next;
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
          Availability
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Manage your available dates. Click dates to select, then mark them as blocked or available.
        </p>
      </div>

      {message && (
        <div className="rounded-lg border border-forest/20 bg-forest/5 px-4 py-3 text-sm text-forest">
          {message}
        </div>
      )}

      <Card className="border-stone-light/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{monthName}</CardTitle>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() =>
                  setCurrentMonth(new Date(year, month - 1, 1))
                }
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() =>
                  setCurrentMonth(new Date(year, month + 1, 1))
                }
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
          <CardDescription>
            <span className="inline-flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1">
                <span className="size-3 rounded bg-forest/20" /> Available
              </span>
              <span className="flex items-center gap-1">
                <span className="size-3 rounded bg-red-100" /> Blocked
              </span>
              <span className="flex items-center gap-1">
                <span className="size-3 rounded bg-river/20" /> Booked
              </span>
              <span className="flex items-center gap-1">
                <span className="size-3 rounded ring-2 ring-charcoal" /> Selected
              </span>
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-charcoal" />
            </div>
          ) : (
            <>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-text-light">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="mt-1 grid grid-cols-7 gap-1">
                {/* Empty cells for offset */}
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const entry = availabilityMap.get(dateStr);
                  const isBooked = entry?.status === "booked";
                  const isBlocked = entry?.status === "blocked";
                  const isSelected = selectedDates.has(dateStr);
                  const isPast = dateStr < today;

                  let bg = "bg-forest/10 hover:bg-forest/20"; // available
                  if (isBlocked) bg = "bg-red-100 hover:bg-red-200";
                  if (isBooked) bg = "bg-river/20";
                  if (isPast) bg = "bg-offwhite text-text-light";

                  return (
                    <button
                      key={dateStr}
                      onClick={() => handleDateClick(dateStr)}
                      disabled={isBooked || isPast}
                      className={`flex h-10 items-center justify-center rounded text-sm transition-colors ${bg} ${
                        isSelected ? "ring-2 ring-charcoal ring-offset-1" : ""
                      } ${isBooked || isPast ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Actions */}
          {selectedDates.size > 0 && (
            <div className="mt-4 flex items-center gap-3 border-t border-stone-light/15 pt-4">
              <span className="text-sm text-text-secondary">
                {selectedDates.size} date{selectedDates.size > 1 ? "s" : ""} selected
              </span>
              <div className="ml-auto flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-200 text-red-500 hover:bg-red-50"
                  onClick={() => handleSave("blocked")}
                  disabled={saving}
                >
                  {saving && <Loader2 className="mr-1 size-3 animate-spin" />}
                  Block
                </Button>
                <Button
                  size="sm"
                  className="bg-forest text-white hover:bg-forest/90"
                  onClick={() => handleSave("available")}
                  disabled={saving}
                >
                  {saving && <Loader2 className="mr-1 size-3 animate-spin" />}
                  Set Available
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
