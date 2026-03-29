"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  Loader2,
  MapPin,
  Compass,
  Droplets,
  FileText,
  AlertTriangle,
  X,
} from "lucide-react";
import { BOOKING_STATUS, WATER_TYPE_LABELS } from "@/lib/constants/status";

interface Booking {
  id: string;
  property_id: string;
  booking_date: string;
  duration: string;
  party_size: number;
  non_fishing_guests: number;
  base_rate: number;
  platform_fee: number;
  cross_club_fee: number;
  total_amount: number;
  is_cross_club: boolean;
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

interface RefundPreview {
  percentage: number;
  amount: number;
  label: string;
  hoursUntilBooking: number;
}

export default function AnglerBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  // Cancellation dialog state
  const [cancelDialogBooking, setCancelDialogBooking] = useState<Booking | null>(null);
  const [refundPreview, setRefundPreview] = useState<RefundPreview | null>(null);
  const [refundPolicy, setRefundPolicy] = useState<string[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

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

  // Open cancellation dialog and fetch refund preview
  const openCancelDialog = useCallback(async (booking: Booking) => {
    setCancelDialogBooking(booking);
    setRefundPreview(null);
    setCancelReason("");
    setPreviewLoading(true);

    try {
      const res = await fetch(`/api/bookings/${booking.id}/refund-preview`);
      if (res.ok) {
        const data = await res.json();
        setRefundPreview(data.refund);
        setRefundPolicy(data.policy ?? []);
      }
    } catch {
      // Still show dialog, just without preview
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  const closeCancelDialog = () => {
    setCancelDialogBooking(null);
    setRefundPreview(null);
    setCancelReason("");
  };

  async function confirmCancel() {
    if (!cancelDialogBooking) return;
    const bookingId = cancelDialogBooking.id;

    setCancelling(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "cancelled",
          reason: cancelReason.trim() || undefined,
        }),
      });

      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) =>
            b.id === bookingId ? { ...b, status: "cancelled" } : b
          )
        );
        closeCancelDialog();
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
              onCancel={() => openCancelDialog(booking)}
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

      {/* ── Cancellation Confirmation Dialog ── */}
      {cancelDialogBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-md rounded-xl border border-stone-light/20 bg-white p-6 shadow-xl">
            {/* Close button */}
            <button
              onClick={closeCancelDialog}
              className="absolute right-4 top-4 rounded-full p-1 text-text-light hover:bg-stone-light/10 hover:text-text-primary"
            >
              <X className="size-4" />
            </button>

            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-50">
                <AlertTriangle className="size-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-medium text-text-primary">
                  Cancel Booking
                </h3>
                <p className="mt-0.5 text-sm text-text-secondary">
                  {cancelDialogBooking.properties?.name ?? "This property"} &mdash;{" "}
                  {new Date(cancelDialogBooking.booking_date).toLocaleDateString(
                    "en-US",
                    { weekday: "long", month: "long", day: "numeric", year: "numeric" }
                  )}
                </p>
              </div>
            </div>

            {/* Refund info */}
            <div className="mt-5 rounded-lg border border-stone-light/20 bg-offwhite/50 p-4">
              {previewLoading ? (
                <div className="flex items-center justify-center py-3">
                  <Loader2 className="size-5 animate-spin text-text-light" />
                </div>
              ) : cancelDialogBooking.status === "pending" ? (
                <div>
                  <p className="text-sm font-medium text-forest">
                    No charge — this booking hasn&apos;t been confirmed yet
                  </p>
                  <p className="mt-1 text-xs text-text-secondary">
                    Pending bookings can be cancelled freely since no payment has
                    been processed.
                  </p>
                </div>
              ) : refundPreview ? (
                <div>
                  <div className="flex items-baseline justify-between">
                    <p className="text-sm font-medium text-text-primary">
                      {refundPreview.label}
                    </p>
                    {refundPreview.percentage > 0 && (
                      <p className="text-lg font-semibold text-forest">
                        ${refundPreview.amount.toFixed(2)}
                      </p>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-text-secondary">
                    {refundPreview.percentage === 100
                      ? "You're cancelling more than 48 hours before the reservation."
                      : refundPreview.percentage === 50
                        ? "You're cancelling within 48 hours of the reservation."
                        : "Same-day cancellations are not eligible for a refund."}
                  </p>
                  {refundPreview.percentage < 100 && (
                    <p className="mt-1 text-xs text-text-light">
                      Original total: ${cancelDialogBooking.total_amount}
                    </p>
                  )}
                </div>
              ) : null}
            </div>

            {/* Cancellation policy */}
            {refundPolicy.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium text-text-secondary">
                  Cancellation Policy
                </p>
                <ul className="mt-1.5 space-y-1">
                  {refundPolicy.map((line, i) => (
                    <li key={i} className="text-xs text-text-light">
                      &bull; {line}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Optional reason */}
            <div className="mt-4 space-y-2">
              <label
                htmlFor="cancel_reason"
                className="text-xs font-medium text-text-secondary"
              >
                Reason for cancellation (optional)
              </label>
              <textarea
                id="cancel_reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Let us know why you're cancelling..."
                maxLength={1000}
                rows={2}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            {/* Actions */}
            <div className="mt-5 flex justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={closeCancelDialog}
                disabled={cancelling === cancelDialogBooking.id}
              >
                Keep Booking
              </Button>
              <Button
                size="sm"
                className="bg-red-500 text-white hover:bg-red-600"
                onClick={confirmCancel}
                disabled={cancelling === cancelDialogBooking.id}
              >
                {cancelling === cancelDialogBooking.id ? (
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                ) : null}
                Confirm Cancellation
              </Button>
            </div>
          </div>
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
  const config = BOOKING_STATUS[booking.status] ?? BOOKING_STATUS.pending;
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
            <span>{booking.party_size} rod{booking.party_size > 1 ? "s" : ""}</span>
            {booking.non_fishing_guests > 0 && (
              <span>+{booking.non_fishing_guests} guest{booking.non_fishing_guests > 1 ? "s" : ""}</span>
            )}
            {booking.is_cross_club && (
              <span className="text-bronze">Cross-Club</span>
            )}
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

        {/* Action buttons */}
        <div className="flex shrink-0 flex-col gap-1.5">
          {booking.status === "confirmed" && (
            <Link href={`/angler/sign/${booking.id}`}>
              <Button
                size="sm"
                variant="outline"
                className="w-full border-forest/20 text-xs text-forest hover:bg-forest/5"
              >
                <FileText className="mr-1 size-3" />
                Documents
              </Button>
            </Link>
          )}
          {canCancel && onCancel && (
            <Button
              size="sm"
              variant="outline"
              className="border-red-200 text-xs text-red-500 hover:bg-red-50"
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
        </div>
      </CardContent>
    </Card>
  );
}
