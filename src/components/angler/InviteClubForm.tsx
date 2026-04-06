"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Send,
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface Invitation {
  id: string;
  club_name: string;
  admin_email: string;
  status: string;
  created_at: string;
}

interface InviteClubFormProps {
  existingInvitations: Invitation[];
}

export default function InviteClubForm({
  existingInvitations,
}: InviteClubFormProps) {
  const [clubName, setClubName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminName, setAdminName] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [invitations, setInvitations] =
    useState<Invitation[]>(existingInvitations);

  const pendingInvitations = invitations.filter((i) => i.status === "sent");
  const acceptedInvitations = invitations.filter(
    (i) => i.status === "accepted"
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSending(true);

    try {
      const res = await fetch("/api/anglers/invite-club", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          club_name: clubName,
          admin_email: adminEmail,
          admin_name: adminName || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to send invitation");
        return;
      }

      const data = await res.json();
      setInvitations((prev) => [
        {
          id: data.invitation.id,
          club_name: clubName,
          admin_email: adminEmail,
          status: "sent",
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
      setSuccess(true);
      setClubName("");
      setAdminEmail("");
      setAdminName("");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-secondary">
        Know your club&rsquo;s admin? Send them an invitation to join
        AnglerPass. We&rsquo;ll follow up with them on your behalf.
      </p>

      {/* Pending invitations */}
      {pendingInvitations.length > 0 && (
        <div className="space-y-2">
          {pendingInvitations.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center gap-3 rounded-lg border border-river/10 bg-white px-4 py-3"
            >
              <Clock className="size-4 shrink-0 text-river" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text-primary">
                  {inv.club_name}
                </p>
                <p className="text-xs text-text-light">
                  Invitation sent to {inv.admin_email}
                </p>
              </div>
              <span className="rounded-full bg-river/10 px-2 py-0.5 text-xs font-medium text-river">
                Waiting
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Accepted invitations */}
      {acceptedInvitations.length > 0 && (
        <div className="space-y-2">
          {acceptedInvitations.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center gap-3 rounded-lg border border-forest/10 bg-white px-4 py-3"
            >
              <CheckCircle2 className="size-4 shrink-0 text-forest" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text-primary">
                  {inv.club_name}
                </p>
                <p className="text-xs text-text-light">
                  Club joined — you&rsquo;re a member!
                </p>
              </div>
              <span className="rounded-full bg-forest/10 px-2 py-0.5 text-xs font-medium text-forest">
                Active
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-forest/20 bg-forest/5 px-4 py-3">
          <CheckCircle2 className="size-4 text-forest" />
          <p className="text-sm text-forest">
            Invitation sent! We&rsquo;ll notify you when your club joins.
          </p>
        </div>
      )}

      {/* Invitation form */}
      {!success && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label
              htmlFor="invite-club-name"
              className="text-xs font-medium text-text-secondary"
            >
              Club name
            </Label>
            <Input
              id="invite-club-name"
              placeholder="e.g. Rocky Mountain Angling Club"
              value={clubName}
              onChange={(e) => setClubName(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label
              htmlFor="invite-admin-email"
              className="text-xs font-medium text-text-secondary"
            >
              Club admin&rsquo;s email
            </Label>
            <Input
              id="invite-admin-email"
              type="email"
              placeholder="admin@fishingclub.com"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label
              htmlFor="invite-admin-name"
              className="text-xs font-medium text-text-secondary"
            >
              Admin&rsquo;s name{" "}
              <span className="text-text-light">(optional)</span>
            </Label>
            <Input
              id="invite-admin-name"
              placeholder="e.g. John Smith"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              className="mt-1"
            />
          </div>

          {error && (
            <div
              className="flex items-center gap-2 text-sm text-red-600"
              role="alert"
              aria-live="polite"
            >
              <AlertCircle className="size-4" />
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={sending}
            className="w-full bg-river text-white hover:bg-river/90"
          >
            {sending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 size-4" />
                Invite Your Club
              </>
            )}
          </Button>
        </form>
      )}

      {/* Send another */}
      {success && (
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={() => setSuccess(false)}
        >
          Invite Another Club
        </Button>
      )}
    </div>
  );
}
