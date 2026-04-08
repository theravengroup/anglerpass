"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";
import { CorporateOverviewCard } from "@/components/angler/CorporateOverviewCard";
import { CorporateEmployeeRoster } from "@/components/angler/CorporateEmployeeRoster";
import { CorporateInvitationsPanel } from "@/components/angler/CorporateInvitationsTable2";
import CorporateInviteSection from "@/components/angler/CorporateInviteSection";

// ─── Types ──────────────────────────────────────────────────────────

interface CorporateDashboardData {
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
  };
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

// ─── Page ────────────────────────────────────────────────────────────

export default function CorporateDashboardPage() {
  const [data, setData] = useState<CorporateDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/anglers/corporate-dashboard");
      if (res.status === 404) {
        setError("No corporate membership found.");
        return;
      }
      if (!res.ok) {
        setError("Failed to load corporate dashboard.");
        return;
      }
      const json = await res.json();
      setData(json);
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRevokeInvitation(invitationId: string) {
    setRevokingId(invitationId);
    try {
      const res = await fetch(
        `/api/corporate-invitations/${invitationId}/revoke`,
        { method: "POST" }
      );
      if (res.ok) await load();
    } finally {
      setRevokingId(null);
    }
  }

  async function handleResendInvitation(invitationId: string) {
    setRevokingId(invitationId);
    try {
      const res = await fetch(
        `/api/corporate-invitations/${invitationId}/resend`,
        { method: "POST" }
      );
      if (res.ok) await load();
    } finally {
      setRevokingId(null);
    }
  }

  async function handleRemoveEmployee(employeeId: string) {
    if (!data) return;
    const employee = data.employees.find((e) => e.id === employeeId);
    if (!employee) return;

    // Find the accepted invitation matching this employee's email
    const invitation = data.invitations.find(
      (inv) =>
        inv.status === "accepted" &&
        inv.email.toLowerCase() === (employee.email ?? "").toLowerCase()
    );

    if (invitation) {
      await handleRevokeInvitation(invitation.id);
    } else {
      await load();
    }
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-5xl items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-bronze" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <BackLink />
        <div
          role="alert"
          aria-live="polite"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error ?? "Failed to load corporate dashboard."}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <BackLink />
        <div>
          <h1 className="font-heading text-2xl font-semibold text-text-primary">
            Corporate Management
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Manage your corporate membership, employees, and invitations.
          </p>
        </div>
      </div>

      {/* A. Company Overview */}
      <CorporateOverviewCard
        membership={data.membership}
        club={data.club}
        summary={data.summary}
      />

      {/* B. Employee Roster */}
      <CorporateEmployeeRoster
        employees={data.employees}
        onRevoke={handleRemoveEmployee}
      />

      {/* C. Invitations */}
      <CorporateInvitationsPanel
        invitations={data.invitations}
        revokingId={revokingId}
        onRevoke={handleRevokeInvitation}
        onResend={handleResendInvitation}
      />

      {/* D. Invite Employees */}
      <CorporateInviteSection
        membershipId={data.membership.id}
        clubId={data.membership.club_id}
        clubName={data.club.name}
        companyName={data.membership.company_name ?? ""}
      />
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/angler"
      className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary"
    >
      <ArrowLeft className="size-3.5" />
      Back to Dashboard
    </Link>
  );
}
