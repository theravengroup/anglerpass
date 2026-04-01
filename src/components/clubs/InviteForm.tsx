"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  CheckCircle2,
  Send,
  Shield,
} from "lucide-react";

interface InviteFormProps {
  inviteEmail: string;
  onEmailChange: (email: string) => void;
  inviteRole: "member" | "staff";
  onRoleChange: (role: "member" | "staff") => void;
  isOwner: boolean;
  inviting: boolean;
  inviteError: string | null;
  inviteSuccess: string | null;
  onInvite: () => void;
}

export default function InviteForm({
  inviteEmail,
  onEmailChange,
  inviteRole,
  onRoleChange,
  isOwner,
  inviting,
  inviteError,
  inviteSuccess,
  onInvite,
}: InviteFormProps) {
  return (
    <Card className="border-river/20 bg-river/5">
      <CardContent className="space-y-4 py-5">
        <div className="flex items-end gap-3">
          <div className="flex-1 space-y-2">
            <Label htmlFor="invite_email">Email Address</Label>
            <Input
              id="invite_email"
              type="email"
              placeholder="angler@example.com"
              value={inviteEmail}
              onChange={(e) => onEmailChange(e.target.value)}
              disabled={inviting}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onInvite();
                }
              }}
            />
          </div>
          {isOwner && (
            <div className="space-y-2">
              <Label htmlFor="invite_role">Role</Label>
              <select
                id="invite_role"
                value={inviteRole}
                onChange={(e) =>
                  onRoleChange(e.target.value as "member" | "staff")
                }
                disabled={inviting}
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="member">Member</option>
                <option value="staff">Staff</option>
              </select>
            </div>
          )}
          <Button
            onClick={onInvite}
            disabled={inviting || !inviteEmail.trim()}
            className="bg-river text-white hover:bg-river/90"
          >
            {inviting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            Send
          </Button>
        </div>
        {inviteRole === "staff" && (
          <p className="flex items-center gap-1.5 text-xs text-text-secondary">
            <Shield className="size-3.5 text-river" />
            Staff can help manage the club and get discounted rod fees at
            your properties.
          </p>
        )}
        {inviteError && (
          <p className="text-sm text-red-600">{inviteError}</p>
        )}
        {inviteSuccess && (
          <div className="flex items-center gap-2 text-sm text-forest">
            <CheckCircle2 className="size-4" />
            {inviteSuccess}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
