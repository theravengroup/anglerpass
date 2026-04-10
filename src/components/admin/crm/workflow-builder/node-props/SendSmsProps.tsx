"use client";

import type { NodeConfigProps } from "./types";

export default function SendSmsProps({ config, onUpdate }: NodeConfigProps) {
  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs text-text-secondary">
          Message
        </label>
        <textarea
          value={(config.message as string) ?? ""}
          onChange={(e) => onUpdate({ ...config, message: e.target.value })}
          rows={4}
          placeholder="Hi {{ user.name }}, your booking is confirmed!"
          className="w-full rounded-md border border-stone-light/30 px-3 py-1.5 text-sm text-text-primary placeholder:text-text-light"
        />
        <p className="mt-1 text-[10px] text-text-light">
          Max 1600 chars. Supports Liquid templates.
        </p>
      </div>
      <div className="rounded-md bg-amber-50 p-2">
        <p className="text-[10px] text-amber-700">
          SMS requires user to have a phone number and SMS&nbsp;opt-in enabled.
        </p>
      </div>
    </div>
  );
}
