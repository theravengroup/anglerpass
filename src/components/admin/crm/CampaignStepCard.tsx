"use client";

import { useState } from "react";
import {
  Loader2,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import EmailBuilder from "@/components/admin/crm/email-builder/EmailBuilder";
import EmailQualityPanel from "@/components/admin/crm/EmailQualityPanel";
import type { StepRow } from "@/types/campaign";

function formatDelay(minutes: number): string {
  if (minutes === 0) return "Immediately";
  if (minutes < 60) return `After ${minutes}m`;
  if (minutes < 1440) return `After ${Math.round(minutes / 60)}h`;
  return `After ${Math.round(minutes / 1440)}d`;
}

interface CampaignStepCardProps {
  step: StepRow;
  campaignId: string;
  editable: boolean;
  onUpdated: () => void;
  /** Show the EmailQualityPanel when editing (CRM version only) */
  showQualityPanel?: boolean;
}

export default function CampaignStepCard({
  step,
  campaignId,
  editable,
  onUpdated,
  showQualityPanel = false,
}: CampaignStepCardProps) {
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
          <p className="text-xs text-text-light">
            {formatDelay(step.delay_minutes)}
          </p>
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
            <StepEditForm
              subject={subject}
              onSubjectChange={setSubject}
              delayMinutes={delayMinutes}
              onDelayChange={setDelayMinutes}
              ctaLabel={ctaLabel}
              onCtaLabelChange={setCtaLabel}
              ctaUrl={ctaUrl}
              onCtaUrlChange={setCtaUrl}
              htmlBody={htmlBody}
              onHtmlBodyChange={setHtmlBody}
              saving={saving}
              showQualityPanel={showQualityPanel}
              onSave={saveStep}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <StepPreview
              htmlBody={step.html_body}
              editable={editable}
              onEdit={() => setEditing(true)}
              onDelete={deleteStep}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Sub-components (private to this file) ─────────────────────────

function StepEditForm({
  subject,
  onSubjectChange,
  delayMinutes,
  onDelayChange,
  ctaLabel,
  onCtaLabelChange,
  ctaUrl,
  onCtaUrlChange,
  htmlBody,
  onHtmlBodyChange,
  saving,
  showQualityPanel,
  onSave,
  onCancel,
}: {
  subject: string;
  onSubjectChange: (v: string) => void;
  delayMinutes: number;
  onDelayChange: (v: number) => void;
  ctaLabel: string;
  onCtaLabelChange: (v: string) => void;
  ctaUrl: string;
  onCtaUrlChange: (v: string) => void;
  htmlBody: string;
  onHtmlBodyChange: (v: string) => void;
  saving: boolean;
  showQualityPanel: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs text-text-secondary">
          Subject
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => onSubjectChange(e.target.value)}
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
          onChange={(e) => onDelayChange(Number(e.target.value))}
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
            onChange={(e) => onCtaLabelChange(e.target.value)}
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
            onChange={(e) => onCtaUrlChange(e.target.value)}
            placeholder="/dashboard or https://..."
            className="w-full rounded-md border border-stone-light/30 px-3 py-2 text-sm text-text-primary placeholder:text-text-light"
          />
        </div>
      </div>
      <div>
        <label className="mb-2 block text-xs text-text-secondary">
          Email Body
        </label>
        <EmailBuilder initialHtml={htmlBody} onChange={onHtmlBodyChange} />
      </div>
      {showQualityPanel && (
        <EmailQualityPanel
          subject={subject}
          htmlBody={htmlBody}
          fromName="AnglerPass"
          fromEmail="hello@anglerpass.com"
        />
      )}
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="rounded-md border border-stone-light/30 px-3 py-1.5 text-xs text-text-secondary hover:bg-offwhite"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-1 rounded-md bg-charcoal px-3 py-1.5 text-xs font-medium text-white hover:bg-charcoal/90 disabled:opacity-50"
        >
          {saving && <Loader2 className="size-3 animate-spin" />}
          Save Step
        </button>
      </div>
    </div>
  );
}

function StepPreview({
  htmlBody,
  editable,
  onEdit,
  onDelete,
}: {
  htmlBody: string;
  editable: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div>
      <div className="rounded-md bg-white p-3">
        <pre className="whitespace-pre-wrap font-mono text-xs text-text-secondary">
          {htmlBody.slice(0, 500)}
          {htmlBody.length > 500 && "..."}
        </pre>
      </div>
      {editable && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={onEdit}
            className="rounded-md bg-charcoal/10 px-3 py-1.5 text-xs font-medium text-charcoal hover:bg-charcoal/20"
          >
            Edit Step
          </button>
          <button
            onClick={onDelete}
            className="rounded-md px-3 py-1.5 text-xs text-red-500 hover:bg-red-50"
          >
            <Trash2 className="mr-1 inline size-3" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
