"use client";

import type { NodeConfigProps } from "./types";

export default function DelayProps({ config, onUpdate }: NodeConfigProps) {
  return (
    <div className="flex gap-3">
      <div className="flex-1">
        <label className="mb-1 block text-xs text-text-secondary">
          Duration
        </label>
        <input
          type="number"
          value={(config.duration as number) ?? 1}
          onChange={(e) =>
            onUpdate({ ...config, duration: Math.max(1, Number(e.target.value)) })
          }
          min={1}
          className="w-full rounded-md border border-stone-light/30 px-3 py-1.5 text-sm text-text-primary"
        />
      </div>
      <div className="flex-1">
        <label className="mb-1 block text-xs text-text-secondary">Unit</label>
        <select
          value={(config.unit as string) ?? "days"}
          onChange={(e) => onUpdate({ ...config, unit: e.target.value })}
          className="w-full rounded-md border border-stone-light/30 px-3 py-1.5 text-sm text-text-primary"
        >
          <option value="minutes">Minutes</option>
          <option value="hours">Hours</option>
          <option value="days">Days</option>
        </select>
      </div>
    </div>
  );
}
