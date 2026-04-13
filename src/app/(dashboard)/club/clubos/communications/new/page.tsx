"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronRight,
  Megaphone,
  Target,
  Newspaper,
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Send,
  Users,
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

const STEPS = [
  { id: 1, label: "Type" },
  { id: 2, label: "Audience" },
  { id: 3, label: "Compose" },
  { id: 4, label: "Review" },
];

const CAMPAIGN_TYPES = [
  {
    value: "broadcast",
    label: "Broadcast",
    description: "Send to all active members",
    icon: Megaphone,
    color: "text-river",
    bg: "bg-river/10",
    border: "border-river/30",
  },
  {
    value: "targeted",
    label: "Targeted",
    description: "Filter by segment or group",
    icon: Target,
    color: "text-bronze",
    bg: "bg-bronze/10",
    border: "border-bronze/30",
  },
  {
    value: "digest",
    label: "Digest",
    description: "Weekly or monthly summary",
    icon: Newspaper,
    color: "text-forest",
    bg: "bg-forest/10",
    border: "border-forest/30",
  },
] as const;

interface Group {
  id: string;
  name: string;
  member_count: number;
  is_smart: boolean;
}

interface Template {
  id: string;
  name: string;
  type: string;
  subject_template: string;
  body_template: string;
  is_system_default: boolean;
}

