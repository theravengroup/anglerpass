"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  Loader2,
  CheckCircle2,
  MapPin,
  DollarSign,
  AlertCircle,
  ArrowRight,
  CreditCard,
  Banknote,
  Clock,
  Users,
} from "lucide-react";
import { BOOKING_STATUS } from "@/lib/constants/status";
import { FetchError } from "@/components/shared/FetchError";

interface LandownerBooking {
  id: string;
  property_id: string;
  booking_date: string;
  booking_start_date: string | null;
  booking_end_date: string | null;
  booking_days: number;
  duration: string;
  party_size: number;
  non_fishing_guests: number;
  base_rate: number;
  platform_fee: number;
  cross_club_fee: number;
  club_commission: number;
  landowner_payout: number;
  total_amount: number;
  amount_cents: number | null;
  is_cross_club: boolean;
  guide_id: string | null;
  guide_rate: number | null;
  status: string;
  payment_status: string;
  message: string | null;
  landowner_notes: string | null;
  confirmed_at: string | null;
  stripe_payment_intent_id: string | null;
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

type FilterTab = "needs_action" | "upcoming" | "past" | "all";

const PAYMENT_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  unpaid: { label: "Unpaid", color: "text-text-light", bg: "bg-stone-light/10" },
  hold: { label: "Payment Held", color: "text-bronze", bg: "bg-bronze/10" },
  succeeded: { label: "Captured", color: "text-forest", bg: "bg-forest/10" },
  refunded: { label: "Refunded", color: "text-red-500", bg: "bg-red-50" },
};

