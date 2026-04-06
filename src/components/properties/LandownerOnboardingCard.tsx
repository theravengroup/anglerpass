"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  ArrowRight,
  CheckCircle2,
  Camera,
  DollarSign,
  Users,
  Send,
  Loader2,
  Clock,
  AlertTriangle,
  MapPin,
} from "lucide-react";
import PayoutSetup from "@/components/shared/PayoutSetup";

interface LandownerOnboardingCardProps {
  state:
    | "no_property"
    | "property_draft"
    | "pending_review"
    | "changes_requested"
    | "payout_needed";
  property?: {
    id: string;
    name: string;
  };
  checklist?: {
    has_photos: boolean;
    photo_count: number;
    has_pricing: boolean;
    has_capacity: boolean;
    has_club: boolean;
  };
  moderationNote?: string | null;
}

export default function LandownerOnboardingCard({
  state,
  property,
  checklist,
  moderationNote,
}: LandownerOnboardingCardProps) {
  // No property — prompt to add first one
  if (state === "no_property") {
    return (
      <Card className="border-forest/20 bg-forest/5">
        <CardContent className="py-8">
          <div className="flex flex-col items-center text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-forest/10">
              <MapPin className="size-8 text-forest" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-text-primary">
              List Your Private Water
            </h3>
            <p className="mt-2 max-w-lg text-sm text-text-secondary">
              AnglerPass connects your property with vetted anglers through
              fishing clubs. Clubs vet their members, so you can trust
              who&rsquo;s accessing your water. Add your property to get
              started.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-forest/10">
                  <Camera className="size-5 text-forest" />
                </div>
                <p className="mt-2 text-xs text-text-secondary">
                  Add photos & details
                </p>
              </div>
              <div>
                <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-river/10">
                  <Users className="size-5 text-river" />
                </div>
                <p className="mt-2 text-xs text-text-secondary">
                  Connect with a club
                </p>
              </div>
              <div>
                <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-bronze/10">
                  <DollarSign className="size-5 text-bronze" />
                </div>
                <p className="mt-2 text-xs text-text-secondary">
                  Start earning revenue
                </p>
              </div>
            </div>
            <Link href="/landowner/properties/new" className="mt-6">
              <Button className="bg-forest text-white hover:bg-forest/90">
                <Plus className="mr-1 size-4" />
                Add Your First Property
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Draft property — show checklist
  if (state === "property_draft" && property && checklist) {
    const steps = [
      {
        label: "Add photos",
        description: `${checklist.photo_count}/3 minimum photos uploaded`,
        done: checklist.has_photos,
        section: "photos",
      },
      {
        label: "Set pricing",
        description: "Full-day rod fees for adults",
        done: checklist.has_pricing,
        section: "pricing",
      },
      {
        label: "Set capacity",
        description: "Maximum rods and guest count",
        done: checklist.has_capacity,
        section: "details",
      },
      {
        label: "Connect with a club",
        description:
          "Invite a club or get associated — clubs vet anglers so you don't have to",
        done: checklist.has_club,
        section: "club",
      },
      {
        label: "Submit for review",
        description: "Our team reviews your listing before it goes live",
        done: false,
        section: "submit",
      },
    ];

    const completedCount = steps.filter((s) => s.done).length;
    const allPreSubmitDone = steps.slice(0, 4).every((s) => s.done);

    return (
      <Card className="border-forest/20 bg-forest/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="size-5 text-forest" />
            Finish Setting Up{" "}
            <span className="text-forest">{property.name}</span>
          </CardTitle>
          <CardDescription>
            {completedCount} of {steps.length} steps complete — fill in the
            remaining details to submit your property for review.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Progress bar */}
          <div className="mb-5 h-2 overflow-hidden rounded-full bg-forest/10">
            <div
              className="h-full rounded-full bg-forest transition-all duration-500"
              style={{
                width: `${(completedCount / steps.length) * 100}%`,
              }}
            />
          </div>

          <div className="space-y-3">
            {steps.map((step) => {
              const isSubmitStep = step.section === "submit";
              const editHref = `/landowner/properties/${property.id}`;

              return (
                <div
                  key={step.label}
                  className={`flex items-start gap-3 rounded-lg border bg-white px-4 py-3 ${
                    step.done ? "border-forest/10" : "border-stone-light/20"
                  }`}
                >
                  <div className="mt-0.5">
                    {step.done ? (
                      <CheckCircle2 className="size-5 text-forest" />
                    ) : (
                      <div className="size-5 rounded-full border-2 border-stone-light/40" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p
                      className={`text-sm font-medium ${
                        step.done
                          ? "text-text-light line-through"
                          : "text-text-primary"
                      }`}
                    >
                      {step.label}
                    </p>
                    <p className="text-xs text-text-light">
                      {step.description}
                    </p>
                  </div>
                  {!step.done && !isSubmitStep && (
                    <Link href={editHref} className="shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 border-forest/30 text-xs text-forest hover:bg-forest/5"
                      >
                        {step.section === "club" ? "Invite Club" : "Edit"}
                        <ArrowRight className="ml-1 size-3" />
                      </Button>
                    </Link>
                  )}
                  {isSubmitStep && allPreSubmitDone && (
                    <Link href={editHref} className="shrink-0">
                      <Button
                        size="sm"
                        className="h-7 bg-forest text-xs text-white hover:bg-forest/90"
                      >
                        Submit
                        <Send className="ml-1 size-3" />
                      </Button>
                    </Link>
                  )}
                </div>
              );
            })}
          </div>

          {/* Club affiliation callout */}
          {!checklist.has_club && (
            <div className="mt-4 rounded-lg border border-river/20 bg-river/5 px-4 py-3">
              <div className="flex items-start gap-3">
                <Users className="size-5 shrink-0 text-river" />
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    Why connect with a club?
                  </p>
                  <p className="mt-0.5 text-xs text-text-secondary">
                    Fishing clubs vet their members before they can book,
                    so you can trust who&rsquo;s on your property. You can
                    invite your own club or let an existing AnglerPass club
                    request access.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Pending review
  if (state === "pending_review" && property) {
    return (
      <Card className="border-river/20 bg-river/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="size-5 text-river" />
            Under Review
          </CardTitle>
          <CardDescription>
            <span className="font-medium">{property.name}</span> has been
            submitted and is being reviewed by the AnglerPass team. This
            typically takes 1-2 business days.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-forest">
              <CheckCircle2 className="size-4" />
              Property details complete
            </div>
            <div className="flex items-center gap-2 text-sm text-forest">
              <CheckCircle2 className="size-4" />
              Submitted for review
            </div>
            <div className="flex items-center gap-2 text-sm text-river">
              <Loader2 className="size-4 animate-spin" />
              AnglerPass team reviewing
            </div>
          </div>
          <div className="mt-4 rounded-lg border border-stone-light/20 bg-white px-4 py-3">
            <p className="text-sm text-text-secondary">
              We&rsquo;ll notify you as soon as your property is approved.
              While you wait, you can set up your payout account so
              you&rsquo;re ready to receive revenue.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Changes requested
  if (state === "changes_requested" && property) {
    return (
      <Card className="border-amber-500/20 bg-amber-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-amber-700">
            <AlertTriangle className="size-5" />
            Changes Requested
          </CardTitle>
          <CardDescription>
            The AnglerPass team reviewed{" "}
            <span className="font-medium">{property.name}</span> and has
            some feedback before it can go live.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {moderationNote && (
            <div className="rounded-lg border border-amber-200 bg-white px-4 py-3">
              <p className="text-xs font-medium text-text-light">
                Reviewer Notes
              </p>
              <p className="mt-1 text-sm text-text-primary">
                {moderationNote}
              </p>
            </div>
          )}
          <Link href={`/landowner/properties/${property.id}`}>
            <Button className="w-full bg-forest text-white hover:bg-forest/90">
              Make Changes
              <ArrowRight className="ml-1 size-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Payout needed — property published but no bank account
  if (state === "payout_needed" && property) {
    return (
      <div className="space-y-4">
        <Card className="border-forest/20 bg-forest/5">
          <CardContent className="flex items-start gap-3 py-4">
            <CheckCircle2 className="size-5 shrink-0 text-forest" />
            <div>
              <p className="text-sm font-medium text-text-primary">
                {property.name} is live!
              </p>
              <p className="text-sm text-text-secondary">
                Your property is published and visible to anglers. Connect your
                bank account below to start receiving booking revenue.
              </p>
            </div>
          </CardContent>
        </Card>
        <PayoutSetup type="landowner" />
      </div>
    );
  }

  return null;
}
