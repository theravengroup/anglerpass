"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FetchError } from "@/components/shared/FetchError";
import StepIndicator from "@/components/reviews/StepIndicator";
import StepOverallRating from "@/components/reviews/StepOverallRating";
import StepCategoryRatings from "@/components/reviews/StepCategoryRatings";
import StepWrittenReview from "@/components/reviews/StepWrittenReview";
import StepWouldFishAgain from "@/components/reviews/StepWouldFishAgain";
import StepPrivateNotes from "@/components/reviews/StepPrivateNotes";
import ReviewConfirmation from "@/components/reviews/ReviewConfirmation";
import {
  CATEGORY_KEYS,
  INCOMPLETE_TRIP_CATEGORIES,
  LANDOWNER_FAULTS,
} from "@/lib/validations/reviews";

// ─── Types ──────────────────────────────────────────────────────────

interface BookingData {
  id: string;
  property_id: string;
  booking_date: string;
  booking_end_date: string | null;
  status: string;
  cancellation_fault: string | null;
  properties: {
    id: string;
    name: string;
    photos: string[] | null;
    location_description: string | null;
  } | null;
}

interface SubmissionResult {
  reviewId: string;
  windowCloseDate: string;
}

const TOTAL_STEPS = 5;
const MIN_REVIEW_CHARS = 50;

// ─── Page ───────────────────────────────────────────────────────────

