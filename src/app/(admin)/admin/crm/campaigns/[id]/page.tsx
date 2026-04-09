"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Play,
  Pause,
  Send,
  Plus,
  Trash2,
  Save,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import AdminPageGuard from "@/components/admin/AdminPageGuard";
import CampaignStatusBadge from "@/components/admin/crm/CampaignStatusBadge";
import CampaignTypeBadge from "@/components/admin/crm/CampaignTypeBadge";
import CrmStatsCards from "@/components/admin/crm/CrmStatsCards";
import EmailBuilder from "@/components/admin/crm/email-builder/EmailBuilder";
import type {
  CampaignStatus,
  CampaignType,
  CrmTriggerEvent,
  SegmentRuleGroup,
} from "@/lib/crm/types";
import { TRIGGER_EVENT_LABELS } from "@/lib/crm/types";

// ─── Types ──────────────────────────────────────────────────────────

interface TopicOption {
  id: string;
  name: string;
  slug: string;
}

interface CampaignDetail {
  id: string;
  name: string;
  description: string | null;
  type: CampaignType;
  status: CampaignStatus;
  from_name: string;
  from_email: string;
  reply_to: string | null;
  segment_id: string | null;
  topic_id: string | null;
  trigger_event: CrmTriggerEvent | null;
  created_at: string;
  started_at: string | null;
  steps: StepRow[];
  segment: SegmentRow | null;
}

interface StepRow {
  id: string;
  step_order: number;
  subject: string;
  html_body: string;
  delay_minutes: number;
  cta_label: string | null;
  cta_url: string | null;
}

interface SegmentRow {
  id: string;
  name: string;
  rules: SegmentRuleGroup[];
  cached_count: number | null;
}

// ─── Page ───────────────────────────────────────────────────────────

