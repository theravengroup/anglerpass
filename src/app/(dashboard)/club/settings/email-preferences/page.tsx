"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Mail,
  Megaphone,
  Target,
  Newspaper,
  CalendarDays,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Preferences {
  membership_id: string;
  club_id: string;
  email_broadcasts: boolean;
  email_targeted: boolean;
  email_digest: boolean;
  email_event_notices: boolean;
}

const PREF_ITEMS = [
  {
    key: "email_broadcasts" as const,
    label: "Broadcasts",
    description: "Club-wide announcements and updates",
    icon: Megaphone,
    color: "text-river",
    bg: "bg-river/10",
  },
  {
    key: "email_targeted" as const,
    label: "Targeted Messages",
    description: "Messages sent to your member group or segment",
    icon: Target,
    color: "text-bronze",
    bg: "bg-bronze/10",
  },
  {
    key: "email_digest" as const,
    label: "Weekly Digest",
    description: "Summary of club activity and upcoming events",
    icon: Newspaper,
    color: "text-forest",
    bg: "bg-forest/10",
  },
  {
    key: "email_event_notices" as const,
    label: "Event Notices",
    description: "Notifications about new events and registration",
    icon: CalendarDays,
    color: "text-charcoal",
    bg: "bg-charcoal/10",
  },
];

export default function EmailPreferencesPage() {
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [membershipId, setMembershipId] = useState<string | null>(null);
  const [clubId, setClubId] = useState<string | null>(null);

  useEffect(() => {
    loadMembership();
  }, []);

  async function loadMembership() {
    try {
      const res = await fetch("/api/clubs");
      const json = await res.json();
      // Get the first club the user is a member of
      const memberOf = json.member_of?.[0] ?? json.staff_of?.[0] ?? json.owned?.[0];
      if (memberOf) {
        setClubId(memberOf.id);
        // Get membership id
        const memberRes = await fetch(`/api/clubs`);
        const memberJson = await memberRes.json();
        const membership = memberJson.member_of?.find(
          (c: { id: string }) => c.id === memberOf.id
        )?.membership_id ??
          memberJson.staff_of?.find(
            (c: { id: string }) => c.id === memberOf.id
          )?.membership_id ??
          memberJson.owned?.find(
            (c: { id: string }) => c.id === memberOf.id
          )?.membership_id;

        if (membership) {
          setMembershipId(membership);
          await loadPreferences(membership, memberOf.id);
        }
      }
    } catch {
      // Handle silently
    } finally {
      setLoading(false);
    }
  }

  async function loadPreferences(memId: string, cId: string) {
    try {
      const res = await fetch(
        `/api/clubos/preferences?membership_id=${memId}&club_id=${cId}`
      );
      if (res.ok) {
        const json = await res.json();
        setPrefs(json.preferences);
      }
    } catch {
      // Handle silently
    }
  }

  async function togglePref(
    key: keyof Omit<Preferences, "membership_id" | "club_id">
  ) {
    if (!prefs || !membershipId || !clubId) return;

    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    setSaving(true);
    setSaved(false);

    try {
      await fetch("/api/clubos/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          membership_id: membershipId,
          club_id: clubId,
          [key]: updated[key],
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // Revert on failure
      setPrefs({ ...prefs });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-5xl items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-river" />
      </div>
    );
  }

  if (!prefs) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <nav className="flex items-center gap-1.5 text-sm text-text-light">
          <Link
            href="/club"
            className="transition-colors hover:text-text-secondary"
          >
            Dashboard
          </Link>
          <ChevronRight className="size-3.5" />
          <span className="text-text-primary font-medium">
            Email Preferences
          </span>
        </nav>
        <p className="text-sm text-text-secondary">
          No club membership found. Join a club to manage your email&nbsp;preferences.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-text-light">
        <Link
          href="/club"
          className="transition-colors hover:text-text-secondary"
        >
          Dashboard
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-text-primary font-medium">
          Email Preferences
        </span>
      </nav>

      <div>
        <h2 className="font-heading text-2xl font-semibold text-text-primary">
          Email Preferences
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Choose which club communications you&rsquo;d like to&nbsp;receive.
          Transactional emails (booking confirmations, payment receipts) are
          always&nbsp;sent.
        </p>
      </div>

      {/* Status */}
      {saved && (
        <div className="flex items-center gap-2 text-sm text-forest">
          <CheckCircle2 className="size-4" />
          Preferences saved
        </div>
      )}

      {/* Preference Toggles */}
      <Card className="border-stone-light/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="size-4 text-river" />
            Club Communications
          </CardTitle>
          <CardDescription>
            Toggle each type of email on or off
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-stone-light/10">
            {PREF_ITEMS.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between py-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex size-10 items-center justify-center rounded-lg ${item.bg}`}
                  >
                    <item.icon className={`size-5 ${item.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {item.label}
                    </p>
                    <p className="text-xs text-text-light">
                      {item.description}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => togglePref(item.key)}
                  disabled={saving}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                    prefs[item.key] ? "bg-forest" : "bg-stone-light/30"
                  }`}
                  role="switch"
                  aria-checked={prefs[item.key]}
                  aria-label={`Toggle ${item.label}`}
                >
                  <span
                    className={`inline-block size-4 rounded-full bg-white shadow-sm transition-transform ${
                      prefs[item.key] ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-text-light">
        To unsubscribe from all AnglerPass emails, use the unsubscribe link in
        any email footer. Club-specific preferences only affect communications
        from this&nbsp;club.
      </p>
    </div>
  );
}
