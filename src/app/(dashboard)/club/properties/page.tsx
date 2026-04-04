"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  Droplets,
  Plus,
  Upload,
  Mail,
  MailCheck,
  Send,
} from "lucide-react";
import { WATER_TYPE_LABELS } from "@/lib/constants/water-types";
import { FetchError } from "@/components/shared/FetchError";
import InviteLandownerModal from "@/components/properties/InviteLandownerModal";

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

interface ClubCreatedProperty {
  id: string;
  name: string;
  location_description: string | null;
  water_type: string | null;
  photos: string[] | null;
  status: string;
  owner_id: string | null;
  invitation?: {
    id: string;
    status: string;
    landowner_email: string;
    reminder_count: number;
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
  const [clubCreated, setClubCreated] = useState<ClubCreatedProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [clubId, setClubId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);

  async function fetchProperties(cid: string) {
    try {
      const [accessRes, createdRes] = await Promise.all([
        fetch(`/api/clubs/${cid}/properties`),
        fetch(`/api/clubs/${cid}/properties/created`),
      ]);

      if (accessRes.ok) {
        const data = await accessRes.json();
        setProperties(data.properties ?? []);
      }
      if (createdRes.ok) {
        const data = await createdRes.json();
        setClubCreated(data.properties ?? []);
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
        await fetchProperties(cid);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleResendInvitation(propertyId: string) {
    setResendingId(propertyId);
    try {
      await fetch(`/api/properties/${propertyId}/resend-invitation`, {
        method: "POST",
      });
      if (clubId) await fetchProperties(clubId);
    } catch {
      // Silent fail
    } finally {
      setResendingId(null);
    }
  }

  useEffect(() => {
    init();
  }, []);

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

  const unclaimedProperties = clubCreated.filter((p) => !p.owner_id);
  const claimedProperties = clubCreated.filter((p) => p.owner_id);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
            Properties
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Manage property associations and create properties on behalf of
            landowners.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/club/properties/import">
              <Upload className="mr-1 size-3.5" />
              Import CSV
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/club/properties/new">
              <Plus className="mr-1 size-3.5" />
              Add Property
            </Link>
          </Button>
        </div>
      </div>

      {/* Club-created properties awaiting landowner claim */}
      {unclaimedProperties.length > 0 && (
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-medium text-river">
            <Mail className="size-4" />
            Awaiting Landowner Claim ({unclaimedProperties.length})
          </h3>
          {unclaimedProperties.map((property) => (
            <Card key={property.id} className="border-stone-light/20">
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-offwhite">
                    {property.photos?.[0] ? (
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
                    {property.invitation ? (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-river">
                        <MailCheck className="size-3" />
                        Invited: {property.invitation.landowner_email}
                        {property.invitation.reminder_count > 0 && (
                          <span className="text-text-light">
                            ({property.invitation.reminder_count} reminder
                            {property.invitation.reminder_count !== 1
                              ? "s"
                              : ""}{" "}
                            sent)
                          </span>
                        )}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-xs text-bronze">
                        No invitation sent yet
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {property.invitation ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      disabled={resendingId === property.id}
                      onClick={() => handleResendInvitation(property.id)}
                    >
                      {resendingId === property.id ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <>
                          <Send className="mr-1 size-3" />
                          Resend
                        </>
                      )}
                    </Button>
                  ) : (
                    <InviteLandownerModal
                      propertyId={property.id}
                      propertyName={property.name}
                      trigger={
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                        >
                          <Mail className="mr-1 size-3" />
                          Invite Landowner
                        </Button>
                      }
                      onInviteSent={() => {
                        if (clubId) fetchProperties(clubId);
                      }}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
      {properties.length === 0 && clubCreated.length === 0 && (
        <Card className="border-stone-light/20">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex size-14 items-center justify-center rounded-full bg-bronze/10">
              <MapPin className="size-6 text-bronze" />
            </div>
            <h3 className="mt-4 text-base font-medium text-text-primary">
              No properties yet
            </h3>
            <p className="mt-1 max-w-sm text-center text-sm text-text-secondary">
              Add properties on behalf of your landowners, import from CSV, or
              wait for landowners to invite your club.
            </p>
            <div className="mt-4 flex gap-2">
              <Button asChild size="sm">
                <Link href="/club/properties/new">
                  <Plus className="mr-1 size-3.5" />
                  Add Property
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/club/properties/import">
                  <Upload className="mr-1 size-3.5" />
                  Import CSV
                </Link>
              </Button>
            </div>
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
