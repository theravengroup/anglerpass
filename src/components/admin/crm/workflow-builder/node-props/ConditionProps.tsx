"use client";

import type { NodeConfigProps } from "./types";

export default function ConditionProps({ config, onUpdate }: NodeConfigProps) {
  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs text-text-secondary">Field</label>
        <select
          value={(config.field as string) ?? ""}
          onChange={(e) => onUpdate({ ...config, field: e.target.value })}
          className="w-full rounded-md border border-stone-light/30 px-3 py-1.5 text-sm text-text-primary"
        >
          <option value="">Select field...</option>
          <option value="user.role">User Role</option>
          <option value="user.has_booking">Has Booking</option>
          <option value="user.booking_count">Booking Count</option>
          <option value="engagement.opened_last_email">Opened Last Email</option>
          <option value="engagement.clicked_last_email">Clicked Last Email</option>
          <option value="user.days_since_signup">Days Since Signup</option>
          <option value="user.club_member">Is Club Member</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-text-secondary">
          Operator
        </label>
        <select
          value={(config.operator as string) ?? "eq"}
          onChange={(e) => onUpdate({ ...config, operator: e.target.value })}
          className="w-full rounded-md border border-stone-light/30 px-3 py-1.5 text-sm text-text-primary"
        >
          <option value="eq">Equals</option>
          <option value="neq">Not Equals</option>
          <option value="gt">Greater Than</option>
          <option value="lt">Less Than</option>
          <option value="contains">Contains</option>
          <option value="exists">Exists</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-text-secondary">Value</label>
        <input
          type="text"
          value={(config.value as string) ?? ""}
          onChange={(e) => onUpdate({ ...config, value: e.target.value })}
          placeholder="e.g. angler, true, 5"
          className="w-full rounded-md border border-stone-light/30 px-3 py-1.5 text-sm text-text-primary placeholder:text-text-light"
        />
      </div>
      <p className="text-[10px] text-text-light">
        &ldquo;Yes&rdquo; path when condition matches, &ldquo;No&rdquo; path&nbsp;otherwise.
      </p>
    </div>
  );
}
