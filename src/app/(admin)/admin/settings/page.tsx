"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Settings,
  Loader2,
  Check,
  DollarSign,
  CalendarClock,
  Image,
  Network,
} from "lucide-react";
import AdminPageGuard from "@/components/admin/AdminPageGuard";

interface SettingEntry {
  value: string | number | boolean;
  description: string;
  updated_at: string;
}

type SettingsMap = Record<string, SettingEntry>;

interface SettingFieldProps {
  settingKey: string;
  label: string;
  setting: SettingEntry | undefined;
  type: "number" | "boolean";
  min?: number;
  max?: number;
  step?: number;
  localValue: string | number | boolean | undefined;
  onLocalChange: (key: string, value: string | number | boolean) => void;
  dirty: boolean;
  saving: boolean;
  saved: boolean;
  onSave: (key: string) => void;
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function SettingField({
  settingKey,
  label,
  setting,
  type,
  min,
  max,
  step,
  localValue,
  onLocalChange,
  dirty,
  saving,
  saved,
  onSave,
}: SettingFieldProps) {
  if (!setting) return null;

  return (
    <div className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <Label
            htmlFor={settingKey}
            className="text-sm font-medium text-text-primary"
          >
            {label}
          </Label>
          <p className="mt-0.5 text-xs text-text-secondary">
            {setting.description}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {type === "boolean" ? (
            <button
              type="button"
              role="switch"
              aria-checked={Boolean(localValue)}
              onClick={() => onLocalChange(settingKey, !localValue)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                localValue ? "bg-forest" : "bg-stone-light/40"
              }`}
            >
              <span
                className={`pointer-events-none inline-block size-5 rounded-full bg-white shadow-sm transition-transform ${
                  localValue ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          ) : (
            <Input
              id={settingKey}
              type="number"
              min={min}
              max={max}
              step={step ?? 1}
              value={String(localValue ?? "")}
              onChange={(e) => onLocalChange(settingKey, e.target.value)}
              className="h-9 w-24 text-right text-sm"
            />
          )}
          <Button
            variant="outline"
            size="sm"
            disabled={!dirty || saving}
            onClick={() => onSave(settingKey)}
            className="h-9 w-16 text-xs"
          >
            {saving ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : saved ? (
              <Check className="size-3.5 text-forest" />
            ) : (
              "Save"
            )}
          </Button>
        </div>
      </div>
      <p className="text-[11px] text-text-light">
        Last updated: {formatRelativeTime(setting.updated_at)}
      </p>
    </div>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsMap>({});
  const [localValues, setLocalValues] = useState<
    Record<string, string | number | boolean>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set());
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings");
      if (!res.ok) throw new Error("Failed to load settings");
      const data = await res.json();
      setSettings(data);
      // Initialize local values from fetched settings
      const initial: Record<string, string | number | boolean> = {};
      for (const [key, entry] of Object.entries(data) as [
        string,
        SettingEntry,
      ][]) {
        initial[key] = entry.value;
      }
      setLocalValues(initial);
    } catch {
      setError("Unable to load platform settings. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function handleLocalChange(key: string, value: string | number | boolean) {
    setLocalValues((prev) => ({ ...prev, [key]: value }));
    // Clear saved indicator when editing
    setSavedKeys((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }

  function isDirty(key: string): boolean {
    if (!(key in settings)) return false;
    const original = settings[key].value;
    const local = localValues[key];
    // For number fields, compare as numbers
    if (typeof original === "number") {
      return Number(local) !== original;
    }
    return local !== original;
  }

  async function handleSave(key: string) {
    setSavingKeys((prev) => new Set(prev).add(key));
    try {
      let value: string | number | boolean = localValues[key];
      // Coerce number fields
      if (typeof settings[key].value === "number") {
        value = Number(value);
      }

      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error ?? "Failed to save setting");
        return;
      }

      const updated = await res.json();
      // Update the settings map with the returned data
      setSettings((prev) => ({
        ...prev,
        [key]: updated[key] ?? { ...prev[key], value, updated_at: new Date().toISOString() },
      }));

      setSavedKeys((prev) => new Set(prev).add(key));
      // Clear the saved indicator after 3 seconds
      setTimeout(() => {
        setSavedKeys((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }, 3000);
    } catch {
      alert("An error occurred while saving.");
    } finally {
      setSavingKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }

  if (loading) {
    return (
      <AdminPageGuard path="/admin/settings">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="size-6 animate-spin text-river" />
        </div>
      </div>
      </AdminPageGuard>
    );
  }

  if (error) {
    return (
      <AdminPageGuard path="/admin/settings">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
            Platform Settings
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Configure system-wide settings and fee structures
          </p>
        </div>
        <Card className="border-stone-light/20">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex size-14 items-center justify-center rounded-full bg-red-50">
              <Settings className="size-6 text-red-400" />
            </div>
            <h3 className="mt-4 text-base font-medium text-text-primary">
              {error}
            </h3>
            <Button variant="outline" size="sm" className="mt-4" onClick={load}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
      </AdminPageGuard>
    );
  }

  function fieldProps(
    key: string,
    label: string,
    type: "number" | "boolean",
    opts?: { min?: number; max?: number; step?: number }
  ): SettingFieldProps {
    return {
      settingKey: key,
      label,
      setting: settings[key],
      type,
      min: opts?.min,
      max: opts?.max,
      step: opts?.step,
      localValue: localValues[key],
      onLocalChange: handleLocalChange,
      dirty: isDirty(key),
      saving: savingKeys.has(key),
      saved: savedKeys.has(key),
      onSave: handleSave,
    };
  }

  return (
    <AdminPageGuard path="/admin/settings">
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
          Platform Settings
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Configure system-wide settings and fee structures
        </p>
      </div>

      {/* Fee Structure */}
      <Card className="border-stone-light/20">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-bronze/10">
              <DollarSign className="size-4 text-bronze" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-text-primary">
                Fee Structure
              </CardTitle>
              <CardDescription className="text-xs text-text-secondary">
                Platform fees and staff discount rates
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="divide-y divide-stone-light/15">
          <SettingField
            {...fieldProps("platform_fee_percentage", "Platform Fee (%)", "number", {
              min: 0,
              max: 100,
              step: 0.5,
            })}
          />
          <SettingField
            {...fieldProps(
              "staff_discount_own_club",
              "Staff Discount - Own Club (%)",
              "number",
              { min: 0, max: 100, step: 1 }
            )}
          />
          <SettingField
            {...fieldProps(
              "staff_discount_cross_club",
              "Staff Discount - Cross Club (%)",
              "number",
              { min: 0, max: 100, step: 1 }
            )}
          />
        </CardContent>
      </Card>

      {/* Booking Rules */}
      <Card className="border-stone-light/20">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-river/10">
              <CalendarClock className="size-4 text-river" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-text-primary">
                Booking Rules
              </CardTitle>
              <CardDescription className="text-xs text-text-secondary">
                Cancellation policies and booking constraints
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="divide-y divide-stone-light/15">
          <SettingField
            {...fieldProps(
              "booking_cancellation_hours",
              "Free Cancellation Window (hours)",
              "number",
              { min: 0, max: 168, step: 1 }
            )}
          />
        </CardContent>
      </Card>

      {/* Property Listings */}
      <Card className="border-stone-light/20">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-forest/10">
              <Image className="size-4 text-forest" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-text-primary">
                Property Listings
              </CardTitle>
              <CardDescription className="text-xs text-text-secondary">
                Limits and requirements for property listings
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="divide-y divide-stone-light/15">
          <SettingField
            {...fieldProps(
              "max_properties_per_owner",
              "Max Properties per Landowner",
              "number",
              { min: 1, max: 100, step: 1 }
            )}
          />
          <SettingField
            {...fieldProps(
              "require_photo_minimum",
              "Minimum Photos Required",
              "number",
              { min: 0, max: 20, step: 1 }
            )}
          />
        </CardContent>
      </Card>

      {/* Network */}
      <Card className="border-stone-light/20">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-river/10">
              <Network className="size-4 text-river" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-text-primary">
                Network
              </CardTitle>
              <CardDescription className="text-xs text-text-secondary">
                Cross-club network and connectivity settings
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="divide-y divide-stone-light/15">
          <SettingField
            {...fieldProps(
              "cross_club_network_enabled",
              "Cross-Club Network",
              "boolean"
            )}
          />
        </CardContent>
      </Card>
    </div>
    </AdminPageGuard>
  );
}
