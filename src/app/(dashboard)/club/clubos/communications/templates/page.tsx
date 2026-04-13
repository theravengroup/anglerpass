"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  LayoutTemplate,
  Plus,
  Pencil,
  Trash2,
  Lock,
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

const TEMPLATE_TYPES = [
  "broadcast",
  "event_notice",
  "season_opener",
  "season_closer",
  "tournament",
  "annual_meeting",
  "welcome",
  "renewal_reminder",
  "digest",
  "custom",
] as const;

const TYPE_LABELS: Record<string, string> = {
  broadcast: "Broadcast",
  event_notice: "Event Notice",
  season_opener: "Season Opener",
  season_closer: "Season Closer",
  tournament: "Tournament",
  annual_meeting: "Annual Meeting",
  welcome: "Welcome",
  renewal_reminder: "Renewal Reminder",
  digest: "Digest",
  custom: "Custom",
};

interface Template {
  id: string;
  club_id: string | null;
  name: string;
  type: string;
  subject_template: string;
  body_template: string;
  is_system_default: boolean;
  created_at: string;
  updated_at: string;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [clubId, setClubId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [type, setType] = useState<string>("custom");
  const [subjectTemplate, setSubjectTemplate] = useState("");
  const [bodyTemplate, setBodyTemplate] = useState("");

  useEffect(() => {
    loadClubId();
  }, []);

  useEffect(() => {
    if (clubId) loadTemplates();
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

  async function loadTemplates() {
    try {
      const res = await fetch(`/api/clubos/templates?club_id=${clubId}`);
      const json = await res.json();
      setTemplates(json.templates ?? []);
    } catch {
      // Handle silently
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingTemplate(null);
    setName("");
    setType("custom");
    setSubjectTemplate("");
    setBodyTemplate("");
    setDialogOpen(true);
  }

  function openEdit(template: Template) {
    setEditingTemplate(template);
    setName(template.name);
    setType(template.type);
    setSubjectTemplate(template.subject_template);
    setBodyTemplate(template.body_template);
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!clubId || !name.trim()) return;
    setSaving(true);

    try {
      if (editingTemplate) {
        // Update
        await fetch(`/api/clubos/templates/${editingTemplate.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            type,
            subject_template: subjectTemplate,
            body_template: bodyTemplate,
          }),
        });
      } else {
        // Create
        await fetch("/api/clubos/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            club_id: clubId,
            name,
            type,
            subject_template: subjectTemplate,
            body_template: bodyTemplate,
          }),
        });
      }

      setDialogOpen(false);
      await loadTemplates();
    } catch {
      // Handle silently
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(templateId: string) {
    try {
      await fetch(`/api/clubos/templates/${templateId}`, {
        method: "DELETE",
      });
      await loadTemplates();
    } catch {
      // Handle silently
    }
  }

  const clubTemplates = templates.filter((t) => t.club_id);
  const systemTemplates = templates.filter((t) => t.is_system_default);

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
        <span className="text-text-primary font-medium">Templates</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-text-primary">
            Email Templates
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Reusable templates for common club&nbsp;communications.
          </p>
        </div>
        <Button
          size="sm"
          onClick={openCreate}
          className="bg-river text-white hover:bg-river/90"
        >
          <Plus className="size-4" />
          New Template
        </Button>
      </div>

      {/* Club Templates */}
      {clubTemplates.length === 0 && systemTemplates.length === 0 ? (
        <EmptyState
          icon={LayoutTemplate}
          title="No templates yet"
          description="Create reusable email templates to speed up your campaign&nbsp;creation."
          iconColor="text-river"
          iconBackground
        >
          <Button
            onClick={openCreate}
            className="bg-river text-white hover:bg-river/90"
          >
            <Plus className="size-4" />
            Create Template
          </Button>
        </EmptyState>
      ) : (
        <>
          {clubTemplates.length > 0 && (
            <Card className="border-stone-light/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <LayoutTemplate className="size-4 text-river" />
                  Your Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-stone-light/10">
                  {clubTemplates.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {t.name}
                        </p>
                        <p className="text-xs text-text-light">
                          {TYPE_LABELS[t.type] ?? t.type} &middot; Updated{" "}
                          {new Date(t.updated_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => openEdit(t)}
                          aria-label={`Edit ${t.name}`}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleDelete(t.id)}
                          aria-label={`Delete ${t.name}`}
                        >
                          <Trash2 className="size-3.5 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {systemTemplates.length > 0 && (
            <Card className="border-stone-light/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Lock className="size-4 text-text-light" />
                  System Defaults
                </CardTitle>
                <CardDescription>
                  Read-only starter templates you can use as a starting point
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-stone-light/10">
                  {systemTemplates.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {t.name}
                        </p>
                        <p className="text-xs text-text-light">
                          {TYPE_LABELS[t.type] ?? t.type}
                        </p>
                      </div>
                      <span className="rounded-full bg-stone-light/10 px-2 py-0.5 text-xs text-text-light">
                        System
                      </span>
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
          aria-label={
            editingTemplate ? "Edit template" : "Create template"
          }
          aria-modal="true"
        >
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Edit Template" : "New Template"}
            </DialogTitle>
            <DialogDescription>
              {editingTemplate
                ? "Update your email template."
                : "Create a reusable email template."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="tpl-name">Name</Label>
              <Input
                id="tpl-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Season Opener 2026"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tpl-type">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="tpl-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tpl-subject">Subject Template</Label>
              <Input
                id="tpl-subject"
                value={subjectTemplate}
                onChange={(e) => setSubjectTemplate(e.target.value)}
                placeholder='e.g., {{club_name}} — Spring Season Is Open'
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tpl-body">Body Template</Label>
              <Textarea
                id="tpl-body"
                value={bodyTemplate}
                onChange={(e) => setBodyTemplate(e.target.value)}
                placeholder="<p>Hi {{member_name}},</p>"
                rows={8}
                className="font-mono text-sm"
              />
            </div>
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
              {editingTemplate ? "Save Changes" : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
