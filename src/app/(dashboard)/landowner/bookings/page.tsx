"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  Ban,
  MapPin,
} from "lucide-react";

interface LandownerBooking {
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

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: typeof CheckCircle2; color: string; bg: string }
> = {
  pending: {
    label: "Pending Review",
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

export default function LandownerBookingsPage() {
  const [bookings, setBookings] = useState<LandownerBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notesInput, setNotesInput] = useState<Record<string, string>>({});

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/bookings?role=landowner");
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

  async function handleAction(
    bookingId: string,
    status: "confirmed" | "declined"
  ) {
    setActionLoading(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          landowner_notes: notesInput[bookingId] || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, ...data.booking } : b))
        );
      }
    } catch {
      // Silent fail
    } finally {
      setActionLoading(null);
    }
  }

  const pending = bookings.filter((b) => b.status === "pending");
  const upcoming = bookings.filter(
    (b) =>
      b.status === "confirmed" && new Date(b.booking_date) >= new Date()
  );
  const past = bookings.filter(
    (b) =>
      !["pending", "confirmed"].includes(b.status) ||
      (b.status === "confirmed" && new Date(b.booking_date) < new Date())
  );

  if (loading) {
    return (
      <div className="mx-auto flex max-w-5xl items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-forest" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
          Booking Requests
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Review and manage booking requests for your properties.
        </p>
      </div>

      {bookings.length === 0 && (
        <Card className="border-stone-light/20">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex size-14 items-center justify-center rounded-full bg-forest/10">
              <CalendarDays className="size-6 text-forest" />
            </div>
            <h3 className="mt-4 text-base font-medium text-text-primary">
              No booking requests yet
            </h3>
            <p className="mt-1 max-w-sm text-center text-sm text-text-secondary">
              When anglers request to book your properties, their requests will
              appear here for your review.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pending requests */}
      {pending.length > 0 && (
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-medium text-bronze">
            <Clock className="size-4" />
            Needs Your Review ({pending.length})
          </h3>
          {pending.map((booking) => {
            const isLoading = actionLoading === booking.id;
            return (
              <Card key={booking.id} className="border-bronze/20">
                <CardContent className="space-y-4 py-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {booking.profiles?.display_name ?? "Unknown Angler"}{" "}
                        wants to book{" "}
                        <span className="text-forest">
                          {booking.properties?.name ?? "your property"}
                        </span>
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-text-secondary">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="size-3" />
                          {new Date(booking.booking_date).toLocaleDateString(
                            "en-US",
                            {
                              weekday: "long",
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </span>
                        <span>
                          {booking.duration === "full_day"
                            ? "Full Day"
                            : "Half Day"}
                        </span>
                        <span>
                          {booking.party_size} angler
                          {booking.party_size > 1 ? "s" : ""}
                        </span>
                        <span className="font-medium">
                          ${booking.base_rate} (you receive)
                        </span>
                      </div>
                    </div>
                    <div className="rounded-full bg-bronze/10 px-2.5 py-1 text-xs font-medium text-bronze">
                      <Clock className="mr-1 inline size-3" />
                      Pending
                    </div>
                  </div>

                  {booking.message && (
                    <div className="rounded-lg bg-offwhite/80 px-3 py-2.5 text-sm text-text-secondary">
                      &ldquo;{booking.message}&rdquo;
                    </div>
                  )}

                  <div className="space-y-2">
                    <textarea
                      className="flex min-h-[50px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      placeholder="Add a note for the angler (optional)"
                      value={notesInput[booking.id] ?? ""}
                      onChange={(e) =>
                        setNotesInput((prev) => ({
                          ...prev,
                          [booking.id]: e.target.value,
                        }))
                      }
                      disabled={isLoading}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-forest text-white hover:bg-forest/90"
                        onClick={() => handleAction(booking.id, "confirmed")}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <CheckCircle2 className="size-3.5" />
                        )}
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-200 text-red-500 hover:bg-red-50"
                        onClick={() => handleAction(booking.id, "declined")}
                        disabled={isLoading}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Upcoming confirmed */}
      {upcoming.length > 0 && (
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-medium text-forest">
            <CheckCircle2 className="size-4" />
            Upcoming Confirmed ({upcoming.length})
          </h3>
          {upcoming.map((booking) => (
            <BookingRow key={booking.id} booking={booking} />
          ))}
        </div>
      )}

      {/* Past */}
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
  const config = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending;
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
                {booking.party_size} angler
                {booking.party_size > 1 ? "s" : ""}
              </span>
              <span>${booking.base_rate}</span>
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
