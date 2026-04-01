"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  MapPin,
  Droplets,
  Fish,
  Users,
  DollarSign,
  CalendarDays,
  ArrowLeft,
  CheckCircle2,
  ScrollText,
  Send,
} from "lucide-react";
import {
  calculateFeeBreakdown,
  ROD_NOMENCLATURE,
} from "@/lib/constants/fees";

interface PropertyDetail {
  id: string;
  name: string;
  description: string | null;
  location_description: string | null;
  water_type: string | null;
  species: string[];
  photos: string[];
  capacity: number | null;
  max_rods: number | null;
  max_guests: number | null;
  rate_adult_full_day: number | null;
  rate_adult_half_day: number | null;
  half_day_allowed: boolean;
  water_miles: number | null;
  regulations: string | null;
  accessible_through: {
    membership_id: string;
    club_id: string;
    club_name: string;
  }[];
}

const WATER_TYPE_LABELS: Record<string, string> = {
  river: "River",
  stream: "Stream",
  lake: "Lake",
  pond: "Pond",
  spring_creek: "Spring Creek",
  tailwater: "Tailwater",
  reservoir: "Reservoir",
};

export default function PropertyDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(0);

  // Booking form state
  const [bookingDate, setBookingDate] = useState("");
  const [duration, setDuration] = useState("full_day");
  const [partySize, setPartySize] = useState(1);
  const [nonFishingGuests, setNonFishingGuests] = useState(0);
  const [selectedMembership, setSelectedMembership] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        // Fetch through discover API to get club access info
        const res = await fetch("/api/properties/discover");
        if (res.ok) {
          const data = await res.json();
          const found = (data.properties ?? []).find(
            (p: PropertyDetail) => p.id === id
          );
          if (found) {
            setProperty(found);
            if (found.accessible_through?.length === 1) {
              setSelectedMembership(
                found.accessible_through[0].membership_id
              );
            }
          }
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // TODO: detect cross-club when Cross-Club Network routing is complete
  const isCrossClub = false;
  const ratePerRod =
    duration === "full_day"
      ? (property?.rate_adult_full_day ?? 0)
      : (property?.rate_adult_half_day ?? 0);
  const fees = calculateFeeBreakdown(ratePerRod, partySize, isCrossClub);

  async function handleBooking() {
    if (!property || !selectedMembership || !bookingDate) return;

    setBookingError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: property.id,
          club_membership_id: selectedMembership,
          booking_date: bookingDate,
          duration,
          party_size: partySize,
          non_fishing_guests: nonFishingGuests,
          message: message || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setBookingError(data.error ?? "Failed to submit booking");
        return;
      }

      setBookingSuccess(true);
    } catch {
      setBookingError("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-4xl items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-bronze" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="mx-auto max-w-4xl py-12 text-center">
        <p className="text-text-secondary">Property not found or not accessible.</p>
        <Link href="/angler/discover">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="size-4" />
            Back to Discover
          </Button>
        </Link>
      </div>
    );
  }

  // Get tomorrow's date as minimum booking date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Back link */}
      <Link
        href="/angler/discover"
        className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft className="size-3.5" />
        Back to Discover
      </Link>

      {/* Photo gallery */}
      {property.photos?.length > 0 && (
        <div className="space-y-2">
          <div className="aspect-[16/9] overflow-hidden rounded-xl bg-offwhite">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={property.photos[selectedPhoto] ?? property.photos[0]}
              alt={property.name}
              className="size-full object-cover"
            />
          </div>
          {property.photos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {property.photos.map((photo, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedPhoto(i)}
                  className={`size-16 shrink-0 overflow-hidden rounded-lg border-2 ${
                    i === selectedPhoto
                      ? "border-bronze"
                      : "border-transparent"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo}
                    alt=""
                    className="size-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Property details */}
        <div className="space-y-6 lg:col-span-2">
          <div>
            <h1 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
              {property.name}
            </h1>
            {property.location_description && (
              <p className="mt-1 flex items-center gap-1 text-sm text-text-secondary">
                <MapPin className="size-4" />
                {property.location_description}
              </p>
            )}
            <div className="mt-2 flex items-center gap-1 text-xs text-river">
              <Users className="size-3.5" />
              Available through{" "}
              {property.accessible_through
                .map((a) => a.club_name)
                .join(", ")}
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex flex-wrap gap-4">
            {property.water_type && (
              <div className="flex items-center gap-1.5 rounded-full bg-river/10 px-3 py-1.5 text-xs font-medium text-river">
                <Droplets className="size-3.5" />
                {WATER_TYPE_LABELS[property.water_type] ?? property.water_type}
              </div>
            )}
            {property.water_miles && (
              <div className="flex items-center gap-1.5 rounded-full bg-forest/10 px-3 py-1.5 text-xs font-medium text-forest">
                {property.water_miles} miles of water
              </div>
            )}
            {(property.max_rods ?? property.capacity) && (
              <div className="flex items-center gap-1.5 rounded-full bg-bronze/10 px-3 py-1.5 text-xs font-medium text-bronze">
                <Users className="size-3.5" />
                Max {property.max_rods ?? property.capacity} rods/day
              </div>
            )}
            {property.max_guests && (
              <div className="flex items-center gap-1.5 rounded-full bg-stone/10 px-3 py-1.5 text-xs font-medium text-text-secondary">
                Max {property.max_guests} people/day
              </div>
            )}
          </div>

          {/* Description */}
          {property.description && (
            <div>
              <h3 className="text-sm font-medium text-text-primary">
                About This Property
              </h3>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-text-secondary">
                {property.description}
              </p>
            </div>
          )}

          {/* Species */}
          {property.species?.length > 0 && (
            <div>
              <h3 className="flex items-center gap-1.5 text-sm font-medium text-text-primary">
                <Fish className="size-4" />
                Species
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {property.species.map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-offwhite px-3 py-1 text-xs text-text-secondary"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Regulations */}
          {property.regulations && (
            <div>
              <h3 className="flex items-center gap-1.5 text-sm font-medium text-text-primary">
                <ScrollText className="size-4" />
                Regulations
              </h3>
              <p className="mt-2 whitespace-pre-line text-sm text-text-secondary">
                {property.regulations}
              </p>
            </div>
          )}
        </div>

        {/* Booking sidebar */}
        <div className="lg:col-span-1">
          {bookingSuccess ? (
            <Card className="border-forest/20 bg-forest/5">
              <CardContent className="flex flex-col items-center py-8">
                <CheckCircle2 className="size-10 text-forest" />
                <h3 className="mt-3 text-base font-medium text-text-primary">
                  Booking Requested
                </h3>
                <p className="mt-1 text-center text-sm text-text-secondary">
                  Your booking request has been sent to the landowner.
                  You&apos;ll be notified when they respond.
                </p>
                <div className="mt-4 flex gap-2">
                  <Link href="/angler/bookings">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-forest text-forest"
                    >
                      View My Bookings
                    </Button>
                  </Link>
                  <Link href="/angler/discover">
                    <Button variant="outline" size="sm">
                      Keep Browsing
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="sticky top-6 border-stone-light/20">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarDays className="size-4 text-bronze" />
                  Book This Property
                </CardTitle>
                {/* Price display */}
                {property.rate_adult_full_day != null && (
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-semibold text-text-primary">
                      ${property.rate_adult_full_day}
                    </span>
                    <span className="text-sm text-text-light">
                      / rod / day
                    </span>
                  </div>
                )}
                <p className="text-[11px] text-text-light">
                  {ROD_NOMENCLATURE}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Date */}
                <div className="space-y-2">
                  <Label htmlFor="booking_date">Date</Label>
                  <Input
                    id="booking_date"
                    type="date"
                    min={minDate}
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    disabled={submitting}
                  />
                </div>

                {/* Duration */}
                {property.half_day_allowed && (
                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <Select
                      value={duration}
                      onValueChange={setDuration}
                      disabled={submitting}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full_day">Full Day</SelectItem>
                        <SelectItem value="half_day">Half Day</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Anglers (rods) */}
                <div className="space-y-2">
                  <Label htmlFor="party_size">
                    Anglers (Rods)
                    {(property.max_rods ?? property.capacity) && (
                      <span className="ml-1 font-normal text-text-light">
                        max {property.max_rods ?? property.capacity}
                      </span>
                    )}
                  </Label>
                  <Input
                    id="party_size"
                    type="number"
                    min={1}
                    max={property.max_rods ?? property.capacity ?? 20}
                    value={partySize}
                    onChange={(e) =>
                      setPartySize(parseInt(e.target.value) || 1)
                    }
                    disabled={submitting}
                  />
                  <p className="text-xs text-text-light">
                    Only you (the booking member) need to be a club member.
                    Your fishing companions do not need memberships.
                  </p>
                </div>

                {/* Non-fishing guests */}
                <div className="space-y-2">
                  <Label htmlFor="non_fishing_guests">
                    Non-Fishing Guests
                    <span className="ml-1 font-normal text-text-light">
                      (no rod fee)
                    </span>
                  </Label>
                  <Input
                    id="non_fishing_guests"
                    type="number"
                    min={0}
                    max={
                      property.max_guests
                        ? Math.max(0, property.max_guests - partySize)
                        : 50
                    }
                    value={nonFishingGuests}
                    onChange={(e) =>
                      setNonFishingGuests(parseInt(e.target.value) || 0)
                    }
                    disabled={submitting}
                  />
                  <p className="text-xs text-text-light">
                    Family or friends who won&apos;t be fishing. No charge, but
                    they count toward the property&apos;s total guest limit
                    {property.max_guests
                      ? ` of ${property.max_guests}`
                      : ""}
                    .
                  </p>
                </div>

                {/* Total people summary */}
                {(partySize + nonFishingGuests > 1) && (
                  <div className="rounded-md bg-offwhite/80 px-3 py-2 text-xs text-text-secondary">
                    <span className="font-medium text-text-primary">
                      Total party: {partySize + nonFishingGuests} people
                    </span>
                    {" — "}
                    {partySize} angler{partySize > 1 ? "s" : ""} +{" "}
                    {nonFishingGuests} non-fishing guest
                    {nonFishingGuests !== 1 ? "s" : ""}
                  </div>
                )}

                {/* Club membership (if multiple) */}
                {property.accessible_through.length > 1 && (
                  <div className="space-y-2">
                    <Label>Book Through</Label>
                    <Select
                      value={selectedMembership}
                      onValueChange={setSelectedMembership}
                      disabled={submitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select club" />
                      </SelectTrigger>
                      <SelectContent>
                        {property.accessible_through.map((club) => (
                          <SelectItem
                            key={club.membership_id}
                            value={club.membership_id}
                          >
                            {club.club_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Message */}
                <div className="space-y-2">
                  <Label htmlFor="message">
                    Message to Landowner{" "}
                    <span className="text-text-light">(optional)</span>
                  </Label>
                  <textarea
                    id="message"
                    className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Introduce yourself, mention your experience..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={submitting}
                  />
                </div>

                {/* Fee breakdown */}
                {bookingDate && (
                  <div className="space-y-1.5 rounded-lg bg-offwhite/80 p-3 text-sm">
                    <div className="flex justify-between text-text-secondary">
                      <span>
                        ${ratePerRod} x {partySize} rod
                        {partySize > 1 ? "s" : ""}
                      </span>
                      <span>${fees.baseRate.toFixed(2)}</span>
                    </div>
                    {fees.crossClubFee > 0 && (
                      <div className="flex justify-between text-text-secondary">
                        <span>
                          Cross-club fee ($10 x {partySize} rod
                          {partySize > 1 ? "s" : ""})
                        </span>
                        <span>${fees.crossClubFee.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-text-light">
                      <span>Platform fee (15%)</span>
                      <span>${fees.platformFee.toFixed(2)}</span>
                    </div>
                    {nonFishingGuests > 0 && (
                      <div className="flex justify-between text-text-light">
                        <span>
                          Non-fishing guests ({nonFishingGuests})
                        </span>
                        <span className="text-forest">No charge</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-stone-light/20 pt-1.5 font-medium text-text-primary">
                      <span>Total</span>
                      <span>${fees.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {bookingError && (
                  <p className="text-sm text-red-600">{bookingError}</p>
                )}

                <Button
                  onClick={handleBooking}
                  disabled={
                    submitting ||
                    !bookingDate ||
                    !selectedMembership
                  }
                  className="w-full bg-bronze text-white hover:bg-bronze/90"
                >
                  {submitting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                  Request Booking
                </Button>

                <p className="text-center text-xs text-text-light">
                  The landowner will review and confirm your request.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
