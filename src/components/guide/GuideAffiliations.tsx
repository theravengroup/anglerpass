"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Handshake,
  Plus,
  Search,
  Loader2,
  Trash2,
  MapPin,
} from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { AFFILIATION_STATUS } from "@/lib/constants/status";

interface ClubInfo {
  id: string;
  name: string;
  logo_url: string | null;
  location: string | null;
}

interface Affiliation {
  id: string;
  club_id: string;
  status: string;
  label: string | null;
  created_at: string;
  clubs: ClubInfo;
}

interface BrowseClub {
  id: string;
  name: string;
  location: string | null;
  logo_url: string | null;
  description: string | null;
}

export default function GuideAffiliations() {
  const [affiliations, setAffiliations] = useState<Affiliation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  async function fetchAffiliations() {
    try {
      const res = await fetch("/api/guides/affiliations");
      if (res.ok) {
        const data = await res.json();
        setAffiliations(data.affiliations ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAffiliations();
  }, []);

  async function handleRemove(affiliationId: string) {
    try {
      const res = await fetch(`/api/guides/affiliations/${affiliationId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setAffiliations((prev) => prev.filter((a) => a.id !== affiliationId));
      }
    } catch {
      // silent
    }
  }

  function handleRequested(newAffiliation: Affiliation) {
    setAffiliations((prev) => [newAffiliation, ...prev]);
    setDialogOpen(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-charcoal" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading text-lg font-semibold text-text-primary">
            Club Affiliations
          </h3>
          <p className="text-sm text-text-secondary">
            Affiliate with clubs to guide on their waters.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="border-charcoal/20 text-charcoal hover:bg-charcoal/5"
            >
              <Plus className="size-4" />
              Request Affiliation
            </Button>
          </DialogTrigger>
          <ClubSearchDialog
            existingClubIds={affiliations.map((a) => a.club_id)}
            onRequested={handleRequested}
          />
        </Dialog>
      </div>

      {affiliations.length === 0 ? (
        <EmptyState
          icon={Handshake}
          title="No affiliations yet"
          description="Request affiliation with a club to be approved for guiding on their properties."
          iconColor="text-charcoal"
        />
      ) : (
        <div className="space-y-3">
          {affiliations.map((aff) => (
            <Card key={aff.id} className="border-stone-light/20">
              <CardContent className="flex items-center gap-4 py-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-charcoal/10">
                  <Handshake className="size-5 text-charcoal" />
                </div>
                <div className="min-w-0 grow">
                  <p className="truncate text-sm font-medium text-text-primary">
                    {aff.clubs.name}
                  </p>
                  {aff.clubs.location && (
                    <p className="flex items-center gap-1 text-xs text-text-light">
                      <MapPin className="size-3" />
                      {aff.clubs.location}
                    </p>
                  )}
                </div>
                <StatusBadge
                  status={aff.status}
                  config={AFFILIATION_STATUS}
                />
                {(aff.status === "pending" || aff.status === "active") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-text-light hover:text-red-500"
                    onClick={() => handleRemove(aff.id)}
                    aria-label={`Remove affiliation with ${aff.clubs.name}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Club Search Dialog ───────────────────────────────────────────

function ClubSearchDialog({
  existingClubIds,
  onRequested,
}: {
  existingClubIds: string[];
  onRequested: (affiliation: Affiliation) => void;
}) {
  const [query, setQuery] = useState("");
  const [clubs, setClubs] = useState<BrowseClub[]>([]);
  const [searching, setSearching] = useState(false);
  const [requesting, setRequesting] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleSearch() {
    if (!query.trim()) return;
    setSearching(true);
    setError("");
    try {
      const res = await fetch(
        `/api/clubs/browse?q=${encodeURIComponent(query.trim())}`
      );
      if (res.ok) {
        const data = await res.json();
        const filtered = (data.clubs ?? []).filter(
          (c: BrowseClub) => !existingClubIds.includes(c.id)
        );
        setClubs(filtered);
        if (filtered.length === 0) {
          setError("No clubs found matching your search.");
        }
      }
    } catch {
      setError("Failed to search clubs.");
    } finally {
      setSearching(false);
    }
  }

  async function handleRequest(clubId: string) {
    setRequesting(clubId);
    setError("");
    try {
      const res = await fetch("/api/guides/affiliations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ club_id: clubId }),
      });

      if (res.ok) {
        const data = await res.json();
        onRequested(data.affiliation);
      } else {
        const data = await res.json();
        setError(data.error ?? "Failed to request affiliation.");
      }
    } catch {
      setError("Failed to request affiliation.");
    } finally {
      setRequesting(null);
    }
  }

  return (
    <DialogContent
      className="sm:max-w-md"
      aria-label="Search for a club to affiliate with"
    >
      <DialogHeader>
        <DialogTitle>Request Club Affiliation</DialogTitle>
        <DialogDescription>
          Search for a club and send an affiliation request. The club manager
          will review your request.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
        >
          <Input
            placeholder="Search clubs by name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="grow"
          />
          <Button
            type="submit"
            variant="outline"
            size="sm"
            disabled={searching || !query.trim()}
          >
            {searching ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Search className="size-4" />
            )}
          </Button>
        </form>

        {error && (
          <p className="text-sm text-red-500" role="alert" aria-live="polite">
            {error}
          </p>
        )}

        {clubs.length > 0 && (
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {clubs.map((club) => (
              <div
                key={club.id}
                className="flex items-center justify-between rounded-lg border border-stone-light/20 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text-primary">
                    {club.name}
                  </p>
                  {club.location && (
                    <p className="flex items-center gap-1 text-xs text-text-light">
                      <MapPin className="size-3" />
                      {club.location}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 border-charcoal/20 text-charcoal hover:bg-charcoal/5"
                  disabled={requesting === club.id}
                  onClick={() => handleRequest(club.id)}
                >
                  {requesting === club.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Request"
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </DialogContent>
  );
}
