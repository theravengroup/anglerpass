"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  FileText,
  Plus,
  Pencil,
  CheckCircle2,
  AlertCircle,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/EmptyState";

interface Waiver {
  id: string;
  club_id: string;
  title: string;
  body_text: string;
  version: number;
  is_active: boolean;
  requires_annual_renewal: boolean;
  created_at: string;
  updated_at: string;
}

interface WaiverWithStats extends Waiver {
  signature_stats?: {
    signed: number;
    total_members: number;
  };
}

export default function WaiversPage() {
  const [waivers, setWaivers] = useState<WaiverWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [clubId, setClubId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWaiver, setEditingWaiver] = useState<Waiver | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [requiresRenewal, setRequiresRenewal] = useState(false);

  useEffect(() => {
    loadClubId();
  }, []);

  useEffect(() => {
    if (clubId) loadWaivers();
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

  async function loadWaivers() {
    try {
      const res = await fetch(`/api/clubos/waivers?club_id=${clubId}`);
      const json = await res.json();
      const waiverList: Waiver[] = json.waivers ?? [];

      // Load stats for each waiver
      const withStats: WaiverWithStats[] = await Promise.all(
        waiverList.map(async (w) => {
          try {
            const statsRes = await fetch(`/api/clubos/waivers/${w.id}`);
            if (statsRes.ok) {
              const statsJson = await statsRes.json();
              return { ...w, signature_stats: statsJson.signature_stats };
            }
          } catch {
            // Continue without stats
          }
          return w;
        })
      );

      setWaivers(withStats);
    } catch {
      // Show empty state
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingWaiver(null);
    setTitle("");
    setBodyText("");
    setRequiresRenewal(false);
    setDialogOpen(true);
  }

  function openEdit(waiver: Waiver) {
    setEditingWaiver(waiver);
    setTitle(waiver.title);
    setBodyText(waiver.body_text);
    setRequiresRenewal(waiver.requires_annual_renewal);
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!clubId || !title.trim() || !bodyText.trim()) return;
    setSaving(true);

    try {
      if (editingWaiver) {
        await fetch(`/api/clubos/waivers/${editingWaiver.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            body_text: bodyText,
            requires_annual_renewal: requiresRenewal,
          }),
        });
      } else {
        await fetch("/api/clubos/waivers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            club_id: clubId,
            title,
            body_text: bodyText,
            requires_annual_renewal: requiresRenewal,
          }),
        });
      }

      setDialogOpen(false);
      await loadWaivers();
    } catch {
      // Handle silently
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(waiver: Waiver) {
    try {
      await fetch(`/api/clubos/waivers/${waiver.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !waiver.is_active }),
      });
      await loadWaivers();
    } catch {
      // Handle silently
    }
  }

  const activeWaivers = waivers.filter((w) => w.is_active);
  const inactiveWaivers = waivers.filter((w) => !w.is_active);

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
          href="/club/clubos/operations"
          className="transition-colors hover:text-text-secondary"
        >
          Operations
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-text-primary font-medium">Waivers</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-text-primary">
            Waivers
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Manage liability waivers and track member&nbsp;signatures.
          </p>
        </div>
        <Button
          size="sm"
          onClick={openCreate}
          className="bg-river text-white hover:bg-river/90"
        >
          <Plus className="size-4" />
          New Waiver
        </Button>
      </div>

      {/* Active Waivers */}
      {waivers.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No waivers created"
          description="Create a waiver that members must sign before accessing club properties or&nbsp;events."
          iconColor="text-river"
          iconBackground
        >
          <Button
            onClick={openCreate}
            className="bg-river text-white hover:bg-river/90"
          >
            <Plus className="size-4" />
            Create Waiver
          </Button>
        </EmptyState>
      ) : (
        <>
          {activeWaivers.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {activeWaivers.map((waiver) => {
                const signed = waiver.signature_stats?.signed ?? 0;
                const total = waiver.signature_stats?.total_members ?? 0;
                const pct = total > 0 ? Math.round((signed / total) * 100) : 0;

                return (
                  <Card key={waiver.id} className="border-stone-light/20">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">
                            <Link
                              href={`/club/clubos/operations/waivers/${waiver.id}`}
                              className="transition-colors hover:text-river"
                            >
                              {waiver.title}
                            </Link>
                          </CardTitle>
                          <CardDescription className="text-xs">
                            Version {waiver.version}
                            {waiver.requires_annual_renewal &&
                              " · Annual renewal"}
                          </CardDescription>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => openEdit(waiver)}
                            aria-label={`Edit ${waiver.title}`}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Signature Progress */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-text-secondary">
                            {signed} of {total} members signed
                          </span>
                          <span className="font-medium text-text-primary">
                            {pct}%
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-stone-light/10">
                          <div
                            className="h-full rounded-full bg-forest transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          {pct === 100 ? (
                            <>
                              <CheckCircle2 className="size-3 text-forest" />
                              <span className="text-forest">
                                All members signed
                              </span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="size-3 text-bronze" />
                              <span className="text-bronze">
                                {total - signed} member
                                {total - signed !== 1 ? "s" : ""} unsigned
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Inactive Waivers */}
          {inactiveWaivers.length > 0 && (
            <Card className="border-stone-light/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Inactive Waivers
                </CardTitle>
                <CardDescription>
                  These waivers are no longer collecting signatures
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-stone-light/10">
                  {inactiveWaivers.map((waiver) => (
                    <div
                      key={waiver.id}
                      className="flex items-center justify-between py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {waiver.title}
                        </p>
                        <p className="text-xs text-text-light">
                          Version {waiver.version} · Last updated{" "}
                          {new Date(
                            waiver.updated_at
                          ).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActive(waiver)}
                      >
                        Reactivate
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="sm:max-w-lg"
          aria-label={editingWaiver ? "Edit waiver" : "Create waiver"}
          aria-modal="true"
        >
          <DialogHeader>
            <DialogTitle>
              {editingWaiver ? "Edit Waiver" : "New Waiver"}
            </DialogTitle>
            <DialogDescription>
              {editingWaiver
                ? "Editing the body text will create a new version."
                : "Create a liability waiver for your club members."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="wvr-title">Title</Label>
              <Input
                id="wvr-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., General Liability Waiver"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wvr-body">Waiver Text</Label>
              <Textarea
                id="wvr-body"
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                placeholder="Enter the full waiver text that members must agree to..."
                rows={10}
                className="font-mono text-sm"
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={requiresRenewal}
                onChange={(e) => setRequiresRenewal(e.target.checked)}
                className="size-4 rounded border-stone-light/30"
              />
              Require annual renewal
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !title.trim() || !bodyText.trim()}
              className="bg-river text-white hover:bg-river/90"
            >
              {saving && <Loader2 className="size-4 animate-spin" />}
              {editingWaiver ? "Save Changes" : "Create Waiver"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
