"use client";

import type { NodeConfigProps } from "./types";

export default function SplitProps({ config, onUpdate }: NodeConfigProps) {
  const pct = (config.split_percent as number) ?? 50;

  return (
    <div>
      <label className="mb-1 block text-xs text-text-secondary">
        Split Percentage
      </label>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={10}
          max={90}
          step={5}
          value={pct}
          onChange={(e) =>
            onUpdate({ ...config, split_percent: Number(e.target.value) })
          }
          className="flex-1"
        />
        <span className="w-20 text-xs text-text-primary">
          A:{pct}% B:{100 - pct}%
        </span>
      </div>
    </div>
  );
}
