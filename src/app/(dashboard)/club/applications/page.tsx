"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ClipboardList, CheckCircle2, XCircle, Clock } from "lucide-react";
import { FetchError } from "@/components/shared/FetchError";
import ApplicationCard from "@/components/clubs/ApplicationCard";

interface Application {
  id: string;
  user_id: string;
  status: string;
  application_note: string | null;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  reviewed_at: string | null;
  declined_reason: string | null;
  created_at: string;
}

type FilterTab = "pending" | "approved" | "declined" | "all";

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [clubId, setClubId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterTab>("pending");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function fetchApplications(cid: string) {
    try {
      const res = await fetch(`/api/clubs/${cid}/applications`);
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications ?? []);
      }
    } catch {
      // Silent fail
    }
  }

  async function init() {
    setError(false);
    setLoading(true);
    try {
      const res = await fetch("/api/clubs");
      if (!res.ok) {
        setError(true);
        return;
      }

      const data = await res.json();
      if (data.owned?.length) {
        const cid = data.owned[0].id;
        setClubId(cid);
        await fetchApplications(cid);
      } else if (data.staff_of?.length) {
        const cid = data.staff_of[0].id;
        setClubId(cid);
        await fetchApplications(cid);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    init();
  }, []);

  async function handleApprove(applicationId: string) {
    if (!clubId) return;
    setActionLoading(applicationId);
    try {
      const res = await fetch(
        `/api/clubs/${clubId}/applications/${applicationId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "approve" }),
        }
      );
      if (res.ok) {
        await fetchApplications(clubId);
      }
    } catch {
      // Silent fail
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDecline(applicationId: string, reason?: string) {
    if (!clubId) return;
    setActionLoading(applicationId);
    try {
      const res = await fetch(
        `/api/clubs/${clubId}/applications/${applicationId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "decline", declined_reason: reason }),
        }
      );
      if (res.ok) {
        await fetchApplications(clubId);
      }
    } catch {
      // Silent fail
    } finally {
      setActionLoading(null);
    }
  }

  const pendingCount = applications.filter((a) => a.status === "pending").length;
  const approvedCount = applications.filter(
    (a) => a.status === "approved" || a.status === "completed"
  ).length;
  const declinedCount = applications.filter((a) => a.status === "declined").length;

  const filtered = applications.filter((a) => {
    if (filter === "pending") return a.status === "pending";
    if (filter === "approved")
      return a.status === "approved" || a.status === "completed";
    if (filter === "declined") return a.status === "declined";
    return true;
  });

  const filterTabs: { key: FilterTab; label: string; count: number; icon: typeof Clock }[] = [
    { key: "pending", label: "Pending", count: pendingCount, icon: Clock },
    { key: "approved", label: "Approved", count: approvedCount, icon: CheckCircle2 },
    { key: "declined", label: "Declined", count: declinedCount, icon: XCircle },
    { key: "all", label: "All", count: applications.length, icon: ClipboardList },
  ];

  if (loading) {
    return (
      <div className="mx-auto flex max-w-5xl items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-river" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl">
        <FetchError message="Failed to load applications." onRetry={init} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
          Membership Applications
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Review and manage membership requests from anglers.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-stone-light/20">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-bronze/10">
                <Clock className="size-5 text-bronze" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-text-primary">{pendingCount}</p>
                <p className="text-xs text-text-light">Awaiting review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-stone-light/20">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-forest/10">
                <CheckCircle2 className="size-5 text-forest" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-text-primary">{approvedCount}</p>
                <p className="text-xs text-text-light">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-stone-light/20">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-red-50">
                <XCircle className="size-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-text-primary">{declinedCount}</p>
                <p className="text-xs text-text-light">Declined</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 rounded-lg border border-stone-light/20 bg-offwhite/50 p-1">
        {filterTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                filter === tab.key
                  ? "bg-white text-text-primary shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <Icon className="size-3.5" />
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`ml-1 inline-flex size-5 items-center justify-center rounded-full text-xs ${
                    tab.key === "pending" && tab.count > 0
                      ? "bg-bronze/20 text-bronze"
                      : "bg-stone-light/20 text-text-light"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Application list */}
      {filtered.length === 0 ? (
        <Card className="border-stone-light/20">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex size-14 items-center justify-center rounded-full bg-bronze/10">
              <ClipboardList className="size-6 text-bronze" />
            </div>
            <h3 className="mt-4 text-base font-medium text-text-primary">
              {filter === "pending"
                ? "No pending applications"
                : filter === "approved"
                  ? "No approved applications"
                  : filter === "declined"
                    ? "No declined applications"
                    : "No applications yet"}
            </h3>
            <p className="mt-1 max-w-sm text-center text-sm text-text-secondary">
              {filter === "pending"
                ? "You're all caught up! New applications will appear here."
                : "When anglers request to join your club, their applications will appear here."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((app) => (
            <ApplicationCard
              key={app.id}
              application={app}
              isLoading={actionLoading === app.id}
              onApprove={handleApprove}
              onDecline={handleDecline}
            />
          ))}
        </div>
      )}
    </div>
  );
}
