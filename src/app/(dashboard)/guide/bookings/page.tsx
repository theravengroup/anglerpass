"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CalendarDays, MapPin, Users } from "lucide-react";
import { toDateString } from "@/lib/utils";

interface GuideBooking {
  id: string;
  booking_date: string;
  duration: string;
  party_size: number;
  guide_rate: number;
  status: string;
  properties: { name: string; location_description: string | null } | null;
  profiles: { display_name: string | null } | null;
}

export default function GuideBookingsPage() {
  const [bookings, setBookings] = useState<GuideBooking[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      // Fetch guide profile first
      const profileRes = await fetch("/api/guides/profile");
      if (!profileRes.ok) return;
      const { profile } = await profileRes.json();

      // Fetch bookings with this guide
      const res = await fetch("/api/bookings?role=guide");
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const today = toDateString();
  const upcoming = bookings.filter(
    (b) => b.status === "confirmed" && b.booking_date >= today
  );
  const past = bookings.filter(
    (b) => b.status !== "confirmed" || b.booking_date < today
  );

  if (loading) {
    return (
      <div className="mx-auto flex max-w-5xl items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-charcoal" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
          Independent Guide Bookings
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Trips where you&apos;re the independent guide.
        </p>
      </div>

      {bookings.length === 0 && (
        <Card className="border-stone-light/20">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CalendarDays className="size-8 text-text-light" />
            <h3 className="mt-4 text-base font-medium text-text-primary">
              No bookings yet
            </h3>
            <p className="mt-1 max-w-sm text-center text-sm text-text-secondary">
              When anglers add you to their bookings, they&apos;ll appear here.
            </p>
          </CardContent>
        </Card>
      )}

      {upcoming.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-forest">
            Upcoming ({upcoming.length})
          </h3>
          {upcoming.map((b) => (
            <BookingCard key={b.id} booking={b} />
          ))}
        </div>
      )}

      {past.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-text-secondary">
            Past ({past.length})
          </h3>
          {past.map((b) => (
            <BookingCard key={b.id} booking={b} />
          ))}
        </div>
      )}
    </div>
  );
}

function BookingCard({ booking }: { booking: GuideBooking }) {
  return (
    <Card className="border-stone-light/20">
      <CardContent className="flex items-center justify-between py-4">
        <div className="flex items-center gap-4">
          <div className="flex size-10 items-center justify-center rounded-full bg-charcoal/10">
            <CalendarDays className="size-4 text-charcoal" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">
              {booking.properties?.name ?? "Unknown Property"}
            </p>
            <div className="flex gap-3 text-xs text-text-secondary">
              <span>
                {new Date(booking.booking_date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <span>
                {booking.duration === "full_day" ? "Full Day" : "Half Day"}
              </span>
              <span className="flex items-center gap-1">
                <Users className="size-3" />
                {booking.party_size} angler{booking.party_size > 1 ? "s" : ""}
              </span>
              {booking.profiles?.display_name && (
                <span>with {booking.profiles.display_name}</span>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-forest">
            ${booking.guide_rate}
          </p>
          <p className="text-xs text-text-light">{booking.status}</p>
        </div>
      </CardContent>
    </Card>
  );
}
