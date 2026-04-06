"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Smartphone, Loader2, Check } from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────

interface SmsProfile {
  phone: string | null;
  sms_consent: boolean;
  sms_consent_at: string | null;
  sms_consent_revoked_at: string | null;
}

// ─── Phone Formatting ───────────────────────────────────────────────

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  const d =
    digits.startsWith("1") && digits.length > 10 ? digits.slice(1) : digits;
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 10)}`;
}

function displayPhone(e164: string): string {
  const digits = e164.replace(/\D/g, "");
  const d = digits.startsWith("1") ? digits.slice(1) : digits;
  if (d.length === 10) {
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  }
  return e164;
}

// ─── Component ──────────────────────────────────────────────────────

export default function SettingsSmsCard() {
  const [data, setData] = useState<SmsProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/profile/sms-consent");
        if (res.ok) {
          const json = await res.json();
          setData(json.profile);
          if (json.profile?.phone) {
            setPhone(json.profile.phone.replace(/\D/g, ""));
          }
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const phoneDigits = phone.replace(/\D/g, "");
  const isValidPhone = /^\d{10,11}$/.test(phoneDigits);

  async function handleEnable() {
    if (!isValidPhone || !agreed) return;
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch("/api/profile/sms-consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, consented: true }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Failed to save");
      }
      const json = await res.json();
      setData(json.profile);
      setSaved(true);
      setAgreed(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleRevoke() {
    setRevoking(true);
    setError(null);
    try {
      const res = await fetch("/api/profile/sms-consent", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to revoke");
      const json = await res.json();
      setData(json.profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setRevoking(false);
    }
  }

  if (loading) {
    return (
      <Card className="border-stone-light/20">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="size-5 animate-spin text-text-light" />
        </CardContent>
      </Card>
    );
  }

  const isConsented = data?.sms_consent === true;

  return (
    <Card className="border-stone-light/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Smartphone className="size-5 text-river" />
          SMS Notifications
        </CardTitle>
        <CardDescription>
          Receive trip alerts and booking updates via text message.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConsented ? (
          <>
            {/* Current consent info */}
            <div className="rounded-lg border border-forest/20 bg-forest/5 px-4 py-3">
              <div className="flex items-center gap-2">
                <Check className="size-4 text-forest" />
                <span className="text-sm font-medium text-text-primary">
                  SMS enabled
                </span>
              </div>
              {data?.phone && (
                <p className="mt-1 text-xs text-text-secondary">
                  Sending to {displayPhone(data.phone)}
                </p>
              )}
              {data?.sms_consent_at && (
                <p className="mt-0.5 text-xs text-text-light">
                  Opted in{" "}
                  {new Date(data.sms_consent_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>

            {/* Update phone */}
            <div className="space-y-1.5">
              <Label
                htmlFor="settings-sms-phone"
                className="text-sm font-medium text-text-primary"
              >
                Update phone number
              </Label>
              <div className="flex gap-2">
                <Input
                  id="settings-sms-phone"
                  type="tel"
                  inputMode="numeric"
                  value={formatPhone(phone)}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  className="max-w-xs"
                  autoComplete="tel"
                />
                <Button
                  variant="outline"
                  onClick={handleEnable}
                  disabled={!isValidPhone || saving}
                  className="border-river/30 text-river"
                >
                  {saving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Update"
                  )}
                </Button>
              </div>
              <p className="text-xs text-text-light">
                Updating your phone number requires re-consenting to SMS.
              </p>
              {/* Checkbox for re-consent when updating */}
              <label className="flex items-start gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 size-4 shrink-0 rounded border-stone-light/40 accent-forest"
                />
                <span className="text-xs text-text-secondary">
                  I agree to the{" "}
                  <Link
                    href="/policies#sms-terms"
                    className="text-river underline"
                  >
                    SMS Terms
                  </Link>
                </span>
              </label>
            </div>

            {/* Revoke */}
            <div className="border-t border-stone-light/20 pt-4">
              <Button
                variant="outline"
                onClick={handleRevoke}
                disabled={revoking}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                {revoking ? (
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                ) : null}
                Turn Off SMS Notifications
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Enable flow */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label
                  htmlFor="settings-sms-phone-new"
                  className="text-sm font-medium text-text-primary"
                >
                  Mobile number
                </Label>
                <Input
                  id="settings-sms-phone-new"
                  type="tel"
                  inputMode="numeric"
                  placeholder="(555) 123-4567"
                  value={formatPhone(phone)}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  className="max-w-xs"
                  autoComplete="tel"
                />
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 size-4 shrink-0 rounded border-stone-light/40 accent-forest"
                />
                <span className="text-xs leading-relaxed text-text-secondary">
                  I agree to receive text messages from AnglerPass including
                  booking confirmations, trip reminders, and account
                  notifications. Message frequency varies. Message and data rates
                  may apply. Reply STOP to unsubscribe at any time. View our{" "}
                  <Link href="/privacy" className="text-river underline">
                    Privacy Policy
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/policies#sms-terms"
                    className="text-river underline"
                  >
                    SMS Terms
                  </Link>
                  .
                </span>
              </label>

              <Button
                onClick={handleEnable}
                disabled={!isValidPhone || !agreed || saving}
                className="bg-river text-white hover:bg-river/90"
              >
                {saving && (
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                )}
                Enable SMS Notifications
              </Button>
            </div>

            {data?.sms_consent_revoked_at && (
              <p className="text-xs text-text-light">
                Previously opted out on{" "}
                {new Date(data.sms_consent_revoked_at).toLocaleDateString(
                  "en-US",
                  { month: "short", day: "numeric", year: "numeric" }
                )}
              </p>
            )}
          </>
        )}

        {/* Error */}
        {error && (
          <p className="text-sm text-red-600" role="alert" aria-live="polite">
            {error}
          </p>
        )}

        {/* Saved feedback */}
        {saved && (
          <span className="flex items-center gap-1 text-sm text-forest">
            <Check className="size-4" />
            Phone updated
          </span>
        )}
      </CardContent>
    </Card>
  );
}