export default function CrmCampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Editable fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<CampaignType>("broadcast");
  const [fromName, setFromName] = useState("AnglerPass");
  const [fromEmail, setFromEmail] = useState("hello@anglerpass.com");
  const [replyTo, setReplyTo] = useState("");
  const [triggerEvent, setTriggerEvent] = useState<CrmTriggerEvent | "">("");
  const [topicId, setTopicId] = useState<string>("");
  const [topicOptions, setTopicOptions] = useState<TopicOption[]>([]);

  // Stats
  const [stats, setStats] = useState({
    total_sends: 0,
    delivered_count: 0,
    opened_count: 0,
    clicked_count: 0,
    bounced_count: 0,
    open_rate: 0,
    click_rate: 0,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/campaigns/${campaignId}`);
      if (!res.ok) {
        router.push("/admin/crm/campaigns");
        return;
      }
      const data = await res.json();
      const c = data.campaign as CampaignDetail;
      setCampaign(c);
      setName(c.name);
      setDescription(c.description ?? "");
      setType(c.type);
      setFromName(c.from_name);
      setFromEmail(c.from_email);
      setReplyTo(c.reply_to ?? "");
      setTriggerEvent(c.trigger_event ?? "");
      setTopicId(c.topic_id ?? "");

      // Load topics for the dropdown
      const topicsRes = await fetch("/api/admin/crm/topics");
      if (topicsRes.ok) {
        const topicsData = await topicsRes.json();
        setTopicOptions(
          (topicsData.topics ?? []).map((t: Record<string, unknown>) => ({
            id: t.id,
            name: t.name,
            slug: t.slug,
          }))
        );
      }

      // Load stats
      const statsRes = await fetch(`/api/admin/campaigns?limit=1`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        const match = (statsData.campaigns ?? []).find(
          (camp: Record<string, unknown>) => camp.id === campaignId
        );
        if (match) {
          setStats({
            total_sends: match.total_sends ?? 0,
            delivered_count: match.delivered_count ?? 0,
            opened_count: match.opened_count ?? 0,
            clicked_count: match.clicked_count ?? 0,
            bounced_count: match.bounced_count ?? 0,
            open_rate: match.open_rate ?? 0,
            click_rate: match.click_rate ?? 0,
          });
        }
      }
    } finally {
      setLoading(false);
    }
  }, [campaignId, router]);

  useEffect(() => {
    load();
  }, [load]);

  const saveCampaign = async () => {
    setSaving(true);
    try {
      await fetch(`/api/admin/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          from_name: fromName,
          from_email: fromEmail,
          reply_to: replyTo || null,
          trigger_event: triggerEvent || undefined,
          topic_id: topicId || null,
        }),
      });
      load();
    } finally {
      setSaving(false);
    }
  };

  const activateCampaign = async () => {
    setActionLoading("activate");
    try {
      const res = await fetch(`/api/admin/campaigns/${campaignId}/activate`, {
        method: "POST",
      });
      if (res.ok) {
        load();
      } else {
        const data = await res.json();
        alert(data.error ?? "Activation failed");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const pauseCampaign = async () => {
    setActionLoading("pause");
    try {
      const res = await fetch(`/api/admin/campaigns/${campaignId}/pause`, {
        method: "POST",
      });
      if (res.ok) {
        load();
      } else {
        const data = await res.json();
        alert(data.error ?? "Pause failed");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const testSend = async () => {
    const email = prompt("Send test email to:");
    if (!email) return;
    setActionLoading("test");
    try {
      const res = await fetch(`/api/admin/campaigns/${campaignId}/test-send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Test email sent to ${email}`);
      } else {
        alert(data.error ?? "Test send failed");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const isEditable =
    campaign?.status === "draft" || campaign?.status === "paused";

  if (loading) {
    return (
      <AdminPageGuard path="/admin/crm">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="size-6 animate-spin text-charcoal" />
        </div>
      </AdminPageGuard>
    );
  }

  if (!campaign) return null;

  return (
    <AdminPageGuard path="/admin/crm">
      <div className="space-y-6">
        {/* Back + Header */}
        <div>
          <button
            onClick={() => router.push("/admin/crm/campaigns")}
            className="mb-3 flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary"
          >
            <ArrowLeft className="size-3.5" />
            All Campaigns
          </button>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="font-heading text-2xl font-semibold text-text-primary">
                  {campaign.name}
                </h2>
                <CampaignStatusBadge status={campaign.status} />
                <CampaignTypeBadge type={campaign.type} />
              </div>
              {campaign.started_at && (
                <p className="mt-1 text-xs text-text-light">
                  Started{" "}
                  {new Date(campaign.started_at).toLocaleDateString()}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {campaign.steps.length > 0 && (
                <button
                  onClick={testSend}
                  disabled={actionLoading === "test"}
                  className="flex items-center gap-1.5 rounded-md border border-stone-light/30 px-3 py-2 text-xs font-medium text-text-secondary hover:bg-offwhite disabled:opacity-50"
                >
                  <Send className="size-3.5" />
                  Test Send
                </button>
              )}

              {isEditable && (
                <button
                  onClick={activateCampaign}
                  disabled={actionLoading === "activate"}
                  className="flex items-center gap-1.5 rounded-md bg-forest px-3 py-2 text-xs font-medium text-white hover:bg-forest-deep disabled:opacity-50"
                >
                  {actionLoading === "activate" ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Play className="size-3.5" />
                  )}
                  Activate
                </button>
              )}

              {campaign.status === "active" && (
                <button
                  onClick={pauseCampaign}
                  disabled={actionLoading === "pause"}
                  className="flex items-center gap-1.5 rounded-md bg-amber-500 px-3 py-2 text-xs font-medium text-white hover:bg-amber-600 disabled:opacity-50"
                >
                  {actionLoading === "pause" ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Pause className="size-3.5" />
                  )}
                  Pause
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        {stats.total_sends > 0 && <CrmStatsCards stats={stats} />}

        {/* Campaign Settings */}
        {isEditable && (
          <div className="rounded-lg border border-stone-light/20 bg-white p-5">
            <h3 className="mb-4 text-sm font-semibold text-text-primary">
              Campaign Settings
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs text-text-secondary">
                  Campaign Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-md border border-stone-light/30 px-3 py-2 text-sm text-text-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-text-secondary">
                  Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as CampaignType)}
                  className="w-full rounded-md border border-stone-light/30 px-3 py-2 text-sm text-text-primary"
                >
                  <option value="broadcast">Broadcast</option>
                  <option value="drip">Drip</option>
                  <option value="triggered">Triggered</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-text-secondary">
                  From Name
                </label>
                <input
                  type="text"
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  className="w-full rounded-md border border-stone-light/30 px-3 py-2 text-sm text-text-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-text-secondary">
                  From Email
                </label>
                <input
                  type="email"
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                  className="w-full rounded-md border border-stone-light/30 px-3 py-2 text-sm text-text-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-text-secondary">
                  Reply To
                </label>
                <input
                  type="email"
                  value={replyTo}
                  onChange={(e) => setReplyTo(e.target.value)}
                  placeholder="Optional"
                  className="w-full rounded-md border border-stone-light/30 px-3 py-2 text-sm text-text-primary placeholder:text-text-light"
                />
              </div>
              {type === "triggered" && (
                <div>
                  <label className="mb-1 block text-xs text-text-secondary">
                    Trigger Event
                  </label>
                  <select
                    value={triggerEvent}
                    onChange={(e) =>
                      setTriggerEvent(e.target.value as CrmTriggerEvent)
                    }
                    className="w-full rounded-md border border-stone-light/30 px-3 py-2 text-sm text-text-primary"
                  >
                    <option value="">Select trigger...</option>
                    {Object.entries(TRIGGER_EVENT_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="mb-1 block text-xs text-text-secondary">
                  Email Topic
                </label>
                <select
                  value={topicId}
                  onChange={(e) => setTopicId(e.target.value)}
                  className="w-full rounded-md border border-stone-light/30 px-3 py-2 text-sm text-text-primary"
                >
                  <option value="">No topic (sends to all)</option>
                  {topicOptions.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[10px] text-text-light">
                  Only send to users subscribed to this topic
                </p>
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs text-text-secondary">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Internal notes about this campaign..."
                  className="w-full rounded-md border border-stone-light/30 px-3 py-2 text-sm text-text-primary placeholder:text-text-light"
                />
              </div>
            </div>

            {/* Segment */}
            {campaign.segment && (
              <div className="mt-4 rounded-lg border border-river/20 bg-river/5 p-3">
                <p className="text-xs font-medium text-river">
                  Targeting: {campaign.segment.name}
                  {campaign.segment.cached_count !== null && (
                    <span className="ml-1 font-normal text-text-secondary">
                      ({campaign.segment.cached_count.toLocaleString()}{" "}
                      recipients)
                    </span>
                  )}
                </p>
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button
                onClick={saveCampaign}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-md bg-charcoal px-4 py-2 text-xs font-medium text-white hover:bg-charcoal/90 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Save className="size-3.5" />
                )}
                Save Changes
              </button>
            </div>
          </div>
        )}

        {/* Steps */}
        <div className="rounded-lg border border-stone-light/20 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">
              Email Steps ({campaign.steps.length})
            </h3>
            {isEditable && (
              <AddStepButton
                campaignId={campaignId}
                nextOrder={campaign.steps.length + 1}
                onAdded={load}
              />
            )}
          </div>

          {campaign.steps.length === 0 ? (
            <p className="py-4 text-center text-xs text-text-light">
              No steps yet. Add your first email step to&nbsp;get&nbsp;started.
            </p>
          ) : (
            <div className="space-y-3">
              {campaign.steps.map((step) => (
                <StepCard
                  key={step.id}
                  step={step}
                  campaignId={campaignId}
                  editable={isEditable}
                  onUpdated={load}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminPageGuard>
  );
}

// ─── Step Card ──────────────────────────────────────────────────────

function StepCard({
  step,
  campaignId,
  editable,
  onUpdated,
}: {
  step: StepRow;
  campaignId: string;
  editable: boolean;
  onUpdated: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [subject, setSubject] = useState(step.subject);
  const [htmlBody, setHtmlBody] = useState(step.html_body);
  const [delayMinutes, setDelayMinutes] = useState(step.delay_minutes);
  const [ctaLabel, setCtaLabel] = useState(step.cta_label ?? "");
  const [ctaUrl, setCtaUrl] = useState(step.cta_url ?? "");
  const [saving, setSaving] = useState(false);

  const saveStep = async () => {
    setSaving(true);
    try {
      await fetch(`/api/admin/campaigns/${campaignId}/steps/${step.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          html_body: htmlBody,
          delay_minutes: delayMinutes,
          cta_label: ctaLabel || undefined,
          cta_url: ctaUrl || undefined,
        }),
      });
      setEditing(false);
      onUpdated();
    } finally {
      setSaving(false);
    }
  };

  const deleteStep = async () => {
    if (!confirm("Delete this step?")) return;
    await fetch(`/api/admin/campaigns/${campaignId}/steps/${step.id}`, {
      method: "DELETE",
    });
    onUpdated();
  };

  const delayLabel =
    step.delay_minutes === 0
      ? "Immediately"
      : step.delay_minutes < 60
        ? `After ${step.delay_minutes}m`
        : step.delay_minutes < 1440
          ? `After ${Math.round(step.delay_minutes / 60)}h`
          : `After ${Math.round(step.delay_minutes / 1440)}d`;

  return (
    <div className="rounded-lg border border-stone-light/20 bg-offwhite/50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 p-3 text-left"
      >
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-charcoal/10 text-xs font-semibold text-charcoal">
          {step.step_order}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-text-primary">
            {step.subject}
          </p>
          <p className="text-xs text-text-light">{delayLabel}</p>
        </div>
        {step.cta_label && (
          <span className="rounded-full bg-forest/10 px-2 py-0.5 text-xs text-forest">
            CTA: {step.cta_label}
          </span>
        )}
        {expanded ? (
          <ChevronUp className="size-4 text-stone" />
        ) : (
          <ChevronDown className="size-4 text-stone" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-stone-light/20 p-3">
          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-text-secondary">
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-md border border-stone-light/30 px-3 py-2 text-sm text-text-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-text-secondary">
                  Delay (minutes)
                </label>
                <input
                  type="number"
                  value={delayMinutes}
                  onChange={(e) => setDelayMinutes(Number(e.target.value))}
                  min={0}
                  className="w-32 rounded-md border border-stone-light/30 px-3 py-2 text-sm text-text-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-text-secondary">
                    CTA Label
                  </label>
                  <input
                    type="text"
                    value={ctaLabel}
                    onChange={(e) => setCtaLabel(e.target.value)}
                    placeholder="Optional"
                    className="w-full rounded-md border border-stone-light/30 px-3 py-2 text-sm text-text-primary placeholder:text-text-light"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-text-secondary">
                    CTA URL
                  </label>
                  <input
                    type="text"
                    value={ctaUrl}
                    onChange={(e) => setCtaUrl(e.target.value)}
                    placeholder="/dashboard or https://..."
                    className="w-full rounded-md border border-stone-light/30 px-3 py-2 text-sm text-text-primary placeholder:text-text-light"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-xs text-text-secondary">
                  Email Body
                </label>
                <EmailBuilder
                  initialHtml={htmlBody}
                  onChange={setHtmlBody}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setEditing(false)}
                  className="rounded-md border border-stone-light/30 px-3 py-1.5 text-xs text-text-secondary hover:bg-offwhite"
                >
                  Cancel
                </button>
                <button
                  onClick={saveStep}
                  disabled={saving}
                  className="flex items-center gap-1 rounded-md bg-charcoal px-3 py-1.5 text-xs font-medium text-white hover:bg-charcoal/90 disabled:opacity-50"
                >
                  {saving && <Loader2 className="size-3 animate-spin" />}
                  Save Step
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="rounded-md bg-white p-3">
                <pre className="whitespace-pre-wrap font-mono text-xs text-text-secondary">
                  {step.html_body.slice(0, 500)}
                  {step.html_body.length > 500 && "..."}
                </pre>
              </div>
              {editable && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => setEditing(true)}
                    className="rounded-md bg-charcoal/10 px-3 py-1.5 text-xs font-medium text-charcoal hover:bg-charcoal/20"
                  >
                    Edit Step
                  </button>
                  <button
                    onClick={deleteStep}
                    className="rounded-md px-3 py-1.5 text-xs text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="mr-1 inline size-3" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Add Step Button ────────────────────────────────────────────────

function AddStepButton({
  campaignId,
  nextOrder,
  onAdded,
}: {
  campaignId: string;
  nextOrder: number;
  onAdded: () => void;
}) {
  const [adding, setAdding] = useState(false);

  const addStep = async () => {
    setAdding(true);
    try {
      const res = await fetch(`/api/admin/campaigns/${campaignId}/steps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step_order: nextOrder,
          subject: `Email Step ${nextOrder}`,
          html_body: "<p>Write your email content here...</p>",
          delay_minutes: nextOrder === 1 ? 0 : 1440,
        }),
      });
      if (res.ok) {
        onAdded();
      }
    } finally {
      setAdding(false);
    }
  };

  return (
    <button
      onClick={addStep}
      disabled={adding}
      className="flex items-center gap-1.5 rounded-md bg-charcoal/10 px-3 py-1.5 text-xs font-medium text-charcoal hover:bg-charcoal/20 disabled:opacity-50"
    >
      {adding ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Plus className="size-3.5" />
      )}
      Add Step
    </button>
  );
}
