"use client";

import { useEffect, useState } from "react";
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
  ArrowLeft,
  Building2,
  DollarSign,
  ExternalLink,
  Loader2,
  MapPin,
} from "lucide-react";

interface DashboardData {
  membership: {
    id: string;
    club_id: string;
    company_name: string | null;
    status: string;
    dues_status: string | null;
    joined_at: string;
  };
  club: {
    name: string;
    location: string | null;
    corporate_initiation_fee?: number | null;
    annual_dues?: number | null;
    contact_email?: string | null;
    contact_phone?: string | null;
    website?: string | null;
  };
}

export default function CorporateClubPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/corporate/dashboard");
        if (!res.ok) {
          setError("Failed to load club data.");
          return;
        }
        setData(await res.json());
      } catch {
        setError("An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto flex max-w-5xl items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-bronze" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-5xl">
        <div
          role="alert"
          aria-live="polite"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error ?? "Unable to load club data."}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/corporate">
          <Button
            variant="ghost"
            size="sm"
            className="text-text-secondary hover:text-text-primary"
            aria-label="Back to corporate dashboard"
          >
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <h2 className="font-heading text-2xl font-semibold text-text-primary">
            Club Details
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Information about your associated fishing club.
          </p>
        </div>
      </div>

      {/* Club Overview */}
      <Card className="border-river/20 bg-river-pale/30">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-lg bg-river/10">
              <Building2 className="size-6 text-river" />
            </div>
            <div>
              <CardTitle className="text-xl">{data.club.name}</CardTitle>
              {data.club.location && (
                <CardDescription className="flex items-center gap-1">
                  <MapPin className="size-3" />
                  {data.club.location}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-text-secondary">
            Your corporate membership at {data.club.name} gives your team access
            to exclusive private waters. Employees you invite join as anglers
            without paying an initiation&nbsp;fee.
          </p>
          <div className="mt-4">
            <Link href={`/clubs/${data.membership.club_id}`}>
              <Button
                variant="outline"
                size="sm"
                className="border-river/20 text-xs text-river hover:bg-river/5"
              >
                View Public Club Page
                <ExternalLink className="ml-1 size-3" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Club Contact */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="text-base">Club Contact</CardTitle>
          <CardDescription>
            Reach out to the club for questions about your membership
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-text-light">Email</dt>
              <dd className="mt-1 text-sm text-text-primary">
                {data.club.contact_email ?? "Not available"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-text-light">Phone</dt>
              <dd className="mt-1 text-sm text-text-primary">
                {data.club.contact_phone ?? "Not available"}
              </dd>
            </div>
            {data.club.website && (
              <div className="sm:col-span-2">
                <dt className="text-xs text-text-light">Website</dt>
                <dd className="mt-1">
                  <a
                    href={data.club.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-river hover:underline"
                  >
                    {data.club.website}
                    <ExternalLink className="size-3" />
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Corporate Membership Terms */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-bronze/10">
              <DollarSign className="size-5 text-bronze" />
            </div>
            <div>
              <CardTitle className="text-base">
                Corporate Membership Terms
              </CardTitle>
              <CardDescription>
                Fee structure for your corporate membership
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-stone-light/10 px-4 py-3">
              <p className="text-xs text-text-light">
                Corporate Initiation Fee
              </p>
              <p className="mt-1 text-lg font-semibold text-text-primary">
                {data.club.corporate_initiation_fee != null
                  ? `$${data.club.corporate_initiation_fee.toLocaleString()}`
                  : "Contact club"}
              </p>
              <p className="mt-0.5 text-xs text-forest">Paid</p>
            </div>
            <div className="rounded-lg border border-stone-light/10 px-4 py-3">
              <p className="text-xs text-text-light">
                Employee Annual Dues
              </p>
              <p className="mt-1 text-lg font-semibold text-text-primary">
                {data.club.annual_dues != null
                  ? `$${data.club.annual_dues.toLocaleString()}/yr`
                  : "Contact club"}
              </p>
              <p className="mt-0.5 text-xs text-text-secondary">
                Per employee
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Membership Details */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="text-base">Your Membership</CardTitle>
          <CardDescription>
            Corporate membership details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-text-light">Company</dt>
              <dd className="mt-1 text-sm font-medium text-text-primary">
                {data.membership.company_name ?? "Not set"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-text-light">Status</dt>
              <dd className="mt-1 text-sm font-medium capitalize text-text-primary">
                {data.membership.status}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-text-light">Member Since</dt>
              <dd className="mt-1 text-sm text-text-primary">
                {new Date(data.membership.joined_at).toLocaleDateString(
                  "en-US",
                  { month: "long", day: "numeric", year: "numeric" }
                )}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