export default function LandownerBookingsPage() {
  const [bookings, setBookings] = useState<LandownerBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<FilterTab>("needs_action");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

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

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Bookings needing action: past trip date with payment held (ready to capture)
  // or captured payment ready to payout
  const needsAction = bookings.filter((b) => {
    const tripDate = new Date(b.booking_end_date ?? b.booking_date);
    const isPast = tripDate < today;
    if (b.status === "cancelled") return false;
    // Ready to capture: trip completed, payment held
    if (isPast && b.payment_status === "hold") return true;
    // Ready for payout: payment captured
    if (b.payment_status === "succeeded") return true;
    return false;
  });

  const upcoming = bookings.filter((b) => {
    const tripDate = new Date(b.booking_date);
    return b.status === "confirmed" && tripDate >= today;
  });

  const past = bookings.filter((b) => {
    const tripDate = new Date(b.booking_end_date ?? b.booking_date);
    return tripDate < today || b.status === "cancelled";
  });

  const filtered =
    filter === "needs_action"
      ? needsAction
      : filter === "upcoming"
        ? upcoming
        : filter === "past"
          ? past
          : bookings;

  // Stats
  const totalEarnings = bookings
    .filter((b) => b.payment_status === "succeeded")
    .reduce((sum, b) => sum + (b.landowner_payout || 0), 0);
  const pendingCapture = bookings.filter(
    (b) => b.payment_status === "hold" && new Date(b.booking_end_date ?? b.booking_date) < today
  ).length;

  async function handleCapture(bookingId: string) {
    setActionLoading(bookingId);
    setActionError(null);
    try {
      const res = await fetch("/api/stripe/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setActionError(data.error ?? "Failed to capture payment");
        return;
      }
      await load();
    } catch {
      setActionError("Failed to capture payment");
    } finally {
      setActionLoading(null);
    }
  }

  async function handlePayout(bookingId: string) {
    setActionLoading(bookingId);
    setActionError(null);
    try {
      const res = await fetch("/api/stripe/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setActionError(data.error ?? "Failed to initiate payout");
        return;
      }
      await load();
    } catch {
      setActionError("Failed to initiate payout");
    } finally {
      setActionLoading(null);
    }
  }

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
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
          Bookings
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Manage bookings, capture payments after trips, and initiate payouts.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-stone-light/20">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-forest/10">
                <CalendarDays className="size-5 text-forest" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-text-primary">
                  {upcoming.length}
                </p>
                <p className="text-xs text-text-light">Upcoming bookings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-stone-light/20">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-bronze/10">
                <AlertCircle className="size-5 text-bronze" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-text-primary">
                  {needsAction.length}
                </p>
                <p className="text-xs text-text-light">Need action</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-stone-light/20">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-forest/10">
                <DollarSign className="size-5 text-forest" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-text-primary">
                  ${totalEarnings.toLocaleString()}
                </p>
                <p className="text-xs text-text-light">Total captured</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending capture alert */}
      {pendingCapture > 0 && (
        <Card className="border-bronze/30 bg-bronze/5">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="size-5 shrink-0 text-bronze" />
            <p className="text-sm text-text-primary">
              <strong>{pendingCapture}</strong> completed trip
              {pendingCapture > 1 ? "s" : ""} with held payments ready to
              capture.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="ml-auto shrink-0 border-bronze/30 text-bronze hover:bg-bronze/5"
              onClick={() => setFilter("needs_action")}
            >
              View
              <ArrowRight className="size-3.5" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {actionError && (
        <p className="text-sm text-destructive" role="alert" aria-live="polite">
          {actionError}
        </p>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 rounded-lg border border-stone-light/20 bg-offwhite/50 p-1">
        {(
          [
            { key: "needs_action" as FilterTab, label: "Needs Action", count: needsAction.length },
            { key: "upcoming" as FilterTab, label: "Upcoming", count: upcoming.length },
            { key: "past" as FilterTab, label: "Past", count: past.length },
            { key: "all" as FilterTab, label: "All", count: bookings.length },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === tab.key
                ? "bg-white text-text-primary shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span
                className={`ml-1.5 inline-flex size-5 items-center justify-center rounded-full text-xs ${
                  tab.key === "needs_action" && tab.count > 0
                    ? "bg-bronze/20 text-bronze"
                    : "bg-stone-light/20 text-text-light"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Booking list */}
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

      {bookings.length > 0 && filtered.length === 0 && (
        <Card className="border-stone-light/20">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="size-8 text-forest/40" />
            <p className="mt-3 text-sm text-text-secondary">
              {filter === "needs_action"
                ? "All caught up! No bookings need action."
                : `No ${filter === "upcoming" ? "upcoming" : "past"} bookings.`}
            </p>
          </CardContent>
        </Card>
      )}

      {filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              isLoading={actionLoading === booking.id}
              onCapture={handleCapture}
              onPayout={handlePayout}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BookingCard({
  booking,
  isLoading,
  onCapture,
  onPayout,
}: {
  booking: LandownerBooking;
  isLoading: boolean;
  onCapture: (id: string) => void;
  onPayout: (id: string) => void;
}) {
  const statusConfig =
    BOOKING_STATUS[booking.status] ?? BOOKING_STATUS.confirmed;
  const StatusIcon = statusConfig.icon;
  const paymentConfig =
    PAYMENT_STATUS_CONFIG[booking.payment_status] ??
    PAYMENT_STATUS_CONFIG.unpaid;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tripEndDate = new Date(booking.booking_end_date ?? booking.booking_date);
  const tripComplete = tripEndDate < today;
  const canCapture =
    tripComplete &&
    booking.payment_status === "hold" &&
    booking.status !== "cancelled";
  const canPayout =
    booking.payment_status === "succeeded" &&
    booking.status !== "cancelled";

  const days = booking.booking_days || 1;
  const dateStr =
    days > 1
      ? `${formatDate(booking.booking_date)} – ${formatDate(
          booking.booking_end_date ?? booking.booking_date
        )}`
      : formatDate(booking.booking_date);

  return (
    <Card className="border-stone-light/20">
      <CardContent className="py-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left: booking info */}
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-offwhite">
              <MapPin className="size-4 text-text-light" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary">
                {booking.profiles?.display_name ?? "Unknown Angler"}
                <span className="ml-1 font-normal text-text-light">
                  — {booking.properties?.name}
                </span>
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
                <span className="flex items-center gap-1">
                  <CalendarDays className="size-3" />
                  {dateStr}
                </span>
                <span>
                  {booking.duration === "full_day" ? "Full Day" : "Half Day"}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="size-3" />
                  {booking.party_size} rod{booking.party_size > 1 ? "s" : ""}
                  {booking.non_fishing_guests > 0 &&
                    ` + ${booking.non_fishing_guests} guest${
                      booking.non_fishing_guests > 1 ? "s" : ""
                    }`}
                </span>
                {booking.is_cross_club && (
                  <span className="rounded-full bg-river/10 px-1.5 py-0.5 text-[10px] font-medium text-river">
                    Cross-Club
                  </span>
                )}
              </div>

              {/* Financial summary */}
              <div className="mt-2 flex items-center gap-3 text-xs">
                <span className="font-medium text-forest">
                  ${booking.landowner_payout?.toFixed(2)} payout
                </span>
                <span className="text-text-light">
                  (${booking.total_amount?.toFixed(2)} total)
                </span>
              </div>
            </div>
          </div>

          {/* Right: status + actions */}
          <div className="flex shrink-0 flex-col items-end gap-2">
            {/* Status badges */}
            <div className="flex items-center gap-2">
              <span
                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${paymentConfig.bg} ${paymentConfig.color}`}
              >
                <CreditCard className="size-3" />
                {paymentConfig.label}
              </span>
              <span
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}
              >
                <StatusIcon className="size-3" />
                {statusConfig.label}
              </span>
            </div>

            {/* Actions */}
            {!isLoading && canCapture && (
              <Button
                size="sm"
                className="h-8 bg-forest text-white hover:bg-forest/90"
                onClick={() => onCapture(booking.id)}
              >
                <Banknote className="size-3.5" />
                Capture Payment
              </Button>
            )}
            {!isLoading && canPayout && (
              <Button
                size="sm"
                className="h-8 bg-forest text-white hover:bg-forest/90"
                onClick={() => onPayout(booking.id)}
              >
                <DollarSign className="size-3.5" />
                Initiate Payout
              </Button>
            )}
            {isLoading && (
              <Loader2 className="size-4 animate-spin text-text-light" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
