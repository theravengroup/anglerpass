"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Send, CheckCircle2, Clock, Users, Mail } from "lucide-react";

interface Invitation {
  id: string;
  club_name: string;
  admin_email: string;
  status: string;
  created_at: string;
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
  const [loading, setLoading] = useState(false);

  const fetchInvitations = useCallback(async () => {
    if (!propertyId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/clubs/invite?property_id=${propertyId}`
      );
      if (res.ok) {
        const data = await res.json();
        setInvitations(data.invitations ?? []);
      }
    } catch {
      // Silent fail on fetch
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

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

      // Refresh the invitations list
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

  const STATUS_CONFIG: Record<
    string,
    { label: string; icon: typeof CheckCircle2; color: string }
  > = {
    sent: { label: "Invitation Sent", icon: Clock, color: "text-bronze" },
    accepted: {
      label: "Accepted",
      icon: CheckCircle2,
      color: "text-forest",
    },
    declined: { label: "Declined", icon: Mail, color: "text-red-500" },
    expired: { label: "Expired", icon: Clock, color: "text-text-light" },
  };

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
        {/* Existing invitations */}
        {invitations.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-text-primary">
              Club Invitations
            </p>
            <div className="space-y-2">
              {invitations.map((inv) => {
                const config = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.sent;
                const Icon = config.icon;
                return (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between rounded-lg border border-stone-light/20 bg-offwhite/50 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {inv.club_name}
                      </p>
                      <p className="text-xs text-text-light">
                        {inv.admin_email}
                      </p>
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

        {loading && invitations.length === 0 && (
          <div className="flex items-center gap-2 text-sm text-text-light">
            <Loader2 className="size-4 animate-spin" />
            Loading invitations...
          </div>
        )}

        {/* Invite form */}
        <div className="space-y-4 rounded-lg border border-dashed border-stone-light/30 bg-parchment/30 p-4">
          <p className="text-sm font-medium text-text-primary">
            {invitations.length > 0 ? "Invite Another Club" : "Invite Your Club"}
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

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

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
