"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Send, CheckCircle2 } from "lucide-react";

interface ClubInviteFormProps {
  propertyId: string | undefined;
  hasExisting: boolean;
  onEnsureSaved: () => Promise<string | null>;
  onInvitationSent?: () => void;
  onInvitationsRefreshed?: (invitations: Array<{
    id: string;
    club_name: string;
    admin_email: string;
    status: string;
    created_at: string;
  }>) => void;
}

export default function ClubInviteForm({
  propertyId,
  hasExisting,
  onEnsureSaved,
  onInvitationSent,
  onInvitationsRefreshed,
}: ClubInviteFormProps) {
  const [clubName, setClubName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
          onInvitationsRefreshed?.(listData.invitations ?? []);
        }
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-dashed border-stone-light/30 bg-parchment/30 p-4">
      <p className="text-sm font-medium text-text-primary">
        {hasExisting ? "Invite Another Club" : "Invite Your Club"}
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
  );
}
