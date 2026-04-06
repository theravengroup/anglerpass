"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Handshake,
  Loader2,
  CheckCircle2,
  XCircle,
  MapPin,
  Star,
  CalendarDays,
} from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { AFFILIATION_STATUS } from "@/lib/constants/status";

interface GuideProfile {
  id: string;
  user_id: string;
  display_name: string;
  profile_photo_url: string | null;
  base_location: string | null;
  rating_avg: number;
  rating_count: number;
  trips_completed: number;
}

interface Affiliation {
  id: string;
  guide_id: string;
  status: string;
  label: string | null;
  created_at: string;
  updated_at: string;
  guide_profiles: GuideProfile;
}

interface ClubGuideAffiliationsProps {
  clubId: string;
}

export default function ClubGuideAffiliations({
  clubId,
}: ClubGuideAffiliationsProps) {
  const [affiliations, setAffiliations] = useState<Affiliation[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function fetchAffiliations() {
    try {
      const res = await fetch(`/api/clubs/${clubId}/guide-affiliations`);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId]);

  async function handleAction(
    affiliationId: string,
    status: "active" | "rejected"
  ) {
    setUpdating(affiliationId);
    setError("");
    try {
      const res = await fetch(
        `/api/clubs/${clubId}/guide-affiliations/${affiliationId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        setAffiliations((prev) =>
          prev.map((a) =>
            a.id === affiliationId
              ? { ...a, status: data.affiliation.status }
              : a
          )
        );
      } else {
        const data = await res.json();
        setError(data.error ?? "Failed to update affiliation.");
      }
    } catch {
      setError("Failed to update affiliation.");
    } finally {
      setUpdating(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-river" />
      </div>
    );
  }

  const pending = affiliations.filter((a) => a.status === "pending");
  const active = affiliations.filter((a) => a.status === "active");
  const other = affiliations.filter(
    (a) => a.status !== "pending" && a.status !== "active"
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-heading text-lg font-semibold text-text-primary">
          Guide Affiliations
        </h3>
        <p className="text-sm text-text-secondary">
          Manage guides affiliated with your club.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-500" role="alert" aria-live="polite">
          {error}
        </p>
      )}

      {affiliations.length === 0 ? (
        <EmptyState
          icon={Handshake}
          title="No guide affiliations"
          description="Guides can request to affiliate with your club. Pending requests will appear here."
          iconColor="text-river"
        />
      ) : (
        <>
          {/* Pending requests */}
          {pending.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-text-secondary">
                Pending Requests ({pending.length})
              </h4>
              {pending.map((aff) => (
                <AffiliationCard
                  key={aff.id}
                  affiliation={aff}
                  updating={updating === aff.id}
                  onApprove={() => handleAction(aff.id, "active")}
                  onReject={() => handleAction(aff.id, "rejected")}
                  showActions
                />
              ))}
            </div>
          )}

          {/* Active guides */}
          {active.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-text-secondary">
                Active Guides ({active.length})
              </h4>
              {active.map((aff) => (
                <AffiliationCard key={aff.id} affiliation={aff} />
              ))}
            </div>
          )}

          {/* Rejected / revoked */}
          {other.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-text-secondary">
                Past Requests ({other.length})
              </h4>
              {other.map((aff) => (
                <AffiliationCard key={aff.id} affiliation={aff} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Affiliation Card ─────────────────────────────────────────────

function AffiliationCard({
  affiliation,
  updating = false,
  onApprove,
  onReject,
  showActions = false,
}: {
  affiliation: Affiliation;
  updating?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  showActions?: boolean;
}) {
  const guide = affiliation.guide_profiles;

  return (
    <Card className="border-stone-light/20">
      <CardContent className="flex items-center gap-4 py-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-charcoal/10">
          <Handshake className="size-5 text-charcoal" />
        </div>
        <div className="min-w-0 grow">
          <p className="truncate text-sm font-medium text-text-primary">
            {guide.display_name}
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-text-light">
            {guide.base_location && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3" />
                {guide.base_location}
              </span>
            )}
            {guide.rating_count > 0 && (
              <span className="flex items-center gap-1">
                <Star className="size-3" />
                {guide.rating_avg.toFixed(1)} ({guide.rating_count})
              </span>
            )}
            <span className="flex items-center gap-1">
              <CalendarDays className="size-3" />
              {guide.trips_completed} trips
            </span>
          </div>
        </div>

        <StatusBadge status={affiliation.status} config={AFFILIATION_STATUS} />

        {showActions && (
          <div className="flex shrink-0 gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-forest/20 text-forest hover:bg-forest/5"
              disabled={updating}
              onClick={onApprove}
              aria-label={`Approve ${guide.display_name}`}
            >
              {updating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  Approve
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-red-200 text-red-500 hover:bg-red-50"
              disabled={updating}
              onClick={onReject}
              aria-label={`Reject ${guide.display_name}`}
            >
              <XCircle className="size-4" />
              Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
