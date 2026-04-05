"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Users,
  Compass,
  Search,
  MapPin,
  CheckCircle2,
  Clock,
} from "lucide-react";

interface BrowseClub {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  logo_url: string | null;
  member_count: number;
  membership_status: string | null;
  is_member: boolean;
}

export default function ClubBrowser() {
  const [clubs, setClubs] = useState<BrowseClub[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState("");
  const [joining, setJoining] = useState<string | null>(null);
  const [applyingTo, setApplyingTo] = useState<string | null>(null);
  const [applicationNote, setApplicationNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const fetchClubs = useCallback(async (q = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      const res = await fetch(`/api/clubs/browse?${params}`);
      if (res.ok) {
        const data = await res.json();
        setClubs(data.clubs ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClubs();
  }, [fetchClubs]);

  const handleSearch = () => {
    fetchClubs(searchQ);
  };

  const hasHomeClub = clubs.some((c) => c.membership_status === "active");
  const hasPending = clubs.some((c) => c.membership_status === "pending");

  const handleJoin = async (clubId: string, note?: string) => {
    setJoining(clubId);
    setMessage(null);
    try {
      const res = await fetch("/api/clubs/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          club_id: clubId,
          application_note: note || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        setApplyingTo(null);
        setApplicationNote("");
        setClubs((prev) =>
          prev.map((c) =>
            c.id === clubId
              ? { ...c, membership_status: "pending", is_member: true }
              : c
          )
        );
      } else {
        setMessage(data.error ?? "Failed to send request");
      }
    } catch {
      setMessage("An error occurred. Please try again.");
    } finally {
      setJoining(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-bronze/20 bg-bronze/5">
        <CardContent className="py-5">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-bronze/10">
              <Users className="size-5 text-bronze" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-text-primary">
                Find Your Home Club
              </h3>
              <p className="mt-0.5 text-sm text-text-secondary">
                Choose a home club to get started. Through the Cross-Club
                Network, your membership gives you access to fish at partner
                clubs too — no need to join multiple clubs.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-light" />
          <Input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Search clubs by name or location..."
            className="pl-9"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
          />
        </div>
        <Button
          variant="outline"
          onClick={handleSearch}
          disabled={loading}
        >
          Search
        </Button>
      </div>

      {/* Status message */}
      {message && (
        <div className="rounded-lg border border-forest/20 bg-forest/5 px-4 py-3 text-sm text-forest">
          {message}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-bronze" />
        </div>
      )}

      {/* Club list */}
      {!loading && clubs.length === 0 && (
        <Card className="border-stone-light/20">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Compass className="size-8 text-text-light" />
            <p className="mt-3 text-sm text-text-secondary">
              {searchQ
                ? "No clubs found matching your search."
                : "No clubs are available yet. Check back soon!"}
            </p>
          </CardContent>
        </Card>
      )}

      {!loading && clubs.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {clubs.map((club) => {
            const isHome = club.membership_status === "active";
            const isPending = club.membership_status === "pending";
            const canJoin = !hasHomeClub && !hasPending && !isHome && !isPending;

            return (
              <Card
                key={club.id}
                className={`border-stone-light/20 ${isHome ? "ring-2 ring-river/30" : ""}`}
              >
                <CardContent className="py-5">
                  <div className="flex items-start gap-3">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-river/10 text-lg font-semibold text-river">
                      {club.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-medium text-text-primary">
                        {club.name}
                      </h3>
                      {club.location && (
                        <p className="flex items-center gap-1 text-xs text-text-light">
                          <MapPin className="size-3" />
                          {club.location}
                        </p>
                      )}
                      {club.description && (
                        <p className="mt-1.5 line-clamp-2 text-xs text-text-secondary">
                          {club.description}
                        </p>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-text-light">
                          {club.member_count} member
                          {club.member_count !== 1 ? "s" : ""}
                        </span>

                        {isHome ? (
                          <span className="flex items-center gap-1 text-xs font-medium text-forest">
                            <CheckCircle2 className="size-3.5" />
                            Home Club
                          </span>
                        ) : isPending ? (
                          <span className="flex items-center gap-1 text-xs font-medium text-bronze">
                            <Clock className="size-3.5" />
                            Pending
                          </span>
                        ) : applyingTo === club.id ? (
                          <div className="flex w-full flex-col gap-2">
                            <textarea
                              value={applicationNote}
                              onChange={(e) =>
                                setApplicationNote(e.target.value)
                              }
                              placeholder="Tell the club about yourself (optional)..."
                              maxLength={2000}
                              rows={2}
                              className="w-full resize-none rounded-md border border-stone-light/40 bg-white px-2.5 py-2 text-xs text-text-primary placeholder:text-text-light focus:border-river focus:outline-none"
                            />
                            <div className="flex gap-1.5">
                              <Button
                                size="sm"
                                className="h-7 flex-1 bg-river text-xs text-white hover:bg-river/90"
                                onClick={() =>
                                  handleJoin(club.id, applicationNote)
                                }
                                disabled={joining === club.id}
                              >
                                {joining === club.id ? (
                                  <Loader2 className="size-3 animate-spin" />
                                ) : null}
                                Submit Application
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs text-text-light"
                                onClick={() => {
                                  setApplyingTo(null);
                                  setApplicationNote("");
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 border-river/30 text-xs text-river hover:bg-river/5"
                            onClick={() => setApplyingTo(club.id)}
                            disabled={!canJoin || joining === club.id}
                            title={
                              !canJoin
                                ? "You already have a home club or pending request"
                                : undefined
                            }
                          >
                            Request to Join
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
