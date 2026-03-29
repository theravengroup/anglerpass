"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  Loader2,
  MapPin,
  CheckCircle2,
  Clock,
  XCircle,
  Ban,
  Compass,
  Droplets,
} from "lucide-react";

interface Booking {
  id: string;
  property_id: string;
  booking_date: string;
  duration: string;
  party_size: number;
  base_rate: number;
  platform_fee: number;
  total_amount: number;
  status: string;
  message: string | null;
  landowner_notes: string | null;
  confirmed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  properties: {
    id: string;
    name: string;
    location_description: string | null;
    photos: string[];
    water_type: string | null;
  } | null;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: typeof CheckCircle2; color: string; bg: string }
> = {
  pending: {
    label: "Pending",
    icon: Clock,
    color: "text-bronze",
    bg: "bg-bronze/10",
  },
  confirmed: {
    label: "Confirmed",
    icon: CheckCircle2,
    color: "text-forest",
    bg: "bg-forest/10",
  },
  declined: {
    label: "Declined",
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-50",
  },
  cancelled: {
    label: "Cancelled",
    icon: Ban,
    color: "text-text-light",
    bg: "bg-stone-light/10",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    color: "text-river",
    bg: "bg-river/10",
  },
};

const WATER_TYPE_LABELS: Record<string, string> = {
  river: "River",
  stream: "Stream",
  lake: "Lake",
  pond: "Pond",
  spring_creek: "Spring Creek",
  tailwater: "Tailwater",
  reservoir: "Reservoir",
};

export default function AnglerBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/bookings?role=angler");
        if (res.ok) {
          const data = await res.json();
          setBookings(data.bookings ?? []);
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleCancel(bookingId: string) {
    setCancelling(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });

      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) =>
            b.id === bookingId ? { ...b, status: "cancelled" } : b
          )
        );
      }
    } catch {
      // Silent fail
    } finally {
      setCancelling(null);
    }
  }

  const upcoming = bookings.filter(
    (b) =>
      ["pending", "confirmed"].includes(b.status) &&
      new Date(b.booking_date) >= new Date()
  );
  const past = bookings.filter(
    (b) =>
      !["pending", "confirmed"].includes(b.status) ||
      new Date(b.booking_date) < new Date()
  );

  if (loading) {
    return (
      <div className="mx-auto flex max-w-5xl items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-bronze" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
            My Bookings
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            View and manage your fishing trip bookings.
          </p>
        </div>
        <Link href="/angler/discover">
          <Button className="bg-bronze text-white hover:bg-bronze/90">
            <Compass className="size-4" />
            Book a Trip
          </Button>
        </Link>
      </div>

      {bookings.length === 0 && (
        <Card className="border-stone-light/20">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex size-14 items-center justify-center rounded-full bg-bronze/10">
              <CalendarDays className="size-6 text-bronze" />
            </div>
            <h3 className="mt-4 text-base font-medium text-text-primary">
              No bookings yet
            </h3>
            <p className="mt-1 max-w-sm text-center text-sm text-text-secondary">
              Browse available properties and book your first fishing day
              through AnglerPass.
            </p>
            <Link href="/angler/discover">
              <Button className="mt-6 bg-bronze text-white hover:bg-bronze/90">
                <Compass className="size-4" />
                Discover Properties
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Upcoming bookings */}
      {upcoming.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-text-secondary">
            Upcoming ({upcoming.length})
          </h3>
          {upcoming.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onCancel={() => handleCancel(booking.id)}
              isCancelling={cancelling === booking.id}
            />
          ))}
        </div>
      )}

      {/* Past bookings */}
      {past.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-text-secondary">
            Past & Cancelled ({past.length})
          </h3>
          {past.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      )}
    </div>
  );
}

function BookingCard({
  booking,
  onCancel,
  isCancelling,
}: {
  booking: Booking;
  onCancel?: () => void;
  isCancelling?: boolean;
}) {
  const property = booking.properties;
  const config = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending;
  const Icon = config.icon;
  const canCancel =
    ["pending", "confirmed"].includes(booking.status) &&
    new Date(booking.booking_date) >= new Date();

  return (
    <Card className="border-stone-light/20">
      <CardContent className="flex items-center gap-4 py-4">
        {/* Photo */}
        <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-offwhite">
          {property?.photos?.[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={property.photos[0]}
              alt={property?.name ?? ""}
              className="size-full object-cover"
            />
          ) : (
            <MapPin className="size-5 text-text-light" />
          )}
        </div>

        {/* Details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary">
                {property?.name ?? "Unknown Property"}
              </p>
              {property?.location_description && (
                <p className="text-xs text-text-light">
                  {property.location_description}
                </p>
              )}
            </div>
            <div
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.bg} ${config.color}`}
            >
              <Icon className="size-3" />
              {config.label}
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-4 text-xs text-text-secondary">
            <span className="flex items-center gap-1">
              <CalendarDays className="size-3" />
              {new Date(booking.booking_date).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <span>
              {booking.duration === "full_day" ? "Full Day" : "Half Day"}
            </span>
            <span>{booking.party_size} angler{booking.party_size > 1 ? "s" : ""}</span>
            {property?.water_type && (
              <span className="flex items-center gap-1">
                <Droplets className="size-3" />
                {WATER_TYPE_LABELS[property.water_type] ?? property.water_type}
              </span>
            )}
            <span className="font-medium text-text-primary">
              ${booking.total_amount}
            </span>
          </div>

          {booking.landowner_notes && (
            <p className="mt-1 text-xs italic text-text-light">
              Landowner: &ldquo;{booking.landowner_notes}&rdquo;
            </p>
          )}
        </div>

        {/* Cancel button */}
        {canCancel && onCancel && (
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 border-red-200 text-xs text-red-500 hover:bg-red-50"
            onClick={onCancel}
            disabled={isCancelling}
          >
            {isCancelling ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              "Cancel"
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
