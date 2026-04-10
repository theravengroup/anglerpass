"use client";

import { TRIGGER_EVENT_LABELS } from "@/lib/crm/types";
import type { NodeConfigProps } from "./types";

export default function TriggerProps({ config, onUpdate }: NodeConfigProps) {
  return (
    <div>
      <label className="mb-1 block text-xs text-text-secondary">
        Trigger Event
      </label>
      <select
        value={(config.event as string) ?? ""}
        onChange={(e) => onUpdate({ ...config, event: e.target.value || null })}
        className="w-full rounded-md border border-stone-light/30 px-3 py-1.5 text-sm text-text-primary"
      >
        <option value="">Select event...</option>
        {Object.entries(TRIGGER_EVENT_LABELS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}
