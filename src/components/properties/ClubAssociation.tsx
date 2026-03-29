"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  Send,
  CheckCircle2,
  Clock,
  Users,
  Mail,
  XCircle,
  Building2,
} from "lucide-react";

interface Invitation {
  id: string;
  club_name: string;
  admin_email: string;
  status: string;
  created_at: string;
}

interface ClubAccess {
  id: string;
  status: string;
  approved_at: string | null;
  created_at: string;
  clubs: {
    id: string;
    name: string;
    location: string | null;
  } | null;
}

interface ClubAssociationProps {
  propertyId: string | undefined;
  onEnsureSaved: () => Promise<string | null>;
  onInvitationSent?: () => void;
}

export default function ClubAssociation({
  propertyId,
  onEnsureSaved,
  onInvitationSent,
}: ClubAssociationProps) {
  const [clubName, setClubName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [associations, setAssociations] = useState<ClubAccess[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!propertyId) return;
    setLoading(true);
    try {
      // Fetch both invitations and club associations in parallel
      const [invRes, assocRes] = await Promise.all([
        fetch(`/api/clubs/invite?property_id=${propertyId}`),
        fetch(`/api/properties/${propertyId}/clubs`),
      ]);

      if (invRes.ok) {
        const data = await invRes.json();
        setInvitations(data.invitations ?? []);
      }

      if (assocRes.ok) {
        const data = await assocRes.json();
        setAssociations(data.associations ?? []);
      }
    } catch {
      // Silent fail on fetch
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleSendInvite() {
    setError(null);
    setSuccess(null);

    if (!clubName.trim()) {
      setError("Please enter the club name.");
      return;
    }
    if (!adminEmail.trim()) {
      setError("Please enter the club admin's email address.");
      return;
    }

    setSending(true);

    try {
      // Ensure property is saved first
      let pid: string | undefined | null = propertyId;
      if (!pid) {
        pid = await onEnsureSaved();
        if (!pid) {
          setError(
            "Please enter a property name and save before inviting a club."
          );
          setSending(false);
          return;
        }
      }

      const res = await fetch("/api/clubs/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: pid,
          club_name: clubName.trim(),
          admin_email: adminEmail.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to send invitation");
        setSending(false);
        return;
      }

      setSuccess(
        `Invitation sent to ${adminEmail} for ${clubName}. They'll receive an email with instructions to set up their club on AnglerPass.`
      );
      setClubName("");
      setAdminEmail("");
      onInvitationSent?.();

      // Refresh data
      if (pid) {
        const listRes = await fetch(
          `/api/clubs/invite?property_id=${pid}`
        );
        if (listRes.ok) {
          const listData = await listRes.json();
          setInvitations(listData.invitations ?? []);
        }
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setSending(false);
    }
  }

  const INVITATION_STATUS: Record<
    string,
    { label: string; icon: typeof CheckCircle2; color: string }
  > = {
    sent: { label: "Invitation Sent", icon: Clock, color: "text-bronze" },
    accepted: {
      label: "Club Created",
      icon: CheckCircle2,
      color: "text-forest",
    },
    declined: { label: "Declined", icon: XCircle, color: "text-red-500" },
    expired: { label: "Expired", icon: Clock, color: "text-text-light" },
  };

  const ACCESS_STATUS: Record<
    string,
    { label: string; icon: typeof CheckCircle2; color: string }
  > = {
    pending: {
      label: "Pending Club Approval",
      icon: Clock,
      color: "text-bronze",
    },
    approved: {
      label: "Associated",
      icon: CheckCircle2,
      color: "text-forest",
    },
    declined: { label: "Declined", icon: XCircle, color: "text-red-500" },
  };

  // Filter invitations to only show those NOT yet linked to a club association
  // (accepted invitations will have a corresponding club_property_access record)
  const associatedClubIds = new Set(
    associations.map((a) => a.clubs?.id).filter(Boolean)
  );
  const pendingInvitations = invitations.filter(
    (inv) => inv.status === "sent" || inv.status === "expired"
  );
  const hasAssociationsOrInvitations =
    associations.length > 0 || invitations.length > 0;

  return (
    <Card className="border-stone-light/20">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-river/10">
            <Users className="size-4 text-river" />
          </div>
          <div>
            <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
              Club Association
            </CardTitle>
            <p className="mt-1 text-xs text-text-light">
              Every property must be associated with at least one fly fishing
              club before it can be submitted for review. Clubs serve as the
              trust layer — vetting anglers who book access to your water.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Active club associations */}
        {associations.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-text-primary">
              Associated Clubs
            </p>
            <div className="space-y-2">
              {associations.map((assoc) => {
                const config =
                  ACCESS_STATUS[assoc.status] ?? ACCESS_STATUS.pending;
                const Icon = config.icon;
                return (
                  <div
                    key={assoc.id}
                    className="flex items-center justify-between rounded-lg border border-stone-light/20 bg-offwhite/50 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <Building2 className="size-4 text-river" />
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {assoc.clubs?.name ?? "Unknown Club"}
                        </p>
                        {assoc.clubs?.location && (
                          <p className="text-xs text-text-light">
                            {assoc.clubs.location}
                          </p>
                        )}
                      </div>
                    </div>
                    <div
                      className={`flex items-center gap-1.5 text-xs font-medium ${config.color}`}
                    >
                      <Icon className="size-3.5" />
                      {config.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pending invitations (not yet accepted) */}
        {pendingInvitations.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-text-primary">
              Pending Invitations
            </p>
            <div className="space-y-2">
              {pendingInvitations.map((inv) => {
                const config =
                  INVITATION_STATUS[inv.status] ?? INVITATION_STATUS.sent;
                const Icon = config.icon;
                return (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between rounded-lg border border-dashed border-stone-light/30 bg-parchment/20 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <Mail className="size-4 text-text-light" />
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {inv.club_name}
                        </p>
                        <p className="text-xs text-text-light">
                          {inv.admin_email}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`flex items-center gap-1.5 text-xs font-medium ${config.color}`}
                    >
                      <Icon className="size-3.5" />
                      {config.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {loading && !hasAssociationsOrInvitations && (
          <div className="flex items-center gap-2 text-sm text-text-light">
            <Loader2 className="size-4 animate-spin" />
            Loading club associations...
          </div>
        )}

        {/* Invite form */}
        <div className="space-y-4 rounded-lg border border-dashed border-stone-light/30 bg-parchment/30 p-4">
          <p className="text-sm font-medium text-text-primary">
            {hasAssociationsOrInvitations
              ? "Invite Another Club"
              : "Invite Your Club"}
          </p>
          <p className="text-xs text-text-light">
            Enter your club&apos;s name and the club administrator&apos;s email.
            We&apos;ll send them an invitation to join AnglerPass and associate
            with this property.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="club_name">Club Name</Label>
              <Input
                id="club_name"
                placeholder="e.g. South Platte Anglers Club"
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
                disabled={sending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin_email">Club Admin Email</Label>
              <Input
                id="admin_email"
                type="email"
                placeholder="e.g. admin@southplatteanglers.com"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                disabled={sending}
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          {success && (
            <div className="flex items-start gap-2 rounded-md border border-forest/20 bg-forest/5 px-3 py-2.5">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-forest" />
              <p className="text-sm text-forest">{success}</p>
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            className="border-river text-river hover:bg-river/5"
            onClick={handleSendInvite}
            disabled={sending}
          >
            {sending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            Send Invitation
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
