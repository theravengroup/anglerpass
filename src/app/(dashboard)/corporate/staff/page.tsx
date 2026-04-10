"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CorporateEmployeeRoster } from "@/components/angler/CorporateEmployeeRoster";
import CorporateInviteSection from "@/components/angler/CorporateInviteSection";
import { ArrowLeft, Loader2, Info } from "lucide-react";

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
  employees: Array<{
    id: string;
    user_id: string | null;
    display_name: string | null;
    email: string | null;
    status: string;
    dues_status: string | null;
    joined_at: string | null;
  }>;
  invitations: Array<{
    id: string;
    email: string;
    status: string;
    invited_at: string;
    accepted_at: string | null;
  }>;
  summary: {
    activeEmployees: number;
    pendingInvitations: number;
    totalTeamSize: number;
  };
}

export default function CorporateStaffPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/corporate/dashboard");
      if (!res.ok) {
        setError("Failed to load staff data.");
        return;
      }
      setData(await res.json());
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
          {error ?? "Unable to load staff data."}
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
            Staff Management
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Manage employees and invitations for{" "}
            {data.membership.company_name ?? "your company"}.
          </p>
        </div>
      </div>

      {/* Info banner */}
      <Card className="border-river/20 bg-river-pale/30">
        <CardContent className="flex items-start gap-3 py-4">
          <Info className="mt-0.5 size-4 shrink-0 text-river" />
          <p className="text-sm text-text-secondary">
            Invited staff join as Anglers with no initiation fee — they only pay
            annual club&nbsp;dues.
          </p>
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-stone-light/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-text-secondary">
              Active Employees
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-text-primary">
              {data.summary.activeEmployees}
            </p>
          </CardContent>
        </Card>
        <Card className="border-stone-light/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-text-secondary">
              Pending Invitations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-text-primary">
              {data.summary.pendingInvitations}
            </p>
          </CardContent>
        </Card>
        <Card className="border-stone-light/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-text-secondary">
              Total Team Size
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-text-primary">
              {data.summary.totalTeamSize}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Invite Section (includes form + invitations table) */}
      <CorporateInviteSection
        membershipId={data.membership.id}
        clubId={data.membership.club_id}
        clubName={data.club.name}
        companyName={data.membership.company_name ?? "Your Company"}
      />

      {/* Employee Roster */}
      <CorporateEmployeeRoster
        employees={data.employees}
        onRevoke={async (employeeId, email) => {
          try {
            const res = await fetch(
              `/api/corporate/employees/${employeeId}/revoke`,
              { method: "POST" }
            );
            if (res.ok) {
              await load();
            }
          } catch {
            // Silent fail — roster will stay in current state
          }
        }}
      />
    </div>
  );
}
