"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  ListOrdered,
  Users,
  MapPin,
  Send,
  Trash2,
  Loader2,
  Clock,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";

interface WaitlistEntry {
  id: string;
  club_id: string;
  type: string;
  reference_id: string | null;
  user_id: string;
  position: number;
  status: string;
  notes: string | null;
  offered_at: string | null;
  offer_expires_at: string | null;
  created_at: string;
  profile: { full_name: string; email: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  waiting: "text-bronze bg-bronze/10",
  offered: "text-river bg-river/10",
  accepted: "text-forest bg-forest/10",
  expired: "text-text-light bg-stone-light/10",
  cancelled: "text-text-light bg-stone-light/10",
  declined: "text-red-500 bg-red-50",
};

export default function WaitlistsPage() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [clubId, setClubId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"membership" | "property">(
    "membership"
  );
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    loadClubId();
  }, []);

  useEffect(() => {
    if (clubId) loadEntries();
  }, [clubId, activeTab]);

  async function loadClubId() {
    try {
      const res = await fetch("/api/clubs");
      const json = await res.json();
      const club =
        json.owned?.[0] ?? json.staff_of?.[0] ?? json.member_of?.[0];
      if (club) setClubId(club.id);
      else setLoading(false);
    } catch {
      setLoading(false);
    }
  }

  async function loadEntries() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/clubos/waitlists?club_id=${clubId}&type=${activeTab}`
      );
      const json = await res.json();
      setEntries(json.entries ?? []);
    } catch {
      // Show empty
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(entryId: string, action: string) {
    setActing(entryId);
    try {
      await fetch(`/api/clubos/waitlists/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      await loadEntries();
    } catch {
      // Handle silently
    } finally {
      setActing(null);
    }
  }

  const waitingEntries = entries.filter((e) => e.status === "waiting");
  const offeredEntries = entries.filter((e) => e.status === "offered");
  const otherEntries = entries.filter(
    (e) => e.status !== "waiting" && e.status !== "offered"
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-text-light">
        <Link
          href="/club/clubos"
          className="transition-colors hover:text-text-secondary"
        >
          ClubOS
        </Link>
        <ChevronRight className="size-3.5" />
        <Link
          href="/club/clubos/operations"
          className="transition-colors hover:text-text-secondary"
        >
          Operations
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-text-primary font-medium">Waitlists</span>
      </nav>

      {/* Header */}
      <div>
        <h2 className="font-heading text-2xl font-semibold text-text-primary">
          Waitlists
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Manage membership and property waitlists for your&nbsp;club.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-stone-light/20 p-1">
        <button
          onClick={() => setActiveTab("membership")}
          className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "membership"
              ? "bg-river/10 text-river"
              : "text-text-light hover:text-text-secondary"
          }`}
        >
          <Users className="size-4" />
          Membership Waitlist
        </button>
        <button
          onClick={() => setActiveTab("property")}
          className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "property"
              ? "bg-river/10 text-river"
              : "text-text-light hover:text-text-secondary"
          }`}
        >
          <MapPin className="size-4" />
          Property Waitlists
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="size-6 animate-spin text-river" />
        </div>
      ) : entries.length === 0 ? (
        <EmptyState
          icon={ListOrdered}
          title={`No ${activeTab} waitlist entries`}
          description={
            activeTab === "membership"
              ? "When people request to join your club and it's at capacity, they'll appear here."
              : "When members request access to a property that's at capacity, they'll appear&nbsp;here."
          }
          iconColor="text-bronze"
          iconBackground
        />
      ) : (
        <div className="space-y-6">
          {/* Waiting */}
          {waitingEntries.length > 0 && (
            <Card className="border-stone-light/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="size-4 text-bronze" />
                  Waiting ({waitingEntries.length})
                </CardTitle>
                <CardDescription>
                  In queue — offer a spot when one becomes&nbsp;available
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {waitingEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between rounded-lg border border-stone-light/20 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 items-center justify-center rounded-full bg-bronze/10 text-xs font-bold text-bronze">
                          {entry.position}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary">
                            {entry.profile?.full_name ?? "Unknown"}
                          </p>
                          <p className="text-xs text-text-light">
                            Added{" "}
                            {new Date(entry.created_at).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric", year: "numeric" }
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAction(entry.id, "offer")}
                          disabled={acting === entry.id}
                          className="text-river"
                        >
                          {acting === entry.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Send className="size-3.5" />
                          )}
                          Offer Spot
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAction(entry.id, "cancel")}
                          disabled={acting === entry.id}
                          aria-label={`Remove ${entry.profile?.full_name}`}
                        >
                          <Trash2 className="size-3.5 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Offered */}
          {offeredEntries.length > 0 && (
            <Card className="border-stone-light/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Send className="size-4 text-river" />
                  Offered ({offeredEntries.length})
                </CardTitle>
                <CardDescription>
                  Spot offered — waiting for response
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {offeredEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between rounded-lg border border-stone-light/20 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {entry.profile?.full_name ?? "Unknown"}
                        </p>
                        <p className="text-xs text-text-light">
                          Offered{" "}
                          {entry.offered_at
                            ? new Date(
                                entry.offered_at
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })
                            : ""}
                          {entry.offer_expires_at && (
                            <>
                              {" · Expires "}
                              {new Date(
                                entry.offer_expires_at
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </>
                          )}
                        </p>
                      </div>
                      <span className="rounded-full bg-river/10 px-2.5 py-1 text-xs font-medium text-river">
                        Offered
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* History */}
          {otherEntries.length > 0 && (
            <Card className="border-stone-light/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-stone-light/10">
                  {otherEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between py-2.5"
                    >
                      <div>
                        <p className="text-sm text-text-primary">
                          {entry.profile?.full_name ?? "Unknown"}
                        </p>
                        <p className="text-xs text-text-light">
                          {new Date(entry.created_at).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric", year: "numeric" }
                          )}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                          STATUS_COLORS[entry.status] ??
                          "text-text-light bg-stone-light/10"
                        }`}
                      >
                        {entry.status}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
