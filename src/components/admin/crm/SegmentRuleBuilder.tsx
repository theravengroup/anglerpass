"use client";

import { useState } from "react";
import { Plus, Trash2, Users } from "lucide-react";
import type {
  SegmentCondition,
  SegmentRuleGroup,
  SegmentField,
  SegmentOperator,
} from "@/lib/crm/types";

// ─── Field Metadata ─────────────────────────────────────────────────

const FIELD_OPTIONS: { value: SegmentField; label: string; group: string }[] = [
  { value: "role", label: "User Role", group: "Profile" },
  { value: "created_at", label: "Signup Date", group: "Profile" },
  { value: "location", label: "Location", group: "Profile" },
  { value: "fishing_experience", label: "Fishing Experience", group: "Profile" },
  { value: "favorite_species", label: "Favorite Species", group: "Profile" },
  { value: "welcome_email_step", label: "Welcome Email Step", group: "Profile" },
  { value: "suspended_at", label: "Suspended", group: "Profile" },
  { value: "club_membership.club_id", label: "Club ID", group: "Membership" },
  { value: "club_membership.status", label: "Membership Status", group: "Membership" },
  { value: "booking_count", label: "Booking Count", group: "Activity" },
  { value: "last_booking_at", label: "Last Booking Date", group: "Activity" },
  { value: "has_booking", label: "Has Booking", group: "Activity" },
  { value: "lead.interest_type", label: "Lead Interest Type", group: "Lead" },
  { value: "lead.source", label: "Lead Source", group: "Lead" },
  { value: "engagement.last_opened_at", label: "Last Email Opened", group: "Engagement" },
  { value: "engagement.total_opens", label: "Total Email Opens", group: "Engagement" },
];

const OPERATOR_OPTIONS: { value: SegmentOperator; label: string }[] = [
  { value: "eq", label: "equals" },
  { value: "neq", label: "not equals" },
  { value: "gt", label: "greater than" },
  { value: "gte", label: "greater or equal" },
  { value: "lt", label: "less than" },
  { value: "lte", label: "less or equal" },
  { value: "in", label: "is one of" },
  { value: "not_in", label: "is not one of" },
  { value: "contains", label: "contains" },
  { value: "not_contains", label: "does not contain" },
  { value: "is_null", label: "is empty" },
  { value: "not_null", label: "is not empty" },
  { value: "between", label: "between" },
];

const NULLARY_OPS = new Set<SegmentOperator>(["is_null", "not_null"]);

// ─── Types ──────────────────────────────────────────────────────────

interface SegmentRuleBuilderProps {
  rules: SegmentRuleGroup[];
  onChange: (rules: SegmentRuleGroup[]) => void;
  onPreview?: () => void;
  previewCount?: number | null;
  previewLoading?: boolean;
}

// ─── Component ──────────────────────────────────────────────────────

