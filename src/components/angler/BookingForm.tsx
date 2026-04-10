"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CalendarDays, Send } from "lucide-react";
import {
  calculateFeeBreakdown,
  ROD_NOMENCLATURE,
} from "@/lib/constants/fees";
import { toDateString } from "@/lib/utils";
import GuidesSection from "./GuidesSection";
import FeeBreakdown from "./FeeBreakdown";
import BookingPaymentForm from "./BookingPaymentForm";
import BookingSuccessCard from "./BookingSuccessCard";
import BookingFormFields from "./BookingFormFields";

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
  const [showPayment, setShowPayment] = useState(false);
  const [pendingBookingId, setPendingBookingId] = useState<string | null>(null);

  // Guide add-on state
  const [availableGuides, setAvailableGuides] = useState<MatchedGuide[]>([]);
  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(null);
  const [loadingGuides, setLoadingGuides] = useState(false);

  // Fetch available guides when date/duration/party changes
  async function fetchGuides() {
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
  }

  useEffect(() => {
    fetchGuides();
    setSelectedGuideId(null);
  }, [property.id, startDate, partySize, duration]);

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

      // Booking created — now show payment form
      setPendingBookingId(data.booking?.id ?? data.id);
      setShowPayment(true);
    } catch {
      setBookingError("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  // Get tomorrow's date as minimum booking date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = toDateString(tomorrow);

  // Payment step — shown after booking is created
  if (showPayment && pendingBookingId) {
    return (
      <Card className="sticky top-6 border-bronze/20">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="size-4 text-bronze" />
            Complete Payment
          </CardTitle>
          <p className="text-sm text-text-secondary">
            Authorize payment to confirm your booking. Your card will not be
            charged until after your trip.
          </p>
        </CardHeader>
        <CardContent>
          <BookingPaymentForm
            bookingId={pendingBookingId}
            fees={fees}
            onSuccess={() => {
              setShowPayment(false);
              setBookingSuccess(true);
            }}
            onBack={() => {
              setShowPayment(false);
              setPendingBookingId(null);
            }}
          />
        </CardContent>
      </Card>
    );
  }

  if (bookingSuccess) {
    return <BookingSuccessCard guideName={selectedGuide?.display_name} />;
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
        <BookingFormFields
          startDate={startDate}
          endDate={endDate}
          duration={duration}
          partySize={partySize}
          nonFishingGuests={nonFishingGuests}
          selectedMembership={selectedMembership}
          message={message}
          submitting={submitting}
          minDate={minDate}
          numberOfDays={numberOfDays}
          property={property}
          onStartDateChange={(val) => {
            setStartDate(val);
            if (!endDate || val > endDate) setEndDate(val);
          }}
          onEndDateChange={setEndDate}
          onDurationChange={setDuration}
          onPartySizeChange={setPartySize}
          onNonFishingGuestsChange={setNonFishingGuests}
          onMembershipChange={setSelectedMembership}
          onMessageChange={setMessage}
        />

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
