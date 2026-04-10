"use client";

import type { NodeConfigProps } from "./types";

export default function NotifyProps({ config, onUpdate }: NodeConfigProps) {
  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs text-text-secondary">Title</label>
        <input
          type="text"
          value={(config.title as string) ?? ""}
          onChange={(e) => onUpdate({ ...config, title: e.target.value })}
          placeholder="Welcome to AnglerPass!"
          className="w-full rounded-md border border-stone-light/30 px-3 py-1.5 text-sm text-text-primary placeholder:text-text-light"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-text-secondary">
          Body (optional)
        </label>
        <textarea
          value={(config.body as string) ?? ""}
          onChange={(e) => onUpdate({ ...config, body: e.target.value })}
          rows={3}
          placeholder="Here's how to get started..."
          className="w-full rounded-md border border-stone-light/30 px-3 py-1.5 text-sm text-text-primary placeholder:text-text-light"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-text-secondary">
          Action URL (optional)
        </label>
        <input
          type="text"
          value={(config.action_url as string) ?? ""}
          onChange={(e) => onUpdate({ ...config, action_url: e.target.value })}
          placeholder="/dashboard or https://..."
          className="w-full rounded-md border border-stone-light/30 px-3 py-1.5 text-sm text-text-primary placeholder:text-text-light"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-text-secondary">
          Category
        </label>
        <select
          value={(config.category as string) ?? "workflow"}
          onChange={(e) => onUpdate({ ...config, category: e.target.value })}
          className="w-full rounded-md border border-stone-light/30 px-3 py-1.5 text-sm text-text-primary"
        >
          <option value="general">General</option>
          <option value="marketing">Marketing</option>
          <option value="booking">Booking</option>
          <option value="system">System</option>
          <option value="workflow">Workflow</option>
        </select>
      </div>
    </div>
  );
}
