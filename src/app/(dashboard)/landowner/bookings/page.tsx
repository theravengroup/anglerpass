"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  CalendarDays,
  Loader2,
  CheckCircle2,
  MapPin,
} from "lucide-react";
import { BOOKING_STATUS } from "@/lib/constants/status";
import { FetchError } from "@/components/shared/FetchError";

interface LandownerBooking {
  id: string;
  property_id: string;
  booking_date: string;
  duration: string;
  party_size: number;
  non_fishing_guests: number;
  base_rate: number;
  platform_fee: number;
  cross_club_fee: number;
  club_commission: number;
  landowner_payout: number;
  total_amount: number;
  is_cross_club: boolean;
  status: string;
  message: string | null;
  landowner_notes: string | null;
  confirmed_at: string | null;
  created_at: string;
  properties: {
    id: string;
    name: string;
    owner_id: string;
  } | null;
  profiles: {
    display_name: string | null;
  } | null;
}

export default function LandownerBookingsPage() {
  const [bookings, setBookings] = useState<LandownerBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function load() {
    setError(false);
    setLoading(true);
    try {
      const res = await fetch("/api/bookings?role=landowner");
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings ?? []);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const upcoming = bookings.filter(
    (b) =>
      b.status === "confirmed" && new Date(b.booking_date) >= new Date()
  );
  const past = bookings.filter(
    (b) =>
      b.status !== "confirmed" ||
      (b.status === "confirmed" && new Date(b.booking_date) < new Date())
  );

  if (loading) {
    return (
      <div className="mx-auto flex max-w-5xl items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-forest" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl">
        <FetchError message="Failed to load bookings." onRetry={load} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
          Bookings
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          View confirmed bookings for your properties. All bookings are confirmed instantly when anglers book.
        </p>
      </div>

      {bookings.length === 0 && (
        <Card className="border-stone-light/20">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex size-14 items-center justify-center rounded-full bg-forest/10">
              <CalendarDays className="size-6 text-forest" />
            </div>
            <h3 className="mt-4 text-base font-medium text-text-primary">
              No bookings yet
            </h3>
            <p className="mt-1 max-w-sm text-center text-sm text-text-secondary">
              When anglers book your properties, their confirmed bookings will
              appear here.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Upcoming confirmed */}
      {upcoming.length > 0 && (
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-medium text-forest">
            <CheckCircle2 className="size-4" />
            Upcoming ({upcoming.length})
          </h3>
          {upcoming.map((booking) => (
            <BookingRow key={booking.id} booking={booking} />
          ))}
        </div>
      )}

      {/* Past & cancelled */}
      {past.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-text-secondary">
            Past & Cancelled ({past.length})
          </h3>
          {past.map((booking) => (
            <BookingRow key={booking.id} booking={booking} />
          ))}
        </div>
      )}
    </div>
  );
}

function BookingRow({ booking }: { booking: LandownerBooking }) {
  const config = BOOKING_STATUS[booking.status] ?? BOOKING_STATUS.confirmed;
  const Icon = config.icon;

  return (
    <Card className="border-stone-light/20">
      <CardContent className="flex items-center justify-between py-4">
        <div className="flex items-center gap-4">
          <div className="flex size-10 items-center justify-center rounded-full bg-offwhite">
            <MapPin className="size-4 text-text-light" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">
              {booking.profiles?.display_name ?? "Unknown Angler"}
              <span className="ml-1 font-normal text-text-light">
                — {booking.properties?.name}
              </span>
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
              <span>
                {booking.party_size} angler
                {booking.party_size > 1 ? "s" : ""}
              </span>
              {booking.non_fishing_guests > 0 && (
                <span>
                  +{booking.non_fishing_guests} guest
                  {booking.non_fishing_guests > 1 ? "s" : ""}
                </span>
              )}
              <span className="font-medium">
                ${booking.landowner_payout || booking.base_rate} (you receive)
              </span>
            </div>
          </div>
        </div>
        <div
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.bg} ${config.color}`}
        >
          <Icon className="size-3" />
          {config.label}
        </div>
      </CardContent>
    </Card>
  );
}
