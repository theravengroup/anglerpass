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
  CreditCard,
  DollarSign,
  FileText,
  Loader2,
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
}

export default function CorporateBillingPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/corporate/dashboard");
        if (!res.ok) {
          setError("Failed to load billing data.");
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
          {error ?? "Unable to load billing data."}
        </div>
      </div>
    );
  }

  const STATUS_CLASSES: Record<string, string> = {
    active: "bg-forest/10 text-forest",
    past_due: "bg-amber-50 text-amber-700",
    lapsed: "bg-red-50 text-red-600",
    grace_period: "bg-orange-50 text-orange-700",
  };

  const statusClass =
    STATUS_CLASSES[data.membership.dues_status ?? ""] ??
    "bg-stone-light/20 text-text-light";
  const statusLabel = data.membership.dues_status
    ? data.membership.dues_status
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
    : "N/A";

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
            Billing
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Manage billing for{" "}
            {data.membership.company_name ?? "your company"}.
          </p>
        </div>
      </div>

      {/* Membership Status */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-bronze/10">
              <CreditCard className="size-5 text-bronze" />
            </div>
            <div>
              <CardTitle className="text-base">Membership Status</CardTitle>
              <CardDescription>{data.club.name}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-text-light">Membership</p>
              <p className="mt-1 text-sm font-medium capitalize text-text-primary">
                {data.membership.status}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-light">Dues Status</p>
              <span
                className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass}`}
              >
                {statusLabel}
              </span>
            </div>
            <div>
              <p className="text-xs text-text-light">Member Since</p>
              <p className="mt-1 text-sm text-text-primary">
                {new Date(data.membership.joined_at).toLocaleDateString(
                  "en-US",
                  { month: "long", day: "numeric", year: "numeric" }
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fee Breakdown */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-forest/10">
              <DollarSign className="size-5 text-forest" />
            </div>
            <div>
              <CardTitle className="text-base">Fee Structure</CardTitle>
              <CardDescription>
                Understanding corporate vs employee fees
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg border border-stone-light/10 px-4 py-3">
            <p className="text-sm font-medium text-text-primary">
              Corporate Initiation Fee
            </p>
            <p className="mt-0.5 text-xs text-text-secondary">
              One-time fee paid by your company when joining the club. This has
              already been&nbsp;paid.
            </p>
          </div>
          <div className="rounded-lg border border-stone-light/10 px-4 py-3">
            <p className="text-sm font-medium text-text-primary">
              Employee Annual Dues
            </p>
            <p className="mt-0.5 text-xs text-text-secondary">
              Each invited employee pays their own annual club dues. No
              initiation fee is required for employees under a corporate
              membership.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Payment History — Coming Soon */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-stone-light/20">
              <FileText className="size-5 text-text-light" />
            </div>
            <div>
              <CardTitle className="text-base">Payment History</CardTitle>
              <CardDescription>
                View past invoices and payments
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <FileText className="size-8 text-stone-light" />
            <p className="mt-3 text-sm font-medium text-text-secondary">
              Coming Soon
            </p>
            <p className="mt-1 text-xs text-text-light">
              Payment history and invoice downloads will be available in a
              future&nbsp;update.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
