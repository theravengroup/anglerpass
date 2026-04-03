"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  XCircle,
} from "lucide-react";
import VerificationProgress from "@/components/guide/VerificationProgress";
import { GUIDE_VERIFICATION_FEE_DISPLAY } from "@/lib/constants/fees";

interface VerificationStatus {
  status: string;
  steps: {
    profile_complete: boolean;
    fee_paid: boolean;
    background_check_submitted: boolean;
    background_check_clear: boolean;
    verified: boolean;
    live: boolean;
  };
  checkr_status: string | null;
  verified_at: string | null;
  live_at: string | null;
  rejection_reason: string | null;
  suspended_reason: string | null;
  suspension_type: string | null;
}

export default function GuideVerificationPage() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [initiating, setInitiating] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const paymentStatus = searchParams.get("payment");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/guides/verification");
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (paymentStatus === "success") {
      setMessage({
        type: "success",
        text: "Payment received! Your background check will begin shortly.",
      });
    } else if (paymentStatus === "cancelled") {
      setMessage({
        type: "error",
        text: "Payment was cancelled. You can try again when ready.",
      });
    }
  }, [paymentStatus]);

  const handleInitiateVerification = async () => {
    setInitiating(true);
    setMessage(null);
    try {
      const res = await fetch("/api/guides/verification", { method: "POST" });
      const result = await res.json();

      if (res.ok && result.url) {
        window.location.href = result.url;
      } else {
        setMessage({
          type: "error",
          text: result.error ?? "Failed to start verification",
        });
      }
    } catch {
      setMessage({ type: "error", text: "An error occurred. Please try again." });
    } finally {
      setInitiating(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto flex max-w-3xl items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-charcoal" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
            Guide Verification
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Create your guide profile first before starting verification.
          </p>
        </div>
        <Card className="border-bronze/20 bg-bronze/5">
          <CardContent className="py-8 text-center">
            <p className="text-sm text-text-secondary">
              You need a guide profile before you can begin verification.
            </p>
            <Link
              href="/guide/profile"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-charcoal px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-charcoal/90"
            >
              Create Profile
              <ArrowRight className="size-4" />
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
          Guide Verification
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Complete verification to go live on AnglerPass.
        </p>
      </div>

      {/* Flash messages */}
      {message && (
        <div
          role="alert"
          aria-live="polite"
          className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-forest/20 bg-forest/5 text-forest"
              : "border-red-200 bg-red-50 text-red-600"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="size-4 shrink-0" />
          ) : (
            <AlertCircle className="size-4 shrink-0" />
          )}
          {message.text}
        </div>
      )}

      {/* Rejection banner */}
      {data.status === "rejected" && data.rejection_reason && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-start gap-3 py-4">
            <XCircle className="size-5 shrink-0 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-600">
                Verification Rejected
              </p>
              <p className="text-sm text-red-500">{data.rejection_reason}</p>
              <p className="mt-2 text-xs text-red-400">
                Please update your profile and documents, then restart
                verification.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Suspension banner */}
      {data.status === "suspended" && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-start gap-3 py-4">
            <AlertCircle className="size-5 shrink-0 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-600">
                Profile Suspended
              </p>
              <p className="text-sm text-red-500">
                {data.suspended_reason ?? "Your profile has been suspended."}
              </p>
              {data.suspension_type === "credential_expiry" && (
                <p className="mt-2 text-xs text-red-400">
                  Update your expired credentials to be automatically
                  reinstated.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live success */}
      {data.status === "live" && (
        <Card className="border-forest/20 bg-forest/5">
          <CardContent className="flex items-start gap-3 py-4">
            <CheckCircle2 className="size-5 shrink-0 text-forest" />
            <div>
              <p className="text-sm font-medium text-forest">
                You&apos;re Live!
              </p>
              <p className="text-sm text-text-secondary">
                Your profile is visible to anglers and you can accept bookings
                on approved waters.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress tracker */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="text-base">Verification Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <VerificationProgress steps={data.steps} status={data.status} />
        </CardContent>
      </Card>

      {/* Action card */}
      {data.status === "draft" && (
        <Card className="border-stone-light/20">
          <CardContent className="space-y-4 py-6">
            {!data.steps.profile_complete ? (
              <>
                <p className="text-sm text-text-secondary">
                  Before starting verification, make sure your profile is
                  complete and you&apos;ve uploaded your guide license and
                  insurance documents.
                </p>
                <Link href="/guide/profile">
                  <Button
                    variant="outline"
                    className="border-charcoal/30 text-charcoal hover:bg-charcoal/5"
                  >
                    Complete Profile
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <p className="text-sm text-text-secondary">
                  Your profile and documents are ready. Pay the one-time{" "}
                  {GUIDE_VERIFICATION_FEE_DISPLAY} verification fee to start
                  your background check.
                </p>
                <Button
                  onClick={handleInitiateVerification}
                  disabled={initiating}
                  className="bg-charcoal text-white hover:bg-charcoal/90"
                >
                  {initiating ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <ExternalLink className="mr-2 size-4" />
                  )}
                  Pay {GUIDE_VERIFICATION_FEE_DISPLAY} &amp; Start Verification
                </Button>
                <p className="text-xs text-text-light">
                  You&apos;ll be redirected to Stripe for secure payment.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Rejected — allow restart */}
      {data.status === "rejected" && (
        <Card className="border-stone-light/20">
          <CardContent className="space-y-4 py-6">
            <p className="text-sm text-text-secondary">
              Update your profile and documents, then restart the verification
              process.
            </p>
            <div className="flex gap-3">
              <Link href="/guide/profile">
                <Button
                  variant="outline"
                  className="border-charcoal/30 text-charcoal hover:bg-charcoal/5"
                >
                  Edit Profile
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending — waiting on background check */}
      {data.status === "pending" && (
        <Card className="border-bronze/20 bg-bronze/5">
          <CardContent className="space-y-3 py-6">
            <div className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin text-bronze" />
              <p className="text-sm font-medium text-text-primary">
                Background check in progress
              </p>
            </div>
            <p className="text-sm text-text-secondary">
              {data.checkr_status === "pending"
                ? "Your background check is being processed by Checkr. This typically takes 2-5 business days. Check your email for the Checkr invitation link if you haven't completed it yet."
                : "Your verification is being processed. We'll notify you when it's complete."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Verified — awaiting admin */}
      {data.status === "verified" && (
        <Card className="border-river/20 bg-river/5">
          <CardContent className="space-y-3 py-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-river" />
              <p className="text-sm font-medium text-text-primary">
                Awaiting final approval
              </p>
            </div>
            <p className="text-sm text-text-secondary">
              Your background check cleared! Our team is completing a final
              review of your profile. This usually takes 1-2 business days.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