export default function ReviewSubmitPage() {
  const params = useParams();
  const bookingId = params.bookingId as string;

  // Data loading
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Step flow
  const [step, setStep] = useState(1);

  // Form state
  const [overallRating, setOverallRating] = useState(0);
  const [categoryRatings, setCategoryRatings] = useState<
    Record<string, number>
  >({});
  const [reviewText, setReviewText] = useState("");
  const [reviewTextError, setReviewTextError] = useState<string | null>(null);
  const [wouldFishAgain, setWouldFishAgain] = useState<boolean | null>(null);
  const [privateNotes, setPrivateNotes] = useState("");

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submissionResult, setSubmissionResult] =
    useState<SubmissionResult | null>(null);

  // Derived: trip_completed = true only for completed bookings,
  // false for landowner-fault cancellations
  const isTripCompleted = booking?.status === "completed";

  const requiredCategories = isTripCompleted
    ? CATEGORY_KEYS
    : INCOMPLETE_TRIP_CATEGORIES;

  const propertyName = booking?.properties?.name ?? "Property";
  const propertyPhoto = booking?.properties?.photos?.[0] ?? null;

  // ─── Load booking data ──────────────────────────────────────────

  const loadBooking = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/bookings/${bookingId}`);

      if (!res.ok) {
        if (res.status === 404) {
          setError("Booking not found.");
          return;
        }
        setError("Failed to load booking details.");
        return;
      }

      const data = await res.json();
      const b = data.booking;

      if (!b) {
        setError("Booking not found.");
        return;
      }

      // Check eligibility: must be completed or landowner-fault cancelled
      const isCompleted = b.status === "completed";
      const isLandownerFault =
        b.status === "cancelled" &&
        b.cancellation_fault &&
        (LANDOWNER_FAULTS as readonly string[]).includes(
          b.cancellation_fault
        );

      if (!isCompleted && !isLandownerFault) {
        setError(
          "This booking is not eligible for review. Only completed trips or trips cancelled due to property access issues can be reviewed."
        );
        return;
      }

      setBooking(b as BookingData);
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  // ─── Validation per step ────────────────────────────────────────

  function canAdvance(): boolean {
    switch (step) {
      case 1:
        return overallRating >= 1 && overallRating <= 5;
      case 2: {
        return requiredCategories.every(
          (key) =>
            categoryRatings[key] !== undefined && categoryRatings[key] >= 1
        );
      }
      case 3:
        return reviewText.length >= MIN_REVIEW_CHARS;
      case 4:
        return wouldFishAgain !== null;
      case 5:
        return true; // Private notes are optional
      default:
        return false;
    }
  }

  function handleNext() {
    // Step 3 specific: show error if text too short
    if (step === 3 && reviewText.length < MIN_REVIEW_CHARS) {
      setReviewTextError(
        `Your review needs at least ${MIN_REVIEW_CHARS} characters. You have ${reviewText.length}.`
      );
      return;
    }
    setReviewTextError(null);

    if (step < TOTAL_STEPS) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleBack() {
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  // ─── Submit ─────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!booking || wouldFishAgain === null) return;

    setSubmitting(true);
    setSubmitError(null);

    const categoryRatingArray = requiredCategories.map((key) => ({
      category_key: key,
      rating_value: categoryRatings[key] ?? 1,
    }));

    try {
      const res = await fetch("/api/trip-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: bookingId,
          overall_rating: overallRating,
          review_text: reviewText,
          would_fish_again: wouldFishAgain,
          private_feedback_text: privateNotes || undefined,
          category_ratings: categoryRatingArray,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error ?? "Failed to submit review");
        return;
      }

      // Calculate window close date (21 days from last fishing day)
      const lastDay = booking.booking_end_date ?? booking.booking_date;
      const windowClose = new Date(lastDay + "T23:59:59Z");
      windowClose.setDate(windowClose.getDate() + 21);

      setSubmissionResult({
        reviewId: data.review.id,
        windowCloseDate: windowClose.toISOString(),
      });
    } catch {
      setSubmitError("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Loading state ──────────────────────────────────────────────

  if (loading) {
    return (
      <div className="mx-auto flex max-w-lg items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-bronze" />
      </div>
    );
  }

  // ─── Error state ────────────────────────────────────────────────

  if (error || !booking) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <FetchError
          message={error ?? "Failed to load booking."}
          onRetry={loadBooking}
        />
        <div className="mt-4 text-center">
          <Link
            href="/angler"
            className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
          >
            <ArrowLeft className="size-3.5" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // ─── Confirmation state ─────────────────────────────────────────

  if (submissionResult) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <Card className="border-stone-light/20">
          <CardContent className="px-5 py-6">
            <ReviewConfirmation
              reviewId={submissionResult.reviewId}
              windowCloseDate={submissionResult.windowCloseDate}
              extensionRequested={false}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Multi-step form ────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* Back to dashboard */}
      <Link
        href="/angler"
        className="mb-4 inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft className="size-3.5" />
        Back to Dashboard
      </Link>

      <Card className="border-stone-light/20">
        <CardContent className="px-5 py-6">
          {/* Step indicator */}
          <StepIndicator currentStep={step} totalSteps={TOTAL_STEPS} />

          {/* Step content */}
          {step === 1 && (
            <StepOverallRating
              value={overallRating}
              onChange={setOverallRating}
              tripCompleted={isTripCompleted}
              propertyName={propertyName}
              propertyPhoto={propertyPhoto}
            />
          )}

          {step === 2 && (
            <StepCategoryRatings
              tripCompleted={isTripCompleted}
              ratings={categoryRatings}
              onChange={(key, value) =>
                setCategoryRatings((prev) => ({ ...prev, [key]: value }))
              }
            />
          )}

          {step === 3 && (
            <StepWrittenReview
              value={reviewText}
              onChange={(val) => {
                setReviewText(val);
                if (reviewTextError && val.length >= MIN_REVIEW_CHARS) {
                  setReviewTextError(null);
                }
              }}
              error={reviewTextError}
            />
          )}

          {step === 4 && (
            <StepWouldFishAgain
              value={wouldFishAgain}
              onChange={setWouldFishAgain}
            />
          )}

          {step === 5 && (
            <StepPrivateNotes value={privateNotes} onChange={setPrivateNotes} />
          )}

          {/* Submit error */}
          {submitError && (
            <div
              className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
              role="alert"
              aria-live="polite"
            >
              {submitError}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="mt-6 flex items-center justify-between">
            {step > 1 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleBack}
              >
                <ArrowLeft className="size-4" />
                Back
              </Button>
            ) : (
              <div />
            )}

            {step < TOTAL_STEPS ? (
              <Button
                type="button"
                size="sm"
                className="bg-forest text-white hover:bg-forest/90"
                onClick={handleNext}
                disabled={!canAdvance()}
              >
                Continue
                <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                className="bg-bronze text-white hover:bg-bronze/90"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                Submit Verified Review
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
