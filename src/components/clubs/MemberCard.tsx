"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, Shield, Building2 } from "lucide-react";
import { MEMBERSHIP_STATUS } from "@/lib/constants/status";

interface Member {
  id: string;
  user_id: string | null;
  role: string;
  status: string;
  email: string | null;
  display_name: string | null;
  invited_at: string | null;
  joined_at: string | null;
  created_at: string;
  membership_type: string;
  company_name: string | null;
  origin: "invited" | "applied";
}

interface MemberCardProps {
  member: Member;
  isOwner: boolean;
  isLoading: boolean;
  onStatusChange: (memberId: string, status: string, declineReason?: string) => void;
  onRemove: (memberId: string) => void;
}

function MembershipTypeBadge({ type }: { type: string }) {
  if (type === "corporate") {
    return (
      <span className="ml-2 rounded-full bg-bronze/10 px-2 py-0.5 text-xs font-medium text-bronze">
        Corporate
      </span>
    );
  }
  if (type === "corporate_employee") {
    return (
      <span className="ml-2 rounded-full bg-bronze/5 px-2 py-0.5 text-xs font-medium text-bronze/70">
        Corp. Employee
      </span>
    );
  }
  return null;
}

function DeclineInput({
  onConfirm,
  onCancel,
}: {
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState("");

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason (optional)"
        maxLength={500}
        className="h-7 w-44 rounded-md border border-stone-light/40 bg-white px-2 text-xs text-text-primary placeholder:text-text-light focus:border-river focus:outline-none"
      />
      <Button
        size="sm"
        variant="outline"
        className="h-7 border-red-200 text-xs text-red-500 hover:bg-red-50"
        onClick={() => onConfirm(reason)}
      >
        Confirm
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 text-xs text-text-light"
        onClick={onCancel}
      >
        Cancel
      </Button>
    </div>
  );
}

export default function MemberCard({
  member,
  isOwner,
  isLoading,
  onStatusChange,
  onRemove,
}: MemberCardProps) {
  const [showDeclineInput, setShowDeclineInput] = useState(false);
  const config =
    MEMBERSHIP_STATUS[member.status] ?? MEMBERSHIP_STATUS.pending;
  const Icon = config.icon;

  const originDate =
    member.origin === "applied" && !member.joined_at
      ? member.created_at
      : member.invited_at;
  const originLabel =
    member.origin === "applied" && !member.joined_at ? "Applied" : "Invited";

  return (
    <Card className="border-stone-light/20">
      <CardContent className="flex items-center justify-between py-4">
        <div className="flex items-center gap-4">
          <div className="flex size-10 items-center justify-center rounded-full bg-offwhite text-sm font-medium text-text-secondary">
            {member.display_name
              ? member.display_name.charAt(0).toUpperCase()
              : member.email
                ? member.email.charAt(0).toUpperCase()
                : "?"}
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">
              {member.display_name ?? member.email ?? "Unknown"}
              {member.role === "admin" && (
                <span className="ml-2 rounded-full bg-river/10 px-2 py-0.5 text-xs font-medium text-river">
                  Owner
                </span>
              )}
              {member.role === "staff" && (
                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-forest/10 px-2 py-0.5 text-xs font-medium text-forest">
                  <Shield className="size-2.5" />
                  Staff
                </span>
              )}
              <MembershipTypeBadge type={member.membership_type} />
            </p>
            {member.display_name && member.email && (
              <p className="flex items-center gap-1 text-xs text-text-light">
                <Mail className="size-3" />
                {member.email}
              </p>
            )}
            {member.company_name && (
              <p className="flex items-center gap-1 text-xs text-text-light">
                <Building2 className="size-3" />
                {member.company_name}
              </p>
            )}
            {member.joined_at && (
              <p className="text-xs text-text-light">
                Joined{" "}
                {new Date(member.joined_at).toLocaleDateString()}
              </p>
            )}
            {!member.joined_at && originDate && (
              <p className="text-xs text-text-light">
                {originLabel}{" "}
                {new Date(originDate).toLocaleDateString()}
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

          {/* Actions */}
          {member.role !== "admin" &&
            (isOwner || member.role !== "staff") &&
            !isLoading && (
            <div className="flex gap-1">
              {member.status === "pending" && !showDeclineInput && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 border-forest/30 text-xs text-forest hover:bg-forest/5"
                    onClick={() => onStatusChange(member.id, "active")}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 border-red-200 text-xs text-red-500 hover:bg-red-50"
                    onClick={() => setShowDeclineInput(true)}
                  >
                    Decline
                  </Button>
                </>
              )}
              {member.status === "pending" && showDeclineInput && (
                <DeclineInput
                  onConfirm={(reason) => {
                    onStatusChange(member.id, "declined", reason || undefined);
                    setShowDeclineInput(false);
                  }}
                  onCancel={() => setShowDeclineInput(false)}
                />
              )}
              {member.status === "active" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs text-text-light hover:text-red-500"
                  onClick={() => onStatusChange(member.id, "inactive")}
                >
                  Deactivate
                </Button>
              )}
              {(member.status === "inactive" ||
                member.status === "declined") && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 border-forest/30 text-xs text-forest hover:bg-forest/5"
                    onClick={() => onStatusChange(member.id, "active")}
                  >
                    Activate
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 border-red-200 text-xs text-red-500 hover:bg-red-50"
                    onClick={() => onRemove(member.id)}
                  >
                    Remove
                  </Button>
                </>
              )}
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
