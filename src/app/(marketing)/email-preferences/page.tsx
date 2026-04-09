"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Mail, Check, Shield } from "lucide-react";

interface TopicPref {
  topic_id: string;
  slug: string;
  name: string;
  description: string | null;
  is_required: boolean;
  subscribed: boolean;
}

export default function EmailPreferencesPage() {
  const [prefs, setPrefs] = useState<TopicPref[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/crm/preferences");
      if (res.ok) {
        const data = await res.json();
        setPrefs(data.preferences ?? []);
      } else if (res.status === 401) {
        setError("Please log in to manage your email preferences.");
      }
    } catch {
      setError("Failed to load preferences.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleTopic = (topicId: string) => {
    setPrefs((prev) =>
      prev.map((p) =>
        p.topic_id === topicId && !p.is_required
          ? { ...p, subscribed: !p.subscribed }
          : p
      )
    );
    setSaved(false);
  };

  const savePrefs = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/crm/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptions: prefs.map((p) => ({
            topic_id: p.topic_id,
            subscribed: p.subscribed,
          })),
        }),
      });
      if (res.ok) {
        setSaved(true);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <div className="text-center">
        <Mail className="mx-auto size-10 text-forest" />
        <h1 className="mt-4 font-heading text-2xl font-semibold text-text-primary">
          Email Preferences
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Choose which types of emails you&rsquo;d like to receive
          from&nbsp;AnglerPass.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-charcoal" />
        </div>
      ) : error ? (
        <div className="mt-8 rounded-lg border border-stone-light/20 bg-white p-6 text-center">
          <p className="text-sm text-text-secondary">{error}</p>
          <a
            href="/login"
            className="mt-3 inline-block rounded-md bg-forest px-4 py-2 text-sm font-medium text-white hover:bg-forest-deep"
          >
            Log In
          </a>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          <div className="divide-y divide-stone-light/10 rounded-lg border border-stone-light/20 bg-white">
            {prefs.map((pref) => (
              <label
                key={pref.topic_id}
                className={`flex items-start gap-3 px-4 py-4 ${
                  pref.is_required ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-offwhite/50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={pref.subscribed}
                  onChange={() => toggleTopic(pref.topic_id)}
                  disabled={pref.is_required}
                  className="mt-0.5 rounded border-stone-light/30 text-forest focus:ring-forest disabled:cursor-not-allowed"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-primary">
                      {pref.name}
                    </span>
                    {pref.is_required && (
                      <span className="flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                        <Shield className="size-2.5" />
                        Required
                      </span>
                    )}
                  </div>
                  {pref.description && (
                    <p className="mt-0.5 text-xs text-text-light">
                      {pref.description}
                    </p>
                  )}
                </div>
              </label>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div>
              {saved && (
                <span className="flex items-center gap-1 text-xs text-forest">
                  <Check className="size-3.5" />
                  Preferences saved
                </span>
              )}
            </div>
            <button
              onClick={savePrefs}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-md bg-forest px-4 py-2 text-sm font-medium text-white hover:bg-forest-deep disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Save Preferences"
              )}
            </button>
          </div>

          <p className="text-center text-xs text-text-light">
            You can also{" "}
            <a href="/api/notifications/unsubscribe" className="underline hover:text-text-secondary">
              unsubscribe from all emails
            </a>
            .
          </p>
        </div>
      )}
    </div>
  );
}
