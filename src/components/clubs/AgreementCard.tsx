"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2 } from "lucide-react";

interface PartnerClub {
  id: string;
  name: string;
  tier: string;
  location: string | null;
}

export interface Agreement {
  id: string;
  partnerClub: PartnerClub;
  status: "pending" | "active" | "revoked";
  proposedAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  isProposer: boolean;
}

interface AgreementCardProps {
  agreement: Agreement;
  actionLoading: string | null;
  onAccept: (id: string) => void;
  onRevoke: (id: string) => void;
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-forest/10 text-forest",
  pending: "bg-bronze/10 text-bronze",
  revoked: "bg-stone/10 text-stone",
};

const TIER_LABELS: Record<string, string> = {
  starter: "Starter",
  standard: "Standard",
  pro: "Pro",
};

export default function AgreementCard({
  agreement,
  actionLoading,
  onAccept,
  onRevoke,
}: AgreementCardProps) {
  const { partnerClub, status, isProposer } = agreement;
  const isLoading = actionLoading === agreement.id;

  return (
    <Card className="border-stone-light/20">
      <CardContent className="flex items-center justify-between py-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-text-primary">
              {partnerClub.name}
            </p>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                STATUS_STYLES[status] ?? STATUS_STYLES.revoked
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
            <span className="text-xs text-text-light">
              {TIER_LABELS[partnerClub.tier] ?? partnerClub.tier}
            </span>
          </div>
          {partnerClub.location && (
            <div className="flex items-center gap-1 text-xs text-text-secondary">
              <MapPin className="size-3" />
              {partnerClub.location}
            </div>
          )}
          {status === "pending" && isProposer && (
            <p className="text-xs text-text-light">
              Pending -- waiting for acceptance
            </p>
          )}
          {status === "pending" && !isProposer && (
            <p className="text-xs text-bronze">
              This club proposed a partnership with you
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {isLoading && <Loader2 className="size-4 animate-spin text-river" />}

          {status === "active" && (
            <Button
              variant="outline"
              size="sm"
              disabled={isLoading}
              onClick={() => onRevoke(agreement.id)}
            >
              Revoke
            </Button>
          )}

          {status === "pending" && isProposer && (
            <Button
              variant="outline"
              size="sm"
              disabled={isLoading}
              onClick={() => onRevoke(agreement.id)}
            >
              Cancel
            </Button>
          )}

          {status === "pending" && !isProposer && (
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={isLoading}
                onClick={() => onRevoke(agreement.id)}
              >
                Decline
              </Button>
              <Button
                size="sm"
                className="bg-river text-white hover:bg-river/90"
                disabled={isLoading}
                onClick={() => onAccept(agreement.id)}
              >
                Accept
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