export default function CreateCampaignPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type") ?? "";

  const [step, setStep] = useState(initialType ? 2 : 1);
  const [clubId, setClubId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [campaignType, setCampaignType] = useState(initialType || "broadcast");
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [scheduledAt, setScheduledAt] = useState("");

  // Segment filters
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterActivity, setFilterActivity] = useState("");
  const [filterGroupId, setFilterGroupId] = useState("");

  // Loaded data
  const [groups, setGroups] = useState<Group[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    loadClubId();
  }, []);

  useEffect(() => {
    if (clubId) {
      loadGroups();
      loadTemplates();
    }
  }, [clubId]);

  async function loadClubId() {
    try {
      const res = await fetch("/api/clubs");
      const json = await res.json();
      const club =
        json.owned?.[0] ?? json.staff_of?.[0] ?? json.member_of?.[0];
      if (club) setClubId(club.id);
    } catch {
      // Handle silently
    }
  }

  async function loadGroups() {
    try {
      const res = await fetch(`/api/clubos/groups?club_id=${clubId}`);
      const json = await res.json();
      setGroups(json.groups ?? []);
    } catch {
      // Handle silently
    }
  }

  async function loadTemplates() {
    try {
      const res = await fetch(`/api/clubos/templates?club_id=${clubId}`);
      const json = await res.json();
      setTemplates(json.templates ?? []);
    } catch {
      // Handle silently
    }
  }

  const loadPreviewCount = useCallback(async () => {
    if (!clubId || campaignType === "broadcast") return;

    setPreviewLoading(true);
    try {
      const filters: Record<string, unknown> = {};
      if (filterStatus.length > 0) filters.status = filterStatus;
      if (filterActivity) filters.activity_level = [filterActivity];
      if (filterGroupId) filters.member_group = [filterGroupId];

      const res = await fetch("/api/clubos/segment-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ club_id: clubId, filters }),
      });

      if (res.ok) {
        const json = await res.json();
        setPreviewCount(json.count ?? 0);
      }
    } catch {
      // Handle silently
    } finally {
      setPreviewLoading(false);
    }
  }, [clubId, campaignType, filterStatus, filterActivity, filterGroupId]);

  useEffect(() => {
    if (step === 2 && campaignType === "targeted") {
      const timer = setTimeout(loadPreviewCount, 500);
      return () => clearTimeout(timer);
    }
  }, [step, loadPreviewCount, campaignType]);

  function applyTemplate(templateId: string) {
    setSelectedTemplateId(templateId);
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      if (template.subject_template) setSubject(template.subject_template);
      if (template.body_template) setBodyHtml(template.body_template);
    }
  }

  function canProceed(): boolean {
    switch (step) {
      case 1:
        return !!campaignType;
      case 2:
        return true; // Broadcast targets all; targeted can have empty filters
      case 3:
        return !!subject.trim() && !!bodyHtml.trim();
      case 4:
        return true;
      default:
        return false;
    }
  }

  async function handleSubmit(action: "send" | "schedule") {
    if (!clubId) return;
    setSubmitting(true);
    setError(null);

    try {
      // Build segment filters for targeted campaigns
      const segmentFilters =
        campaignType === "targeted"
          ? {
              ...(filterStatus.length > 0 ? { status: filterStatus } : {}),
              ...(filterActivity
                ? { activity_level: [filterActivity] }
                : {}),
              ...(filterGroupId
                ? { member_group: [filterGroupId] }
                : {}),
            }
          : undefined;

      const payload = {
        club_id: clubId,
        type: campaignType,
        subject,
        body_html: bodyHtml,
        body_text: bodyHtml.replace(/<[^>]+>/g, ""),
        template_id: selectedTemplateId || undefined,
        segment_filters:
          segmentFilters && Object.keys(segmentFilters).length > 0
            ? segmentFilters
            : undefined,
        scheduled_at:
          action === "schedule" && scheduledAt
            ? new Date(scheduledAt).toISOString()
            : undefined,
      };

      // Create campaign
      const createRes = await fetch("/api/clubos/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!createRes.ok) {
        const err = await createRes.json();
        throw new Error(err.error ?? "Failed to create campaign");
      }

      const { campaign } = await createRes.json();

      // If sending immediately, trigger send
      if (action === "send") {
        const sendRes = await fetch(
          `/api/clubos/campaigns/${campaign.id}/send`,
          { method: "POST" }
        );

        if (!sendRes.ok) {
          const err = await sendRes.json();
          throw new Error(err.error ?? "Failed to send campaign");
        }
      }

      router.push(`/club/clubos/communications/${campaign.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
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
        <span className="text-text-primary font-medium">New Campaign</span>
      </nav>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <button
              onClick={() => s.id < step && setStep(s.id)}
              disabled={s.id > step}
              className={`flex size-8 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                s.id === step
                  ? "bg-river text-white"
                  : s.id < step
                    ? "bg-forest/10 text-forest"
                    : "bg-stone-light/10 text-text-light"
              }`}
            >
              {s.id < step ? <Check className="size-3.5" /> : s.id}
            </button>
            <span
              className={`text-xs ${
                s.id === step
                  ? "font-medium text-text-primary"
                  : "text-text-light"
              }`}
            >
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <div className="mx-1 h-px w-6 bg-stone-light/30 sm:w-10" />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Choose Type */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h2 className="font-heading text-xl font-semibold text-text-primary">
              Choose campaign type
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              Select the type of message you want to send.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {CAMPAIGN_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setCampaignType(type.value)}
                className={`rounded-xl border p-4 text-left transition-all ${
                  campaignType === type.value
                    ? `${type.border} ring-1 ring-current/20`
                    : "border-stone-light/20 hover:border-stone-light/40"
                }`}
              >
                <div
                  className={`flex size-10 items-center justify-center rounded-lg ${type.bg}`}
                >
                  <type.icon className={`size-5 ${type.color}`} />
                </div>
                <p className="mt-3 text-sm font-medium text-text-primary">
                  {type.label}
                </p>
                <p className="mt-0.5 text-xs text-text-light">
                  {type.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Audience */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <h2 className="font-heading text-xl font-semibold text-text-primary">
              {campaignType === "broadcast"
                ? "Broadcast audience"
                : "Define your audience"}
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              {campaignType === "broadcast"
                ? "This campaign will be sent to all active members."
                : "Use filters to target specific members."}
            </p>
          </div>

          {campaignType === "broadcast" ? (
            <Card className="border-river/20 bg-river/5">
              <CardContent className="flex items-center gap-3 py-5">
                <div className="flex size-10 items-center justify-center rounded-full bg-river/10">
                  <Users className="size-5 text-river" />
                </div>
                <div>
                  <p className="font-medium text-text-primary">
                    All Active Members
                  </p>
                  <p className="text-sm text-text-secondary">
                    Every active member in your club will receive
                    this&nbsp;message.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-stone-light/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Segment Filters</CardTitle>
                <CardDescription>
                  Combine filters to narrow your audience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status Filter */}
                <div className="space-y-2">
                  <Label>Member Status</Label>
                  <div className="flex flex-wrap gap-2">
                    {["active", "expired", "pending", "suspended"].map(
                      (status) => (
                        <button
                          key={status}
                          onClick={() =>
                            setFilterStatus((prev) =>
                              prev.includes(status)
                                ? prev.filter((s) => s !== status)
                                : [...prev, status]
                            )
                          }
                          className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                            filterStatus.includes(status)
                              ? "bg-river text-white"
                              : "bg-offwhite text-text-secondary hover:bg-stone-light/20"
                          }`}
                        >
                          {status}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Activity Level */}
                <div className="space-y-2">
                  <Label htmlFor="activity">Activity Level</Label>
                  <Select
                    value={filterActivity}
                    onValueChange={setFilterActivity}
                  >
                    <SelectTrigger id="activity">
                      <SelectValue placeholder="Any activity level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">
                        Active (booked in last 30 days)
                      </SelectItem>
                      <SelectItem value="inactive">
                        Inactive (30–90 days)
                      </SelectItem>
                      <SelectItem value="dormant">
                        Dormant (90+ days)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Member Group */}
                {groups.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="group">Member Group</Label>
                    <Select
                      value={filterGroupId}
                      onValueChange={setFilterGroupId}
                    >
                      <SelectTrigger id="group">
                        <SelectValue placeholder="Any group" />
                      </SelectTrigger>
                      <SelectContent>
                        {groups.map((g) => (
                          <SelectItem key={g.id} value={g.id}>
                            {g.name} ({g.member_count})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Preview Count */}
                <div className="flex items-center gap-2 rounded-lg bg-offwhite/50 px-4 py-3">
                  {previewLoading ? (
                    <Loader2 className="size-4 animate-spin text-river" />
                  ) : (
                    <Users className="size-4 text-river" />
                  )}
                  <span className="text-sm font-medium text-text-primary">
                    {previewCount !== null
                      ? `${previewCount} matching member${previewCount !== 1 ? "s" : ""}`
                      : "Loading preview\u2026"}
                  </span>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={loadPreviewCount}
                    disabled={previewLoading}
                  >
                    Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Step 3: Compose */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <h2 className="font-heading text-xl font-semibold text-text-primary">
              Compose your message
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              Write the email your members will receive.
            </p>
          </div>

          {/* Template Selection */}
          {templates.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="template">Start from template (optional)</Label>
              <Select
                value={selectedTemplateId}
                onValueChange={applyTemplate}
              >
                <SelectTrigger id="template">
                  <SelectValue placeholder="Choose a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                      {t.is_system_default ? " (System)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject Line</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Spring Season Opening — Book Your Dates"
              maxLength={500}
            />
            <p className="text-xs text-text-light">
              {subject.length}/500 characters
            </p>
          </div>

          {/* Body */}
          <div className="space-y-2">
            <Label htmlFor="body">Email Body</Label>
            <p className="text-xs text-text-light">
              Use HTML for formatting. Available merge fields:
              {" "}
              <code className="rounded bg-offwhite px-1 text-xs">
                {"{{member_name}}"}
              </code>
              ,{" "}
              <code className="rounded bg-offwhite px-1 text-xs">
                {"{{club_name}}"}
              </code>
            </p>
            <Textarea
              id="body"
              value={bodyHtml}
              onChange={(e) => setBodyHtml(e.target.value)}
              placeholder="<p>Hi {{member_name}},</p>&#10;&#10;<p>We're excited to share...</p>"
              rows={12}
              className="font-mono text-sm"
            />
          </div>
        </div>
      )}

      {/* Step 4: Review & Send */}
      {step === 4 && (
        <div className="space-y-4">
          <div>
            <h2 className="font-heading text-xl font-semibold text-text-primary">
              Review &amp; send
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              Review your campaign before sending.
            </p>
          </div>

          <Card className="border-stone-light/20">
            <CardContent className="space-y-4 py-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-text-light">Type</p>
                  <p className="mt-0.5 text-sm font-medium capitalize text-text-primary">
                    {campaignType}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-light">Audience</p>
                  <p className="mt-0.5 text-sm font-medium text-text-primary">
                    {campaignType === "broadcast"
                      ? "All active members"
                      : previewCount !== null
                        ? `${previewCount} matching members`
                        : "Filtered segment"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs text-text-light">Subject</p>
                <p className="mt-0.5 text-sm font-medium text-text-primary">
                  {subject}
                </p>
              </div>

              <div>
                <p className="text-xs text-text-light">Body Preview</p>
                <div className="mt-1 max-h-48 overflow-y-auto rounded-lg border border-stone-light/20 bg-white p-4 text-sm text-text-secondary">
                  <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Option */}
          <Card className="border-stone-light/20">
            <CardContent className="space-y-3 py-5">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-text-light" />
                <Label htmlFor="schedule">
                  Schedule for later (optional)
                </Label>
              </div>
              <Input
                id="schedule"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
              <p className="text-xs text-text-light">
                Leave empty to send immediately, or pick a date and
                time&nbsp;to&nbsp;schedule.
              </p>
            </CardContent>
          </Card>

          {/* Error */}
          {error && (
            <div
              role="alert"
              aria-live="polite"
              className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600"
            >
              {error}
            </div>
          )}

          {/* Send Actions */}
          <div className="flex gap-3">
            {scheduledAt ? (
              <Button
                onClick={() => handleSubmit("schedule")}
                disabled={submitting}
                className="bg-bronze text-white hover:bg-bronze/90"
              >
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Clock className="size-4" />
                )}
                Schedule Campaign
              </Button>
            ) : (
              <Button
                onClick={() => handleSubmit("send")}
                disabled={submitting}
                className="bg-river text-white hover:bg-river/90"
              >
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                Send Now
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between border-t border-stone-light/20 pt-4">
        <Button
          variant="outline"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>
        {step < 4 && (
          <Button
            onClick={() => setStep((s) => Math.min(4, s + 1))}
            disabled={!canProceed()}
            className="bg-river text-white hover:bg-river/90"
          >
            Next
            <ArrowRight className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
