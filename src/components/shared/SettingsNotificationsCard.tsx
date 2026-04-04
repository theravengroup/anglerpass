"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Loader2, Check } from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────

interface Preferences {
  email_booking_requested: boolean;
  email_booking_confirmed: boolean;
  email_booking_declined: boolean;
  email_booking_cancelled: boolean;
  email_member_invited: boolean;
  email_member_approved: boolean;
  email_property_access: boolean;
}

const PREF_LABELS: {
  key: keyof Preferences;
  label: string;
  description: string;
}[] = [
  {
    key: "email_booking_requested",
    label: "Booking Requests",
    description: "When an angler requests to book your property",
  },
  {
    key: "email_booking_confirmed",
    label: "Booking Confirmed",
    description: "When a landowner confirms your booking",
  },
  {
    key: "email_booking_declined",
    label: "Booking Declined",
    description: "When a landowner declines your booking",
  },
  {
    key: "email_booking_cancelled",
    label: "Booking Cancelled",
    description: "When an angler cancels a booking at your property",
  },
  {
    key: "email_member_invited",
    label: "Club Invitations",
    description: "When you're invited to join a club",
  },
  {
    key: "email_member_approved",
    label: "Membership Approved",
    description: "When your club membership is approved",
  },
  {
    key: "email_property_access",
    label: "Property Access",
    description: "When your club gains access to a new property",
  },
];

// ─── Component ──────────────────────────────────────────────────────

interface SettingsNotificationsCardProps {
  initialPrefs: Preferences;
}

export default function SettingsNotificationsCard({
  initialPrefs,
}: SettingsNotificationsCardProps) {
  const [prefs, setPrefs] = useState<Preferences>(initialPrefs);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const togglePref = (key: keyof Preferences) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const savePrefs = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      alert("Failed to save preferences.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-stone-light/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bell className="size-5 text-bronze" />
          Email Notifications
        </CardTitle>
        <CardDescription>
          Choose which events you want to receive email notifications for.
          You&apos;ll always receive in-app notifications.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {PREF_LABELS.map(({ key, label, description }) => (
          <label
            key={key}
            className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-3 transition-colors hover:bg-stone-light/10"
          >
            <div>
              <p className="text-sm font-medium text-text-primary">
                {label}
              </p>
              <p className="text-xs text-text-light">{description}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={prefs[key]}
              onClick={() => togglePref(key)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                prefs[key] ? "bg-forest" : "bg-stone-light/40"
              }`}
            >
              <span
                className={`pointer-events-none inline-block size-5 rounded-full bg-white shadow-sm transition-transform ${
                  prefs[key] ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </label>
        ))}

        <div className="flex items-center justify-end gap-3 pt-4">
          {saved && (
            <span className="flex items-center gap-1 text-sm text-forest">
              <Check className="size-4" />
              Saved
            </span>
          )}
          <Button
            onClick={savePrefs}
            disabled={saving}
            className="bg-forest text-white hover:bg-forest/90"
          >
            {saving && (
              <Loader2 className="mr-1.5 size-4 animate-spin" />
            )}
            Save Preferences
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
