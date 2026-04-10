"use client";

import type { NodeConfigProps } from "./types";

export default function SendEmailProps({ config, onUpdate }: NodeConfigProps) {
  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs text-text-secondary">Subject</label>
        <input
          type="text"
          value={(config.subject as string) ?? ""}
          onChange={(e) => onUpdate({ ...config, subject: e.target.value })}
          placeholder="Email subject line..."
          className="w-full rounded-md border border-stone-light/30 px-3 py-1.5 text-sm text-text-primary placeholder:text-text-light"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-text-secondary">
          Email Body (HTML)
        </label>
        <textarea
          value={(config.html_body as string) ?? ""}
          onChange={(e) => onUpdate({ ...config, html_body: e.target.value })}
          rows={6}
          placeholder="<p>Hi {{ user.name }},</p>"
          className="w-full rounded-md border border-stone-light/30 px-3 py-1.5 font-mono text-xs text-text-primary placeholder:text-text-light"
        />
        <p className="mt-1 text-[10px] text-text-light">
          Supports Liquid templates: {"{{ user.name }}"}, {"{% if %}"}, etc.
        </p>
      </div>
      <div>
        <label className="mb-1 block text-xs text-text-secondary">
          From Name
        </label>
        <input
          type="text"
          value={(config.from_name as string) ?? ""}
          onChange={(e) => onUpdate({ ...config, from_name: e.target.value })}
          placeholder="AnglerPass"
          className="w-full rounded-md border border-stone-light/30 px-3 py-1.5 text-sm text-text-primary placeholder:text-text-light"
        />
      </div>
    </div>
  );
}
