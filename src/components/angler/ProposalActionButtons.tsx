"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

interface ProposalActionButtonsProps {
  proposalId: string;
  onResponded: (response: "accepted" | "declined") => void;
}

export default function ProposalActionButtons({
  proposalId,
  onResponded,
}: ProposalActionButtonsProps) {
  const [submitting, setSubmitting] = useState<"accepted" | "declined" | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  async function handleRespond(response: "accepted" | "declined") {
    setSubmitting(response);
    setError(null);

    try {
      const res = await fetch(`/api/proposals/${proposalId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Something went wrong. Please try again.");
        return;
      }

      onResponded(response);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <Button
          className="flex-1 bg-forest text-white hover:bg-forest/90"
          onClick={() => handleRespond("accepted")}
          disabled={submitting !== null}
        >
          {submitting === "accepted" ? (
            <Loader2 className="mr-1.5 size-4 animate-spin" />
          ) : (
            <CheckCircle2 className="mr-1.5 size-4" />
          )}
          Accept
        </Button>
        <Button
          variant="outline"
          className="flex-1 border-red-200 text-red-500 hover:bg-red-50"
          onClick={() => handleRespond("declined")}
          disabled={submitting !== null}
        >
          {submitting === "declined" ? (
            <Loader2 className="mr-1.5 size-4 animate-spin" />
          ) : (
            <XCircle className="mr-1.5 size-4" />
          )}
          Decline
        </Button>
      </div>

      {error && (
        <p className="text-center text-sm text-red-500" role="alert" aria-live="polite">
          {error}
        </p>
      )}
    </div>
  );
}
