"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  UserPlus,
  Upload,
  Loader2,
} from "lucide-react";
import { FetchError } from "@/components/shared/FetchError";
import MemberCard from "@/components/clubs/MemberCard";
import InviteForm from "@/components/clubs/InviteForm";
import BulkInviteForm from "@/components/clubs/BulkInviteForm";

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

type FilterTab = "all" | "active" | "staff" | "pending" | "applications";

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [clubId, setClubId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [isOwner, setIsOwner] = useState(false);

  // Invite form state
  const [showInvite, setShowInvite] = useState(false);
  const [showBulkInvite, setShowBulkInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"member" | "staff">("member");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  // Action state
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function fetchMembers(cid: string) {
    try {
      const res = await fetch(`/api/clubs/${cid}/members`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members ?? []);
      }
    } catch {
      // Silent fail
    }
  }

  async function init() {
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
        setIsOwner(true);
        await fetchMembers(cid);
      } else if (data.staff_of?.length) {
        const cid = data.staff_of[0].id;
        setClubId(cid);
        setIsOwner(false);
        await fetchMembers(cid);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    init();
  }, []);

  async function handleInvite() {
    if (!clubId || !inviteEmail.trim()) return;

    setInviteError(null);
    setInviteSuccess(null);
    setInviting(true);

    try {
      const res = await fetch(`/api/clubs/${clubId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });

      const data = await res.json();

      if (!res.ok) {
        setInviteError(data.error ?? "Failed to send invitation");
        return;
      }

      const roleLabel = inviteRole === "staff" ? "Staff invitation" : "Invitation";
      setInviteSuccess(`${roleLabel} sent to ${inviteEmail}`);
      setInviteEmail("");
      setInviteRole("member");
      await fetchMembers(clubId);
    } catch {
      setInviteError("An unexpected error occurred");
    } finally {
      setInviting(false);
    }
  }

  async function handleStatusChange(memberId: string, status: string, declineReason?: string) {
    if (!clubId) return;

    setActionLoading(memberId);
    try {
      const body: Record<string, string> = { status };
      if (declineReason) {
        body.decline_reason = declineReason;
      }

      const res = await fetch(`/api/clubs/${clubId}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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

  const applicationCount = members.filter(
    (m) => m.status === "pending" && m.origin === "applied"
  ).length;

  const filteredMembers = members.filter((m) => {
    if (m.role === "admin") return filter === "all" || filter === "active" || filter === "staff";
    if (filter === "staff") return m.role === "staff" && m.status !== "declined";
    if (filter === "active") return m.status === "active";
    if (filter === "pending") return m.status === "pending";
    if (filter === "applications") return m.status === "pending" && m.origin === "applied";
    return true;
  });

  const filterTabs: FilterTab[] = ["all", "active", "staff", "pending", "applications"];

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
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setShowBulkInvite(!showBulkInvite);
              if (!showBulkInvite) setShowInvite(false);
            }}
          >
            <Upload className="size-4" />
            Bulk Import
          </Button>
          <Button
            className="bg-river text-white hover:bg-river/90"
            onClick={() => {
              setShowInvite(!showInvite);
              if (!showInvite) setShowBulkInvite(false);
              setInviteError(null);
              setInviteSuccess(null);
            }}
          >
            <UserPlus className="size-4" />
            Invite Member
          </Button>
        </div>
      </div>

      {/* Invite form */}
      {showInvite && (
        <InviteForm
          inviteEmail={inviteEmail}
          onEmailChange={setInviteEmail}
          inviteRole={inviteRole}
          onRoleChange={setInviteRole}
          isOwner={isOwner}
          inviting={inviting}
          inviteError={inviteError}
          inviteSuccess={inviteSuccess}
          onInvite={handleInvite}
        />
      )}

      {/* Bulk invite form */}
      {showBulkInvite && clubId && (
        <BulkInviteForm
          clubId={clubId}
          onComplete={() => fetchMembers(clubId)}
        />
      )}

      {/* Filter tabs */}
      {members.length > 0 && (
        <div className="flex gap-1 rounded-lg border border-stone-light/20 bg-offwhite/50 p-1">
          {filterTabs.map((f) => {
            const label = f === "applications" ? "Applications" : f.charAt(0).toUpperCase() + f.slice(1);
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                  filter === f
                    ? "bg-white text-text-primary shadow-sm"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {label}
                {f === "pending" &&
                  members.filter((m) => m.status === "pending").length > 0 && (
                    <span className="ml-1.5 inline-flex size-5 items-center justify-center rounded-full bg-bronze/20 text-xs text-bronze">
                      {members.filter((m) => m.status === "pending").length}
                    </span>
                  )}
                {f === "applications" && applicationCount > 0 && (
                  <span className="ml-1.5 inline-flex size-5 items-center justify-center rounded-full bg-bronze/20 text-xs text-bronze">
                    {applicationCount}
                  </span>
                )}
              </button>
            );
          })}
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
          {filteredMembers.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              isOwner={isOwner}
              isLoading={actionLoading === member.id}
              onStatusChange={handleStatusChange}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}
