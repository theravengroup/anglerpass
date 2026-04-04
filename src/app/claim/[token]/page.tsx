"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  CheckCircle2,
  MapPin,
  Droplets,
  AlertCircle,
} from "lucide-react";
import { WATER_TYPE_LABELS } from "@/lib/constants/water-types";

interface ClaimData {
  invitation: { status: string; landowner_email: string };
  property: {
    id: string;
    name: string;
    location_description: string | null;
    photo: string | null;
    water_type: string | null;
  } | null;
  club: { name: string } | null;
}

export default function ClaimPropertyPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [data, setData] = useState<ClaimData | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/properties/claim?token=${token}`);
        if (!res.ok) {
          const err = await res.json();
          setError(err.error ?? "Invalid invitation");
          return;
        }
        const result = await res.json();
        setData(result);

        if (result.invitation.status !== "pending") {
          setError("This invitation has already been used.");
        }
      } catch {
        setError("Failed to load invitation details");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token]);

  async function handleClaim() {
    setClaiming(true);
    setError(null);

    try {
      const res = await fetch("/api/properties/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) {
        const err = await res.json();
        if (res.status === 401) {
          // User not logged in — redirect to sign up with return URL
          router.push(
            `/signup?redirect=${encodeURIComponent(`/claim/${token}`)}`
          );
          return;
        }
        setError(err.error ?? "Failed to claim property");
        setClaiming(false);
        return;
      }

      setClaimed(true);
    } catch {
      setError("An unexpected error occurred");
      setClaiming(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-forest" />
      </div>
    );
  }

  if (claimed) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16">
        <Card className="border-forest/20">
          <CardContent className="flex flex-col items-center py-10 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-forest/10">
              <CheckCircle2 className="size-8 text-forest" />
            </div>
            <h2 className="mt-5 font-heading text-2xl font-semibold text-forest">
              Property Claimed!
            </h2>
            <p className="mt-2 max-w-sm text-sm text-text-secondary">
              <strong>{data?.property?.name}</strong> is now yours. Complete your
              Stripe Connect onboarding to enable payouts and make the property
              bookable.
            </p>
            <div className="mt-6 flex gap-3">
              <Button onClick={() => router.push("/landowner/properties")}>
                Go to My Properties
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  router.push(`/landowner/properties/${data?.property?.id}/edit`)
                }
              >
                Edit Property
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-16">
      <Card className="border-stone-light/20">
        <CardContent className="py-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="font-heading text-2xl font-semibold text-forest">
              Claim Your Property
            </h1>
            {data?.club && (
              <p className="mt-2 text-sm text-text-secondary">
                <strong>{data.club.name}</strong> has set up this property on
                your behalf
              </p>
            )}
          </div>

          {/* Property preview */}
          {data?.property && (
            <div className="mt-6 flex items-center gap-4 rounded-lg border border-stone-light/20 p-4">
              <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-offwhite">
                {data.property.photo ? (
                  <img
                    src={data.property.photo}
                    alt={data.property.name}
                    className="size-full object-cover"
                  />
                ) : (
                  <MapPin className="size-6 text-text-light" />
                )}
              </div>
              <div>
                <p className="font-medium text-text-primary">
                  {data.property.name}
                </p>
                {data.property.location_description && (
                  <p className="text-xs text-text-light">
                    {data.property.location_description}
                  </p>
                )}
                {data.property.water_type && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-text-light">
                    <Droplets className="size-3" />
                    {WATER_TYPE_LABELS[data.property.water_type] ??
                      data.property.water_type}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Steps */}
          <div className="mt-6 space-y-3 rounded-lg bg-offwhite p-4">
            <p className="text-sm font-medium text-text-primary">
              What happens next:
            </p>
            <ol className="space-y-2 text-sm text-text-secondary">
              <li className="flex gap-2">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-forest text-[11px] font-bold text-white">
                  1
                </span>
                Claim ownership by clicking the button below
              </li>
              <li className="flex gap-2">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-forest text-[11px] font-bold text-white">
                  2
                </span>
                Review and edit property details, add lodging info
              </li>
              <li className="flex gap-2">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-forest text-[11px] font-bold text-white">
                  3
                </span>
                Complete Stripe Connect onboarding for automatic payouts
              </li>
            </ol>
          </div>

          {/* Error */}
          {error && (
            <div
              className="mt-4 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
              aria-live="polite"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              {error}
            </div>
          )}

          {/* CTA */}
          {!error?.includes("already been used") && (
            <Button
              className="mt-6 w-full"
              size="lg"
              onClick={handleClaim}
              disabled={claiming}
            >
              {claiming ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Claiming...
                </>
              ) : (
                "Claim This Property"
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
