"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, MessageSquare, CheckCircle2, XCircle } from "lucide-react";

interface Application {
  id: string;
  user_id: string;
  status: string;
  application_note: string | null;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  reviewed_at: string | null;
  declined_reason: string | null;
  created_at: string;
}

interface ApplicationCardProps {
  application: Application;
  isLoading: boolean;
  onApprove: (id: string) => void;
  onDecline: (id: string, reason?: string) => void;
}

export default function ApplicationCard({
  application,
  isLoading,
  onApprove,
  onDecline,
}: ApplicationCardProps) {
  const [showDeclineInput, setShowDeclineInput] = useState(false);
  const [declineReason, setDeclineReason] = useState("");

  const isPending = application.status === "pending";
  const isApproved = application.status === "approved" || application.status === "completed";
  const isDeclined = application.status === "declined";

  return (
    <Card className="border-stone-light/20">
      <CardContent className="py-5">
        <div className="flex items-start justify-between gap-4">
          {/* Applicant info */}
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-bronze/10 text-sm font-medium text-bronze">
              {application.display_name
                ? application.display_name.charAt(0).toUpperCase()
                : application.email
                  ? application.email.charAt(0).toUpperCase()
                  : "?"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary">
                {application.display_name ?? "Unknown"}
              </p>
              {application.email && (
                <p className="flex items-center gap-1 text-xs text-text-light">
                  <Mail className="size-3" />
                  {application.email}
                </p>
              )}
              <p className="mt-0.5 text-xs text-text-light">
                Applied {new Date(application.created_at).toLocaleDateString()}
              </p>
              {application.application_note && (
                <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-offwhite px-3 py-2">
                  <MessageSquare className="mt-0.5 size-3 shrink-0 text-text-light" />
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {application.application_note}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Status / Actions */}
          <div className="flex shrink-0 items-center gap-2">
            {isApproved && (
              <span className="flex items-center gap-1.5 rounded-full bg-forest/10 px-2.5 py-1 text-xs font-medium text-forest">
                <CheckCircle2 className="size-3" />
                Approved
              </span>
            )}
            {isDeclined && (
              <div className="text-right">
                <span className="flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-500">
                  <XCircle className="size-3" />
                  Declined
                </span>
                {application.declined_reason && (
                  <p className="mt-1 max-w-[200px] text-right text-xs text-text-light">
                    {application.declined_reason}
                  </p>
                )}
              </div>
            )}
            {application.status === "withdrawn" && (
              <span className="rounded-full bg-stone-light/20 px-2.5 py-1 text-xs font-medium text-text-light">
                Withdrawn
              </span>
            )}

            {isPending && !isLoading && !showDeclineInput && (
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  className="h-8 bg-forest text-white hover:bg-forest/90"
                  onClick={() => onApprove(application.id)}
                >
                  <CheckCircle2 className="size-3.5" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 border-red-200 text-red-500 hover:bg-red-50"
                  onClick={() => setShowDeclineInput(true)}
                >
                  <XCircle className="size-3.5" />
                  Decline
                </Button>
              </div>
            )}

            {isPending && showDeclineInput && !isLoading && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder="Reason (optional)"
                  maxLength={500}
                  className="h-8 w-48 rounded-md border border-stone-light/40 bg-white px-2.5 text-xs text-text-primary placeholder:text-text-light focus:border-river focus:outline-none"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 border-red-200 text-xs text-red-500 hover:bg-red-50"
                  onClick={() => {
                    onDecline(application.id, declineReason || undefined);
                    setShowDeclineInput(false);
                    setDeclineReason("");
                  }}
                >
                  Confirm
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs text-text-light"
                  onClick={() => {
                    setShowDeclineInput(false);
                    setDeclineReason("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}

            {isLoading && (
              <Loader2 className="size-4 animate-spin text-text-light" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
