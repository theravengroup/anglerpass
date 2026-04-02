"use client";

import { useState } from "react";
import { CheckCircle2, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ReviewConfirmationProps {
  reviewId: string;
  windowCloseDate: string;
  extensionRequested: boolean;
}

export default function ReviewConfirmation({
  reviewId,
  windowCloseDate,
  extensionRequested: initialExtension,
}: ReviewConfirmationProps) {
  const [extensionRequested, setExtensionRequested] = useState(initialExtension);
  const [requesting, setRequesting] = useState(false);
  const [extensionError, setExtensionError] = useState<string | null>(null);
  const [newDeadline, setNewDeadline] = useState<string | null>(null);

  const formattedDate = new Date(
    newDeadline ?? windowCloseDate
  ).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  async function handleExtensionRequest() {
    setRequesting(true);
    setExtensionError(null);

    try {
      const res = await fetch(`/api/trip-reviews/${reviewId}/extend`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setExtensionError(data.error ?? "Failed to request extension");
        return;
      }

      setExtensionRequested(true);
      if (data.extension_expires_at) {
        setNewDeadline(data.extension_expires_at);
      }
    } catch {
      setExtensionError("An unexpected error occurred");
    } finally {
      setRequesting(false);
    }
  }

  return (
    <div className="flex flex-col items-center py-8 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-forest/10">
        <CheckCircle2 className="size-8 text-forest" />
      </div>

      <h2 className="mt-5 font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
        Your verified trip review has been submitted.
      </h2>

      <p className="mt-3 max-w-md text-sm text-text-secondary">
        Reviews are published after the review window closes to ensure fairness
        for all parties.
      </p>

      <div className="mt-5 flex items-center gap-2 rounded-lg bg-offwhite px-4 py-2.5">
        <Clock className="size-4 text-text-light" />
        <p className="text-sm text-text-secondary">
          Your window closes on{" "}
          <span className="font-medium text-text-primary">{formattedDate}</span>
        </p>
      </div>

      {/* Extension request */}
      {!extensionRequested && (
        <div className="mt-6 max-w-sm">
          <p className="text-sm text-text-secondary">
            Need more time? You can request a 7-day extension before your
            window closes.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={handleExtensionRequest}
            disabled={requesting}
          >
            {requesting && <Loader2 className="size-3 animate-spin" />}
            Request Extension
          </Button>
          {extensionError && (
            <p
              className="mt-2 text-xs text-red-500"
              role="alert"
              aria-live="polite"
            >
              {extensionError}
            </p>
          )}
        </div>
      )}

      {extensionRequested && (
        <p className="mt-4 text-sm text-forest">
          Extension granted — your new deadline is shown above.
        </p>
      )}

      {/* Navigation */}
      <div className="mt-8 flex gap-3">
        <Link href="/angler">
          <Button variant="outline" size="sm">
            Back to Dashboard
          </Button>
        </Link>
        <Link href="/angler/properties">
          <Button
            size="sm"
            className="bg-bronze text-white hover:bg-bronze/90"
          >
            Browse Properties
          </Button>
        </Link>
      </div>
    </div>
  );
}
