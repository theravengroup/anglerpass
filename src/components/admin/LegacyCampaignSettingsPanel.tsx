"use client";

import { Loader2, Save } from "lucide-react";
import { TRIGGER_EVENT_LABELS } from "@/lib/crm/types";
import type { CampaignFormFields } from "@/hooks/use-campaign-detail";
import type { SegmentRow } from "@/types/campaign";

interface LegacyCampaignSettingsPanelProps {
  fields: CampaignFormFields;
  segment: SegmentRow | null;
  saving: boolean;
  onSave: () => void;
}

export default function LegacyCampaignSettingsPanel({
  fields,
  segment,
  saving,
  onSave,
}: LegacyCampaignSettingsPanelProps) {
  return (
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
            value={fields.name}
            onChange={(e) => fields.setName(e.target.value)}
            className="w-full rounded-md border border-stone-light/30 px-3 py-2 text-sm text-text-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-text-secondary">
            Type
          </label>
          <select
            value={fields.type}
            onChange={(e) =>
              fields.setType(
                e.target.value as "broadcast" | "drip" | "triggered"
              )
            }
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
            value={fields.fromName}
            onChange={(e) => fields.setFromName(e.target.value)}
            className="w-full rounded-md border border-stone-light/30 px-3 py-2 text-sm text-text-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-text-secondary">
            From Email
          </label>
          <input
            type="email"
            value={fields.fromEmail}
            onChange={(e) => fields.setFromEmail(e.target.value)}
            className="w-full rounded-md border border-stone-light/30 px-3 py-2 text-sm text-text-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-text-secondary">
            Reply To
          </label>
          <input
            type="email"
            value={fields.replyTo}
            onChange={(e) => fields.setReplyTo(e.target.value)}
            placeholder="Optional"
            className="w-full rounded-md border border-stone-light/30 px-3 py-2 text-sm text-text-primary placeholder:text-text-light"
          />
        </div>
        {fields.type === "triggered" && (
          <div>
            <label className="mb-1 block text-xs text-text-secondary">
              Trigger Event
            </label>
            <select
              value={fields.triggerEvent}
              onChange={(e) =>
                fields.setTriggerEvent(
                  e.target.value as "" | typeof fields.triggerEvent
                )
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
        <div className="col-span-2">
          <label className="mb-1 block text-xs text-text-secondary">
            Description
          </label>
          <textarea
            value={fields.description}
            onChange={(e) => fields.setDescription(e.target.value)}
            rows={2}
            placeholder="Internal notes about this campaign..."
            className="w-full rounded-md border border-stone-light/30 px-3 py-2 text-sm text-text-primary placeholder:text-text-light"
          />
        </div>
      </div>

      {/* Segment */}
      {segment && (
        <div className="mt-4 rounded-lg border border-river/20 bg-river/5 p-3">
          <p className="text-xs font-medium text-river">
            Targeting: {segment.name}
            {segment.cached_count !== null && (
              <span className="ml-1 font-normal text-text-secondary">
                ({segment.cached_count.toLocaleString()} recipients)
              </span>
            )}
          </p>
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <button
          onClick={onSave}
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
  );
}
