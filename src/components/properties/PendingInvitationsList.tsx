"use client";

import { CheckCircle2, Clock, XCircle, Mail } from "lucide-react";

interface Invitation {
  id: string;
  club_name: string;
  admin_email: string;
  status: string;
  created_at: string;
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

interface PendingInvitationsListProps {
  invitations: Invitation[];
}

export default function PendingInvitationsList({
  invitations,
}: PendingInvitationsListProps) {
  const pendingInvitations = invitations.filter(
    (inv) => inv.status === "sent" || inv.status === "expired"
  );

  if (pendingInvitations.length === 0) return null;

  return (
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
  );
}
