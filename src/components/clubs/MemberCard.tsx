"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, Shield } from "lucide-react";
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
}

interface MemberCardProps {
  member: Member;
  isOwner: boolean;
  isLoading: boolean;
  onStatusChange: (memberId: string, status: string) => void;
  onRemove: (memberId: string) => void;
}

export default function MemberCard({
  member,
  isOwner,
  isLoading,
  onStatusChange,
  onRemove,
}: MemberCardProps) {
  const config =
    MEMBERSHIP_STATUS[member.status] ?? MEMBERSHIP_STATUS.pending;
  const Icon = config.icon;

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
            </p>
            {member.display_name && member.email && (
              <p className="flex items-center gap-1 text-xs text-text-light">
                <Mail className="size-3" />
                {member.email}
              </p>
            )}
            {member.joined_at && (
              <p className="text-xs text-text-light">
                Joined{" "}
                {new Date(member.joined_at).toLocaleDateString()}
              </p>
            )}
            {!member.joined_at && member.invited_at && (
              <p className="text-xs text-text-light">
                Invited{" "}
                {new Date(member.invited_at).toLocaleDateString()}
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
              {member.status === "pending" && (
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
                    onClick={() => onStatusChange(member.id, "declined")}
                  >
                    Decline
                  </Button>
                </>
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
