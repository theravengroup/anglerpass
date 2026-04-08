"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { MailOpen, Loader2, RotateCcw, XCircle } from "lucide-react";

interface Invitation {
  id: string;
  email: string;
  status: string;
  invited_at: string;
  accepted_at: string | null;
}

interface CorporateInvitationsPanelProps {
  invitations: Invitation[];
  revokingId: string | null;
  onRevoke: (id: string) => Promise<void>;
  onResend: (id: string) => Promise<void>;
}

const STATUS_CLASSES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  accepted: "bg-forest/10 text-forest",
  expired: "bg-stone-light/20 text-text-light",
};

function daysSince(dateStr: string): number {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function CorporateInvitationsPanel({
  invitations,
  revokingId,
  onRevoke,
  onResend,
}: CorporateInvitationsPanelProps) {
  const pending = invitations.filter((i) => i.status === "pending");
  const other = invitations.filter((i) => i.status !== "pending");
  const all = [...pending, ...other];

  return (
    <Card className="border-stone-light/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MailOpen className="size-4 text-bronze" />
          Invitations
        </CardTitle>
      </CardHeader>
      <CardContent>
        {all.length === 0 ? (
          <EmptyState
            icon={MailOpen}
            title="No invitations sent"
            description="Use the invite form below to add employees to your corporate membership."
            iconColor="text-bronze"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-light/20 text-left text-xs font-medium text-text-secondary">
                  <th className="pb-2 pr-4">Email</th>
                  <th className="pb-2 pr-4">Sent</th>
                  <th className="pb-2 pr-4">Days Remaining</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-light/10">
                {all.map((inv) => {
                  const sent = daysSince(inv.invited_at);
                  const daysRemaining = Math.max(0, 30 - sent);
                  const isExpired = inv.status === "expired";
                  const statusClass =
                    STATUS_CLASSES[inv.status] ?? STATUS_CLASSES.expired;

                  return (
                    <tr key={inv.id}>
                      <td className="py-3 pr-4">
                        <span
                          className={
                            isExpired
                              ? "line-through text-text-light"
                              : "text-text-primary"
                          }
                        >
                          {inv.email}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-text-secondary">
                        {new Date(inv.invited_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 pr-4 text-text-secondary">
                        {inv.status === "pending" ? (
                          <span
                            className={
                              daysRemaining <= 5
                                ? "font-medium text-amber-700"
                                : "text-text-secondary"
                            }
                          >
                            {daysRemaining}d
                          </span>
                        ) : (
                          <span className="text-text-light">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass}`}
                        >
                          {inv.status.charAt(0).toUpperCase() +
                            inv.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3">
                        {inv.status === "pending" && (
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-river/20 text-xs text-river hover:bg-river/5"
                              onClick={() => onResend(inv.id)}
                              disabled={revokingId === inv.id}
                              aria-label={`Resend invitation to ${inv.email}`}
                            >
                              {revokingId === inv.id ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <RotateCcw className="size-3" />
                              )}
                              Resend
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-200 text-xs text-red-500 hover:bg-red-50"
                              onClick={() => onRevoke(inv.id)}
                              disabled={revokingId === inv.id}
                              aria-label={`Revoke invitation to ${inv.email}`}
                            >
                              {revokingId === inv.id ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <XCircle className="size-3" />
                              )}
                              Revoke
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
