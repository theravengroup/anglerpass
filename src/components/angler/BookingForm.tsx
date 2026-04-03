"use client";

import { useState, useEffect, useCallback } from "react";
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
  CalendarDays,
  CheckCircle2,
  Send,
} from "lucide-react";
import {
  calculateFeeBreakdown,
  ROD_NOMENCLATURE,
} from "@/lib/constants/fees";
import GuidesSection from "./GuidesSection";
import FeeBreakdown from "./FeeBreakdown";

interface MatchedGuide {
  id: string;
  display_name: string;
  profile_photo_url: string | null;
  techniques: string[];
  rating_avg: number;
  rating_count: number;
  trips_completed: number;
  rate: number | null;
  rate_full_day: number | null;
  rate_half_day: number | null;
}

interface BookingFormProps {
  property: {
    id: string;
    name: string;
    rate_adult_full_day: number | null;
    rate_adult_half_day: number | null;
    half_day_allowed: boolean;
    max_rods: number | null;
    max_guests: number | null;
    is_cross_club?: boolean;
    accessible_through: {
      membership_id: string;
      club_id: string;
      club_name: string;
    }[];
  };
  initialMembership?: string;
}

export default function BookingForm({ property, initialMembership }: BookingFormProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [duration, setDuration] = useState("full_day");
  const [partySize, setPartySize] = useState(1);
  const [nonFishingGuests, setNonFishingGuests] = useState(0);
  const [selectedMembership, setSelectedMembership] = useState(initialMembership ?? "");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Guide add-on state
  const [availableGuides, setAvailableGuides] = useState<MatchedGuide[]>([]);
  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(null);
  const [loadingGuides, setLoadingGuides] = useState(false);

  // Fetch available guides when date/duration/party changes
  const fetchGuides = useCallback(async () => {
    if (!startDate) {
      setAvailableGuides([]);
      return;
    }
    setLoadingGuides(true);
    try {
      const params = new URLSearchParams({
        property_id: property.id,
        date: startDate,
        party_size: String(partySize),
        duration,
      });
      const res = await fetch(`/api/guides/match?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAvailableGuides(data.guides ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoadingGuides(false);
    }
  }, [property.id, startDate, partySize, duration]);

  useEffect(() => {
    fetchGuides();
    setSelectedGuideId(null);
  }, [fetchGuides]);

  const selectedGuide = availableGuides.find((g) => g.id === selectedGuideId);
  const guideRate = selectedGuide ? (selectedGuide.rate ?? 0) : 0;

  // Calculate number of days
  const numberOfDays = startDate && endDate
    ? Math.max(1, Math.round(
        (new Date(endDate + "T00:00:00").getTime() - new Date(startDate + "T00:00:00").getTime())
        / (24 * 60 * 60 * 1000)
      ) + 1)
    : 1;

  const isCrossClub = property.is_cross_club ?? false;
  const ratePerRod =
    duration === "full_day"
      ? (property.rate_adult_full_day ?? 0)
      : (property.rate_adult_half_day ?? 0);
  const perDayGuideRate = guideRate;
  const fees = calculateFeeBreakdown(ratePerRod, partySize, isCrossClub, guideRate, numberOfDays);

  async function handleBooking() {
    if (!selectedMembership || !startDate) return;

    setBookingError(null);
    setSubmitting(true);

    try {
      const effectiveEndDate = endDate || startDate;
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: property.id,
          club_membership_id: selectedMembership,
          booking_date: startDate,
          booking_end_date: effectiveEndDate !== startDate ? effectiveEndDate : undefined,
          duration,
          party_size: partySize,
          non_fishing_guests: nonFishingGuests,
          message: message || undefined,
          guide_id: selectedGuideId || undefined,
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

  // Get tomorrow's date as minimum booking date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  if (bookingSuccess) {
    return (
      <Card className="border-forest/20 bg-forest/5">
        <CardContent className="flex flex-col items-center py-8">
          <CheckCircle2 className="size-10 text-forest" />
          <h3 className="mt-3 text-base font-medium text-text-primary">
            Booking Confirmed!
          </h3>
          <p className="mt-1 text-center text-sm text-text-secondary">
            Your booking is confirmed. Access details are available in your bookings.
            {selectedGuide && (
              <> Your guide {selectedGuide.display_name} will be in touch before your trip.</>
            )}
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
    );
  }

  return (
    <Card className="sticky top-6 border-stone-light/20">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarDays className="size-4 text-bronze" />
          Book This Property
        </CardTitle>
        {property.rate_adult_full_day != null && (
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-semibold text-text-primary">
              ${property.rate_adult_full_day}
            </span>
            <span className="text-sm text-text-light">/ rod / day</span>
          </div>
        )}
        <p className="text-[11px] text-text-light">{ROD_NOMENCLATURE}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date range */}
        <div className="space-y-2">
          <Label>Dates</Label>
          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
              <span className="text-xs text-text-light">Start</span>
              <Input
                id="start_date"
                type="date"
                min={minDate}
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (!endDate || e.target.value > endDate) {
                    setEndDate(e.target.value);
                  }
                }}
                disabled={submitting}
              />
            </div>
            <div className="flex-1 space-y-1">
              <span className="text-xs text-text-light">End</span>
              <Input
                id="end_date"
                type="date"
                min={startDate || minDate}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={submitting || !startDate}
              />
            </div>
          </div>
          {startDate && numberOfDays > 1 && (
            <p className="text-xs font-medium text-bronze">
              {numberOfDays} day{numberOfDays > 1 ? "s" : ""} selected
            </p>
          )}
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
            {property.max_rods && (
              <span className="ml-1 font-normal text-text-light">
                max {property.max_rods}
              </span>
            )}
          </Label>
          <Input
            id="party_size"
            type="number"
            min={1}
            max={property.max_rods ?? 20}
            value={partySize}
            onChange={(e) => setPartySize(parseInt(e.target.value) || 1)}
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
            <span className="ml-1 font-normal text-text-light">(no rod fee)</span>
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
            onChange={(e) => setNonFishingGuests(parseInt(e.target.value) || 0)}
            disabled={submitting}
          />
          <p className="text-xs text-text-light">
            Family or friends who won&apos;t be fishing. No charge, but
            they count toward the property&apos;s total guest limit
            {property.max_guests ? ` of ${property.max_guests}` : ""}.
          </p>
        </div>

        {/* Total people summary */}
        {partySize + nonFishingGuests > 1 && (
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

        {/* Guide add-on */}
        {startDate && (
          <GuidesSection
            loadingGuides={loadingGuides}
            availableGuides={availableGuides}
            selectedGuideId={selectedGuideId}
            onSelectGuide={setSelectedGuideId}
          />
        )}

        {/* Fee breakdown */}
        {startDate && (
          <FeeBreakdown
            ratePerRod={ratePerRod}
            partySize={partySize}
            fees={fees}
            duration={duration}
            nonFishingGuests={nonFishingGuests}
            numberOfDays={numberOfDays}
            perDayGuideRate={perDayGuideRate}
            selectedGuideName={selectedGuide?.display_name}
          />
        )}

        {bookingError && (
          <p className="text-sm text-red-600" role="alert" aria-live="polite">
            {bookingError}
          </p>
        )}

        <Button
          onClick={handleBooking}
          disabled={submitting || !startDate || !selectedMembership}
          className="w-full bg-bronze text-white hover:bg-bronze/90"
        >
          {submitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
          Book Now
        </Button>

        <p className="text-center text-xs text-text-light">
          Instant confirmation — your spot is reserved immediately.
        </p>
      </CardContent>
    </Card>
  );
}
