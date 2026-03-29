"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Users,
  UserPlus,
  Loader2,
  CheckCircle2,
  Mail,
  Send,
} from "lucide-react";
import { MEMBERSHIP_STATUS } from "@/lib/constants/status";
import { FetchError } from "@/components/shared/FetchError";

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

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [clubId, setClubId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "pending">("all");

  // Invite form state
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  // Action state
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchMembers = useCallback(async (cid: string) => {
    try {
      const res = await fetch(`/api/clubs/${cid}/members`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members ?? []);
      }
    } catch {
      // Silent fail
    }
  }, []);

  const init = useCallback(async () => {
    setError(false);
    setLoading(true);
    try {
      const res = await fetch("/api/clubs");
      if (!res.ok) {
        setError(true);
        return;
      }

      const data = await res.json();
      if (data.owned?.length) {
        const cid = data.owned[0].id;
        setClubId(cid);
        await fetchMembers(cid);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [fetchMembers]);

  useEffect(() => {
    init();
  }, [init]);

  async function handleInvite() {
    if (!clubId || !inviteEmail.trim()) return;

    setInviteError(null);
    setInviteSuccess(null);
    setInviting(true);

    try {
      const res = await fetch(`/api/clubs/${clubId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setInviteError(data.error ?? "Failed to send invitation");
        return;
      }

      setInviteSuccess(`Invitation sent to ${inviteEmail}`);
      setInviteEmail("");
      await fetchMembers(clubId);
    } catch {
      setInviteError("An unexpected error occurred");
    } finally {
      setInviting(false);
    }
  }

  async function handleStatusChange(memberId: string, status: string) {
    if (!clubId) return;

    setActionLoading(memberId);
    try {
      const res = await fetch(`/api/clubs/${clubId}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        await fetchMembers(clubId);
      }
    } catch {
      // Silent fail
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRemove(memberId: string) {
    if (!clubId) return;

    setActionLoading(memberId);
    try {
      const res = await fetch(`/api/clubs/${clubId}/members/${memberId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchMembers(clubId);
      }
    } catch {
      // Silent fail
    } finally {
      setActionLoading(null);
    }
  }

  const filteredMembers = members.filter((m) => {
    if (m.role === "admin") return filter === "all" || filter === "active";
    if (filter === "active") return m.status === "active";
    if (filter === "pending") return m.status === "pending";
    return true;
  });

  if (loading) {
    return (
      <div className="mx-auto flex max-w-5xl items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-river" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl">
        <FetchError message="Failed to load members." onRetry={init} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
            Members
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            {members.length} total member{members.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          className="bg-river text-white hover:bg-river/90"
          onClick={() => {
            setShowInvite(!showInvite);
            setInviteError(null);
            setInviteSuccess(null);
          }}
        >
          <UserPlus className="size-4" />
          Invite Member
        </Button>
      </div>

      {/* Invite form */}
      {showInvite && (
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
                  onChange={(e) => setInviteEmail(e.target.value)}
                  disabled={inviting}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleInvite();
                    }
                  }}
                />
              </div>
              <Button
                onClick={handleInvite}
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
      )}

      {/* Filter tabs */}
      {members.length > 0 && (
        <div className="flex gap-1 rounded-lg border border-stone-light/20 bg-offwhite/50 p-1">
          {(["all", "active", "pending"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-white text-text-primary shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === "pending" &&
                members.filter((m) => m.status === "pending").length > 0 && (
                  <span className="ml-1.5 inline-flex size-5 items-center justify-center rounded-full bg-bronze/20 text-xs text-bronze">
                    {members.filter((m) => m.status === "pending").length}
                  </span>
                )}
            </button>
          ))}
        </div>
      )}

      {/* Member list */}
      {filteredMembers.length === 0 ? (
        <Card className="border-stone-light/20">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex size-14 items-center justify-center rounded-full bg-river/10">
              <Users className="size-6 text-river" />
            </div>
            <h3 className="mt-4 text-base font-medium text-text-primary">
              {filter !== "all" ? `No ${filter} members` : "No members yet"}
            </h3>
            <p className="mt-1 max-w-sm text-center text-sm text-text-secondary">
              Invite anglers to join your club and manage their access to
              private waters.
            </p>
            {!showInvite && (
              <Button
                className="mt-6 bg-river text-white hover:bg-river/90"
                onClick={() => setShowInvite(true)}
              >
                <UserPlus className="size-4" />
                Invite Members
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredMembers.map((member) => {
            const config =
              MEMBERSHIP_STATUS[member.status] ?? MEMBERSHIP_STATUS.pending;
            const Icon = config.icon;
            const isLoading = actionLoading === member.id;

            return (
              <Card
                key={member.id}
                className="border-stone-light/20"
              >
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
                            Admin
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

                    {/* Actions (not for admin role) */}
                    {member.role !== "admin" && !isLoading && (
                      <div className="flex gap-1">
                        {member.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 border-forest/30 text-xs text-forest hover:bg-forest/5"
                              onClick={() =>
                                handleStatusChange(member.id, "active")
                              }
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 border-red-200 text-xs text-red-500 hover:bg-red-50"
                              onClick={() =>
                                handleStatusChange(member.id, "declined")
                              }
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
                            onClick={() =>
                              handleStatusChange(member.id, "inactive")
                            }
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
                              onClick={() =>
                                handleStatusChange(member.id, "active")
                              }
                            >
                              Activate
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 border-red-200 text-xs text-red-500 hover:bg-red-50"
                              onClick={() => handleRemove(member.id)}
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
          })}
        </div>
      )}
    </div>
  );
}
