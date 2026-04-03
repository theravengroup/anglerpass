"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  Droplets,
} from "lucide-react";
import { WATER_TYPE_LABELS } from "@/lib/constants/water-types";
import { FetchError } from "@/components/shared/FetchError";

interface PropertyAccess {
  id: string;
  status: string;
  approved_at: string | null;
  created_at: string;
  properties: {
    id: string;
    name: string;
    location_description: string | null;
    water_type: string | null;
    photos: string[];
    status: string;
  } | null;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: typeof CheckCircle2; color: string; bg: string }
> = {
  approved: {
    label: "Approved",
    icon: CheckCircle2,
    color: "text-forest",
    bg: "bg-forest/10",
  },
  pending: {
    label: "Pending Approval",
    icon: Clock,
    color: "text-bronze",
    bg: "bg-bronze/10",
  },
  declined: {
    label: "Declined",
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-50",
  },
};

export default function ClubPropertiesPage() {
  const [properties, setProperties] = useState<PropertyAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [clubId, setClubId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchProperties = useCallback(async (cid: string) => {
    try {
      const res = await fetch(`/api/clubs/${cid}/properties`);
      if (res.ok) {
        const data = await res.json();
        setProperties(data.properties ?? []);
      }
    } catch {
      // Silent fail
    }
  }, []);

  const init = useCallback(async () => {
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
        await fetchProperties(cid);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [fetchProperties]);

  useEffect(() => {
    init();
  }, [init]);

  async function handleAction(accessId: string, status: "approved" | "declined") {
    if (!clubId) return;

    setActionLoading(accessId);
    try {
      const res = await fetch(
        `/api/clubs/${clubId}/properties/${accessId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );

      if (res.ok) {
        await fetchProperties(clubId);
      }
    } catch {
      // Silent fail
    } finally {
      setActionLoading(null);
    }
  }

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
        <FetchError message="Failed to load properties." onRetry={init} />
      </div>
    );
  }

  const pendingProperties = properties.filter((p) => p.status === "pending");
  const activeProperties = properties.filter((p) => p.status === "approved");
  const declinedProperties = properties.filter((p) => p.status === "declined");

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
          Properties
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Manage property associations for your club. Landowners invite your
          club to associate with their properties — approve or decline below.
        </p>
      </div>

      {/* Pending approvals */}
      {pendingProperties.length > 0 && (
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-medium text-bronze">
            <Clock className="size-4" />
            Pending Approval ({pendingProperties.length})
          </h3>
          {pendingProperties.map((access) => (
            <PropertyCard
              key={access.id}
              access={access}
              isLoading={actionLoading === access.id}
              onApprove={() => handleAction(access.id, "approved")}
              onDecline={() => handleAction(access.id, "declined")}
            />
          ))}
        </div>
      )}

      {/* Active properties */}
      {activeProperties.length > 0 && (
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-medium text-forest">
            <CheckCircle2 className="size-4" />
            Active Properties ({activeProperties.length})
          </h3>
          {activeProperties.map((access) => (
            <PropertyCard key={access.id} access={access} />
          ))}
        </div>
      )}

      {/* Declined */}
      {declinedProperties.length > 0 && (
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-medium text-text-light">
            <XCircle className="size-4" />
            Declined ({declinedProperties.length})
          </h3>
          {declinedProperties.map((access) => (
            <PropertyCard key={access.id} access={access} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {properties.length === 0 && (
        <Card className="border-stone-light/20">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex size-14 items-center justify-center rounded-full bg-bronze/10">
              <MapPin className="size-6 text-bronze" />
            </div>
            <h3 className="mt-4 text-base font-medium text-text-primary">
              No properties yet
            </h3>
            <p className="mt-1 max-w-sm text-center text-sm text-text-secondary">
              When a landowner invites your club to associate with their
              property, it will appear here for your approval.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PropertyCard({
  access,
  isLoading,
  onApprove,
  onDecline,
}: {
  access: PropertyAccess;
  isLoading?: boolean;
  onApprove?: () => void;
  onDecline?: () => void;
}) {
  const property = access.properties;
  if (!property) return null;

  const config = STATUS_CONFIG[access.status] ?? STATUS_CONFIG.pending;
  const Icon = config.icon;

  return (
    <Card className="border-stone-light/20">
      <CardContent className="flex items-center justify-between py-4">
        <div className="flex items-center gap-4">
          {/* Photo thumbnail */}
          <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-offwhite">
            {property.photos?.[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={property.photos[0]}
                alt={property.name}
                className="size-full object-cover"
              />
            ) : (
              <MapPin className="size-5 text-text-light" />
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-text-primary">
              {property.name}
            </p>
            {property.location_description && (
              <p className="text-xs text-text-light">
                {property.location_description}
              </p>
            )}
            {property.water_type && (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-text-light">
                <Droplets className="size-3" />
                {WATER_TYPE_LABELS[property.water_type] ?? property.water_type}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status badge */}
          <div
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.bg} ${config.color}`}
          >
            <Icon className="size-3" />
            {config.label}
          </div>

          {/* Actions for pending */}
          {access.status === "pending" && !isLoading && onApprove && onDecline && (
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                className="h-7 border-forest/30 text-xs text-forest hover:bg-forest/5"
                onClick={onApprove}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 border-red-200 text-xs text-red-500 hover:bg-red-50"
                onClick={onDecline}
              >
                Decline
              </Button>
            </div>
          )}

          {isLoading && (
            <Loader2 className="size-4 animate-spin text-text-light" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
