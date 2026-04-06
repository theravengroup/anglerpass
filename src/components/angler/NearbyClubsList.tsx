"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  MapPin,
  Compass,
  Users,
  Clock,
  CheckCircle2,
} from "lucide-react";

interface NearbyClub {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  logo_url: string | null;
  member_count: number;
  membership_status: string | null;
  is_member: boolean;
}

export default function NearbyClubsList() {
  const [clubs, setClubs] = useState<NearbyClub[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);
  const [applyingTo, setApplyingTo] = useState<string | null>(null);
  const [applicationNote, setApplicationNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [noLocation, setNoLocation] = useState(false);

  const fetchNearby = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/clubs/browse?near_me=true");
      if (res.ok) {
        const data = await res.json();
        const results = data.clubs ?? [];
        setClubs(results);
        // If no clubs returned, might be because profile has no location
        if (results.length === 0) {
          setNoLocation(true);
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNearby();
  }, [fetchNearby]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-bronze" />
      </div>
    );
  }

  if (noLocation && clubs.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <MapPin className="size-8 text-text-light" />
        <div>
          <p className="text-sm font-medium text-text-primary">
            Add your location to see nearby clubs
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            Update your profile with your city or state, and we&rsquo;ll show
            you fishing clubs in your area.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-1 border-bronze/30 text-bronze hover:bg-bronze/5"
          onClick={() => {
            window.location.href = "/angler/settings";
          }}
        >
          Update Profile
        </Button>
      </div>
    );
  }

  if (clubs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-8">
        <Compass className="size-8 text-text-light" />
        <p className="text-sm text-text-secondary">
          No clubs found in your area yet. Try searching by name or inviting
          your club!
        </p>
      </div>
    );
  }

  const hasPending = clubs.some((c) => c.membership_status === "pending");
  const hasActive = clubs.some((c) => c.membership_status === "active");

  return (
    <div className="space-y-3">
      <p className="text-sm text-text-secondary">
        Clubs near your profile location:
      </p>

      {message && (
        <div className="rounded-lg border border-forest/20 bg-forest/5 px-4 py-3 text-sm text-forest" role="alert" aria-live="polite">
          {message}
        </div>
      )}

      <div className="space-y-3">
        {clubs.map((club) => {
          const isActive = club.membership_status === "active";
          const isPending = club.membership_status === "pending";
          const canJoin = !hasActive && !hasPending && !isActive && !isPending;

          return (
            <div
              key={club.id}
              className={`flex items-start gap-3 rounded-lg border bg-white px-4 py-3 ${
                isActive ? "border-river/30 ring-1 ring-river/20" : "border-stone-light/20"
              }`}
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-river/10 text-sm font-semibold text-river">
                {club.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-medium text-text-primary">
                  {club.name}
                </h4>
                {club.location && (
                  <p className="flex items-center gap-1 text-xs text-text-light">
                    <MapPin className="size-3" />
                    {club.location}
                  </p>
                )}
                {club.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-text-secondary">
                    {club.description}
                  </p>
                )}
                <div className="mt-2 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-xs text-text-light">
                    <Users className="size-3" />
                    {club.member_count} member
                    {club.member_count !== 1 ? "s" : ""}
                  </span>

                  {isActive ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-forest">
                      <CheckCircle2 className="size-3.5" />
                      Member
                    </span>
                  ) : isPending ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-bronze">
                      <Clock className="size-3.5" />
                      Pending
                    </span>
                  ) : applyingTo === club.id ? (
                    <div className="flex w-full flex-col gap-2 pt-1">
                      <textarea
                        value={applicationNote}
                        onChange={(e) => setApplicationNote(e.target.value)}
                        placeholder="Tell the club about yourself (optional)..."
                        maxLength={2000}
                        rows={2}
                        className="w-full resize-none rounded-md border border-stone-light/40 bg-white px-2.5 py-2 text-xs text-text-primary placeholder:text-text-light focus:border-river focus:outline-none"
                      />
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          className="h-7 flex-1 bg-river text-xs text-white hover:bg-river/90"
                          onClick={() => handleJoin(club.id, applicationNote)}
                          disabled={joining === club.id}
                        >
                          {joining === club.id ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : null}
                          Submit
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
          );
        })}
      </div>
    </div>
  );
}
