"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { MEMBERSHIP_STATUS } from "@/lib/constants/status";
import { Users, Loader2, RefreshCw, Mail } from "lucide-react";
import type { Invitation } from "./corporate-invite-utils";

// ─── Types ──────────────────────────────────────────────────────────

interface CorporateInvitationsTableProps {
  invitations: Invitation[];
  loading: boolean;
  resendingId: string | null;
  onResendInvitation: (invitationId: string) => void;
}

// ─── Component ──────────────────────────────────────────────────────

export function CorporateInvitationsTable({
  invitations,
  loading,
  resendingId,
  onResendInvitation,
}: CorporateInvitationsTableProps) {
  const pendingInvitations = invitations.filter(
    (inv) => inv.status === "pending"
  );
  const acceptedInvitations = invitations.filter(
    (inv) => inv.status === "accepted"
  );

  return (
    <Card className="border-stone-light/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail className="size-4 text-river" />
          Invited Employees
        </CardTitle>
        <CardDescription>
          {invitations.length > 0
            ? `${acceptedInvitations.length} accepted, ${pendingInvitations.length} pending`
            : "No invitations sent yet"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-5 animate-spin text-river" />
          </div>
        ) : invitations.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No Invitations Yet"
            description="Invite employees above to get started. They'll receive an email with a link to join the club."
            iconColor="text-river"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" aria-label="Invited employees">
              <thead>
                <tr className="border-b border-stone-light/15">
                  <th className="pb-2 text-left text-xs font-medium text-text-light">
                    Email
                  </th>
                  <th className="pb-2 text-left text-xs font-medium text-text-light">
                    Status
                  </th>
                  <th className="pb-2 text-left text-xs font-medium text-text-light">
                    Invited
                  </th>
                  <th className="pb-2 text-left text-xs font-medium text-text-light">
                    Accepted
                  </th>
                  <th className="pb-2 text-right text-xs font-medium text-text-light">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-light/10">
                {invitations.map((inv) => (
                  <tr key={inv.id}>
                    <td className="py-3 text-sm text-text-primary">
                      {inv.email}
                    </td>
                    <td className="py-3">
                      <StatusBadge
                        status={inv.status}
                        config={MEMBERSHIP_STATUS}
                        fallbackKey="pending"
                      />
                    </td>
                    <td className="py-3 text-xs text-text-light">
                      {new Date(inv.invited_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 text-xs text-text-light">
                      {inv.accepted_at
                        ? new Date(inv.accepted_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )
                        : "\u2014"}
                    </td>
                    <td className="py-3 text-right">
                      {inv.status === "pending" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => onResendInvitation(inv.id)}
                          disabled={resendingId === inv.id}
                          aria-label={`Resend invitation to ${inv.email}`}
                        >
                          {resendingId === inv.id ? (
                            <Loader2 className="mr-1 size-3 animate-spin" />
                          ) : (
                            <RefreshCw className="mr-1 size-3" />
                          )}
                          Resend
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
