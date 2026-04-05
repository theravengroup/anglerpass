"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, ArrowRight, Save, Send } from "lucide-react";
import { ProposalStepIndicator } from "@/components/guide/ProposalStepIndicator";
import {
  ProposalStepProperty,
} from "@/components/guide/ProposalStepProperty";
import {
  ProposalStepDetails,
  type TripDetails,
} from "@/components/guide/ProposalStepDetails";
import { ProposalStepFee } from "@/components/guide/ProposalStepFee";
import {
  ProposalStepInvite,
  type InvitedAngler,
} from "@/components/guide/ProposalStepInvite";
import { ProposalStepReview } from "@/components/guide/ProposalStepReview";

const TOTAL_STEPS = 5;

export default function NewProposalPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 — Property
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [propertyName, setPropertyName] = useState("");

  // Step 2 — Trip Details
  const [details, setDetails] = useState<TripDetails>({
    proposedDate: "",
    startTime: "",
    durationHours: 0,
    maxAnglers: 0,
    notes: "",
  });

  // Step 3 — Fee
  const [feePerAngler, setFeePerAngler] = useState(0);

  // Step 4 — Invitees
  const [invitees, setInvitees] = useState<InvitedAngler[]>([]);

  function canProceed(): boolean {
    switch (step) {
      case 1:
        return propertyId !== null;
      case 2:
        return (
          details.proposedDate !== "" &&
          details.startTime !== "" &&
          details.durationHours > 0 &&
          details.maxAnglers > 0
        );
      case 3:
        return feePerAngler > 0;
      case 4:
        return invitees.length > 0;
      default:
        return true;
    }
  }

  function handleNext() {
    if (step < TOTAL_STEPS && canProceed()) setStep(step + 1);
  }

  function handleBack() {
    if (step > 1) setStep(step - 1);
  }

  function handleAddInvitee(angler: InvitedAngler) {
    if (!invitees.some((a) => a.id === angler.id)) {
      setInvitees([...invitees, angler]);
    }
  }

  function handleRemoveInvitee(id: string) {
    setInvitees(invitees.filter((a) => a.id !== id));
  }

  async function handleSubmit(action: "draft" | "send") {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          property_id: propertyId,
          proposed_date: details.proposedDate,
          start_time: details.startTime,
          duration_hours: details.durationHours,
          max_anglers: details.maxAnglers,
          guide_fee_per_angler: feePerAngler,
          notes: details.notes || null,
          invitee_ids: invitees.map((a) => a.id),
        }),
      });

      if (res.ok) {
        router.push("/guide/proposals");
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Failed to create proposal. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/guide/proposals"
          className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft className="size-3.5" />
          Back to Proposals
        </Link>
        <h2 className="mt-2 font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
          New Trip Proposal
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Build a guided trip proposal and invite anglers.
        </p>
      </div>

      <ProposalStepIndicator currentStep={step} />

      <Card className="border-stone-light/20">
        <CardContent className="py-6">
          {step === 1 && (
            <ProposalStepProperty
              selectedPropertyId={propertyId}
              onSelect={(id, name) => {
                setPropertyId(id);
                setPropertyName(name);
              }}
            />
          )}

          {step === 2 && (
            <ProposalStepDetails details={details} onChange={setDetails} />
          )}

          {step === 3 && (
            <ProposalStepFee
              feePerAngler={feePerAngler}
              maxAnglers={details.maxAnglers}
              onChange={setFeePerAngler}
            />
          )}

          {step === 4 && (
            <ProposalStepInvite
              invitees={invitees}
              onAdd={handleAddInvitee}
              onRemove={handleRemoveInvitee}
            />
          )}

          {step === 5 && (
            <ProposalStepReview
              propertyName={propertyName}
              details={details}
              feePerAngler={feePerAngler}
              invitees={invitees}
            />
          )}

          {/* Error message */}
          {error && (
            <div
              role="alert"
              aria-live="polite"
              className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
            >
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <div>
          {step > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={submitting}
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>
          )}
        </div>

        <div className="flex gap-3">
          {step < TOTAL_STEPS && (
            <Button
              type="button"
              onClick={handleNext}
              disabled={!canProceed()}
              className="bg-charcoal text-white hover:bg-charcoal/90"
            >
              Next
              <ArrowRight className="size-4" />
            </Button>
          )}

          {step === TOTAL_STEPS && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSubmit("draft")}
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                Save as Draft
              </Button>
              <Button
                type="button"
                onClick={() => handleSubmit("send")}
                disabled={submitting}
                className="bg-charcoal text-white hover:bg-charcoal/90"
              >
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                Send Proposal
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