export default function SegmentRuleBuilder({
  rules,
  onChange,
  onPreview,
  previewCount,
  previewLoading,
}: SegmentRuleBuilderProps) {
  const addGroup = () => {
    onChange([
      ...rules,
      { match: "all", conditions: [{ field: "role", op: "eq", value: "" }] },
    ]);
  };

  const removeGroup = (groupIndex: number) => {
    onChange(rules.filter((_, i) => i !== groupIndex));
  };

  const updateGroup = (groupIndex: number, group: SegmentRuleGroup) => {
    const updated = [...rules];
    updated[groupIndex] = group;
    onChange(updated);
  };

  const addCondition = (groupIndex: number) => {
    const group = { ...rules[groupIndex] };
    group.conditions = [
      ...group.conditions,
      { field: "role" as SegmentField, op: "eq" as SegmentOperator, value: "" },
    ];
    updateGroup(groupIndex, group);
  };

  const removeCondition = (groupIndex: number, condIndex: number) => {
    const group = { ...rules[groupIndex] };
    group.conditions = group.conditions.filter((_, i) => i !== condIndex);
    if (group.conditions.length === 0) {
      removeGroup(groupIndex);
    } else {
      updateGroup(groupIndex, group);
    }
  };

  const updateCondition = (
    groupIndex: number,
    condIndex: number,
    condition: SegmentCondition
  ) => {
    const group = { ...rules[groupIndex] };
    group.conditions = [...group.conditions];
    group.conditions[condIndex] = condition;
    updateGroup(groupIndex, group);
  };

  return (
    <div className="space-y-4">
      {rules.map((group, gi) => (
        <div
          key={gi}
          className="rounded-lg border border-stone-light/30 bg-white p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-text-secondary">
                Match
              </span>
              <select
                value={group.match}
                onChange={(e) =>
                  updateGroup(gi, {
                    ...group,
                    match: e.target.value as "all" | "any",
                  })
                }
                className="rounded border border-stone-light/30 px-2 py-1 text-xs text-text-primary"
              >
                <option value="all">ALL conditions</option>
                <option value="any">ANY condition</option>
              </select>
            </div>
            {rules.length > 1 && (
              <button
                onClick={() => removeGroup(gi)}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Remove group
              </button>
            )}
          </div>

          <div className="space-y-2">
            {group.conditions.map((cond, ci) => (
              <ConditionRow
                key={ci}
                condition={cond}
                onChange={(c) => updateCondition(gi, ci, c)}
                onRemove={() => removeCondition(gi, ci)}
                canRemove={group.conditions.length > 1}
              />
            ))}
          </div>

          <button
            onClick={() => addCondition(gi)}
            className="mt-2 flex items-center gap-1 text-xs text-river hover:text-river/80"
          >
            <Plus className="size-3" />
            Add condition
          </button>
        </div>
      ))}

      {rules.length > 1 && (
        <p className="text-center text-xs text-text-secondary">
          Groups are combined with OR
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={addGroup}
          className="flex items-center gap-1 rounded-md border border-stone-light/30 px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-offwhite"
        >
          <Plus className="size-3" />
          Add rule group
        </button>

        {onPreview && (
          <button
            onClick={onPreview}
            disabled={previewLoading}
            className="flex items-center gap-1 rounded-md bg-river/10 px-3 py-1.5 text-xs font-medium text-river hover:bg-river/20 disabled:opacity-50"
          >
            <Users className="size-3" />
            {previewLoading
              ? "Counting..."
              : previewCount !== null && previewCount !== undefined
                ? `${previewCount.toLocaleString()} match${previewCount === 1 ? "" : "es"}`
                : "Preview audience"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Condition Row ──────────────────────────────────────────────────

function ConditionRow({
  condition,
  onChange,
  onRemove,
  canRemove,
}: {
  condition: SegmentCondition;
  onChange: (c: SegmentCondition) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const isNullary = NULLARY_OPS.has(condition.op);

  return (
    <div className="flex items-center gap-2">
      {/* Field */}
      <select
        value={condition.field}
        onChange={(e) =>
          onChange({ ...condition, field: e.target.value as SegmentField })
        }
        className="flex-1 rounded border border-stone-light/30 px-2 py-1.5 text-xs text-text-primary"
      >
        {FIELD_OPTIONS.map((f) => (
          <option key={f.value} value={f.value}>
            {f.group}: {f.label}
          </option>
        ))}
      </select>

      {/* Operator */}
      <select
        value={condition.op}
        onChange={(e) => {
          const op = e.target.value as SegmentOperator;
          onChange({
            ...condition,
            op,
            value: NULLARY_OPS.has(op) ? null : condition.value,
          });
        }}
        className="w-36 rounded border border-stone-light/30 px-2 py-1.5 text-xs text-text-primary"
      >
        {OPERATOR_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {/* Value */}
      {!isNullary && (
        <input
          type="text"
          value={
            Array.isArray(condition.value)
              ? condition.value.join(", ")
              : String(condition.value ?? "")
          }
          onChange={(e) => {
            const raw = e.target.value;
            // For array operators, split by comma
            if (condition.op === "in" || condition.op === "not_in") {
              onChange({
                ...condition,
                value: raw.split(",").map((s) => s.trim()),
              });
            } else {
              onChange({ ...condition, value: raw });
            }
          }}
          placeholder={
            condition.op === "in" || condition.op === "not_in"
              ? "value1, value2, ..."
              : "value"
          }
          className="flex-1 rounded border border-stone-light/30 px-2 py-1.5 text-xs text-text-primary placeholder:text-text-light"
        />
      )}

      {/* Remove */}
      {canRemove && (
        <button
          onClick={onRemove}
          className="rounded p-1 text-stone hover:text-red-500"
          aria-label="Remove condition"
        >
          <Trash2 className="size-3.5" />
        </button>
      )}
    </div>
  );
}
