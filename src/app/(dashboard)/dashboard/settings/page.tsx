"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Loader2, Check, Settings } from "lucide-react";

interface Preferences {
  email_booking_requested: boolean;
  email_booking_confirmed: boolean;
  email_booking_declined: boolean;
  email_booking_cancelled: boolean;
  email_member_invited: boolean;
  email_member_approved: boolean;
  email_property_access: boolean;
}

const PREF_LABELS: { key: keyof Preferences; label: string; description: string }[] = [
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

const DEFAULTS: Preferences = {
  email_booking_requested: true,
  email_booking_confirmed: true,
  email_booking_declined: true,
  email_booking_cancelled: true,
  email_member_invited: true,
  email_member_approved: true,
  email_property_access: true,
};

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/notifications/preferences");
        if (res.ok) {
          const data = await res.json();
          setPrefs({ ...DEFAULTS, ...data.preferences });
        }
      } catch {
        // use defaults
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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
      // silent
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto flex max-w-3xl items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-forest" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
          Settings
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Manage your account and notification preferences.
        </p>
      </div>

      {/* Notification Preferences */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="size-5 text-river" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Choose which events you want to receive email notifications for.
            You'll always receive in-app notifications.
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
              {saving ? (
                <Loader2 className="mr-1.5 size-4 animate-spin" />
              ) : null}
              Save Preferences
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Profile & Security placeholders */}
      <Card className="border-stone-light/20">
        <CardContent className="py-6">
          <div className="flex items-start gap-3">
            <Settings className="mt-0.5 size-5 shrink-0 text-text-secondary" />
            <div>
              <p className="text-sm font-medium text-text-primary">
                Profile & Security settings coming soon
              </p>
              <p className="mt-1 text-xs text-text-light">
                Account management, password changes, and login session
                management will be available in a future update.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
