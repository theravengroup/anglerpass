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
  Loader2,
  MapPin,
  Users,
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
  club: { name: string; location: string | null };
  summary: {
    activeEmployees: number;
    pendingInvitations: number;
    totalTeamSize: number;
  };
}

export default function CorporateProfilePage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/corporate/dashboard");
        if (!res.ok) {
          setError("Failed to load profile data.");
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
          {error ?? "Unable to load profile data."}
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
            Company Profile
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            View and manage your corporate account details.
          </p>
        </div>
      </div>

      {/* Company Info */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-bronze/10">
                <Building2 className="size-5 text-bronze" />
              </div>
              <div>
                <CardTitle className="text-base">Company Information</CardTitle>
                <CardDescription>
                  Details about your corporate account
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled
              className="text-xs"
              title="Coming soon"
            >
              Edit Profile
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-text-light">Company Name</dt>
              <dd className="mt-1 text-sm font-medium text-text-primary">
                {data.membership.company_name ?? "Not set"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-text-light">Membership Status</dt>
              <dd className="mt-1 text-sm font-medium capitalize text-text-primary">
                {data.membership.status}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-text-light">Associated Club</dt>
              <dd className="mt-1 text-sm text-text-primary">
                {data.club.name}
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

      {/* Contact Person */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-forest/10">
              <Users className="size-5 text-forest" />
            </div>
            <div>
              <CardTitle className="text-base">Contact Person</CardTitle>
              <CardDescription>
                Primary point of contact for this membership
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6">
            <p className="text-sm text-text-secondary">
              Contact person details will be available in a future&nbsp;update.
            </p>
            <p className="mt-1 text-xs text-text-light">
              For now, the account owner is the primary contact.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Company Address */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-river/10">
              <MapPin className="size-5 text-river" />
            </div>
            <div>
              <CardTitle className="text-base">Company Address</CardTitle>
              <CardDescription>
                Business address on file
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6">
            <p className="text-sm text-text-secondary">
              Address management will be available in a future&nbsp;update.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Team Summary */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="text-base">Team Summary</CardTitle>
          <CardDescription>
            Overview of your corporate membership team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-stone-light/10 px-4 py-3 text-center">
              <p className="text-2xl font-semibold text-text-primary">
                {data.summary.activeEmployees}
              </p>
              <p className="mt-0.5 text-xs text-text-light">
                Active Employees
              </p>
            </div>
            <div className="rounded-lg border border-stone-light/10 px-4 py-3 text-center">
              <p className="text-2xl font-semibold text-text-primary">
                {data.summary.pendingInvitations}
              </p>
              <p className="mt-0.5 text-xs text-text-light">
                Pending Invitations
              </p>
            </div>
            <div className="rounded-lg border border-stone-light/10 px-4 py-3 text-center">
              <p className="text-2xl font-semibold text-text-primary">
                {data.summary.totalTeamSize}
              </p>
              <p className="mt-0.5 text-xs text-text-light">
                Total Team Size
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
