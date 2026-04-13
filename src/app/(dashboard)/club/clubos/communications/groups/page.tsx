"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Users,
  Plus,
  Pencil,
  Trash2,
  Zap,
  UserPlus,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/EmptyState";

interface MemberGroup {
  id: string;
  club_id: string;
  name: string;
  description: string | null;
  is_smart: boolean;
  smart_filters: Record<string, unknown> | null;
  member_count: number;
  created_at: string;
}

export default function MemberGroupsPage() {
  const [groups, setGroups] = useState<MemberGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [clubId, setClubId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSmart, setIsSmart] = useState(false);
  const [smartFilterStatus, setSmartFilterStatus] = useState("");
  const [smartFilterActivity, setSmartFilterActivity] = useState("");

  useEffect(() => {
    loadClubId();
  }, []);

  useEffect(() => {
    if (clubId) loadGroups();
  }, [clubId]);

  async function loadClubId() {
    try {
      const res = await fetch("/api/clubs");
      const json = await res.json();
      const club =
        json.owned?.[0] ?? json.staff_of?.[0] ?? json.member_of?.[0];
      if (club) setClubId(club.id);
      else setLoading(false);
    } catch {
      setLoading(false);
    }
  }

  async function loadGroups() {
    try {
      const res = await fetch(`/api/clubos/groups?club_id=${clubId}`);
      const json = await res.json();
      setGroups(json.groups ?? []);
    } catch {
      // Handle silently
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setName("");
    setDescription("");
    setIsSmart(false);
    setSmartFilterStatus("");
    setSmartFilterActivity("");
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!clubId || !name.trim()) return;
    setSaving(true);

    try {
      const smartFilters = isSmart
        ? {
            ...(smartFilterStatus ? { status: [smartFilterStatus] } : {}),
            ...(smartFilterActivity
              ? { activity_level: [smartFilterActivity] }
              : {}),
          }
        : undefined;

      await fetch("/api/clubos/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          club_id: clubId,
          name,
          description: description || undefined,
          is_smart: isSmart,
          smart_filters: smartFilters,
        }),
      });

      setDialogOpen(false);
      await loadGroups();
    } catch {
      // Handle silently
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(groupId: string) {
    try {
      await fetch(`/api/clubos/groups/${groupId}`, { method: "DELETE" });
      await loadGroups();
    } catch {
      // Handle silently
    }
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-5xl items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-river" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-text-light">
        <Link
          href="/club/clubos"
          className="transition-colors hover:text-text-secondary"
        >
          ClubOS
        </Link>
        <ChevronRight className="size-3.5" />
        <Link
          href="/club/clubos/communications"
          className="transition-colors hover:text-text-secondary"
        >
          Communications
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-text-primary font-medium">Member Groups</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-text-primary">
            Member Groups
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Organize members into static or smart groups for
            targeted&nbsp;messaging.
          </p>
        </div>
        <Button
          size="sm"
          onClick={openCreate}
          className="bg-river text-white hover:bg-river/90"
        >
          <Plus className="size-4" />
          New Group
        </Button>
      </div>

      {/* Groups List */}
      {groups.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No member groups yet"
          description="Create groups to organize your members and target communications more effectively."
          iconColor="text-forest"
          iconBackground
        >
          <Button
            onClick={openCreate}
            className="bg-river text-white hover:bg-river/90"
          >
            <Plus className="size-4" />
            Create Group
          </Button>
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {groups.map((group) => (
            <Card key={group.id} className="border-stone-light/20">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex size-9 items-center justify-center rounded-lg ${
                        group.is_smart ? "bg-bronze/10" : "bg-forest/10"
                      }`}
                    >
                      {group.is_smart ? (
                        <Zap className="size-[18px] text-bronze" />
                      ) : (
                        <UserPlus className="size-[18px] text-forest" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {group.name}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {group.is_smart ? "Smart group" : "Static group"}{" "}
                        &middot; {group.member_count} member
                        {group.member_count !== 1 ? "s" : ""}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Edit ${group.name}`}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleDelete(group.id)}
                      aria-label={`Delete ${group.name}`}
                    >
                      <Trash2 className="size-3.5 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {group.description && (
                <CardContent>
                  <p className="text-sm text-text-secondary">
                    {group.description}
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent aria-label="Create member group" aria-modal="true">
          <DialogHeader>
            <DialogTitle>New Member Group</DialogTitle>
            <DialogDescription>
              Create a group to organize and target members.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="grp-name">Group Name</Label>
              <Input
                id="grp-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Spring Season Regulars"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="grp-desc">Description (optional)</Label>
              <Textarea
                id="grp-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this group for?"
                rows={2}
              />
            </div>

            {/* Group Type */}
            <div className="space-y-2">
              <Label>Group Type</Label>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsSmart(false)}
                  className={`flex-1 rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                    !isSmart
                      ? "border-forest/30 bg-forest/5"
                      : "border-stone-light/20 hover:border-stone-light/40"
                  }`}
                >
                  <p className="font-medium text-text-primary">Static</p>
                  <p className="text-xs text-text-light">
                    Manually add members
                  </p>
                </button>
                <button
                  onClick={() => setIsSmart(true)}
                  className={`flex-1 rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                    isSmart
                      ? "border-bronze/30 bg-bronze/5"
                      : "border-stone-light/20 hover:border-stone-light/40"
                  }`}
                >
                  <p className="font-medium text-text-primary">Smart</p>
                  <p className="text-xs text-text-light">
                    Auto-populate by rules
                  </p>
                </button>
              </div>
            </div>

            {/* Smart Filters */}
            {isSmart && (
              <div className="space-y-3 rounded-lg border border-stone-light/20 p-4">
                <p className="text-xs font-medium text-text-secondary">
                  Smart Group Filters
                </p>
                <div className="space-y-2">
                  <Label htmlFor="smart-status">Status</Label>
                  <Select
                    value={smartFilterStatus}
                    onValueChange={setSmartFilterStatus}
                  >
                    <SelectTrigger id="smart-status">
                      <SelectValue placeholder="Any status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smart-activity">Activity Level</Label>
                  <Select
                    value={smartFilterActivity}
                    onValueChange={setSmartFilterActivity}
                  >
                    <SelectTrigger id="smart-activity">
                      <SelectValue placeholder="Any activity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="dormant">Dormant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="bg-river text-white hover:bg-river/90"
            >
              {saving && <Loader2 className="size-4 animate-spin" />}
              Create Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
