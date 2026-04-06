"use client";

import { useState } from "react";
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
import {
  Smartphone,
  Check,
  Loader2,
  X,
} from "lucide-react";

// ─── Types ─────────��────────────────────────────────────────────────

interface SmsConsentFormProps {
  /** Called after the user successfully opts in */
  onConsented?: () => void;
  /** Called when the user dismisses the card */
  onDismiss?: () => void;
}

// ─── Phone Formatting ───────────────────────────────────────────────

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  // Strip leading "1" country code for display
  const d = digits.startsWith("1") && digits.length > 10 ? digits.slice(1) : digits;
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 10)}`;
}

// ─── Component ──────────────────────────────────────────────────────

export default function SmsConsentForm({
  onConsented,
  onDismiss,
}: SmsConsentFormProps) {
  const [phone, setPhone] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const phoneDigits = phone.replace(/\D/g, "");
  const isValidPhone = /^\d{10}$/.test(
    phoneDigits.startsWith("1") && phoneDigits.length === 11
      ? phoneDigits.slice(1)
      : phoneDigits
  );
  const canSubmit = isValidPhone && agreed && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/profile/sms-consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, consented: true }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save");
      }

      setSuccess(true);
      onConsented?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  // Success state
  if (success) {
    return (
      <Card className="border-forest/20 bg-forest/5">
        <CardContent className="flex items-start gap-3 py-4">
          <Check className="size-5 shrink-0 text-forest" />
          <div>
            <p className="text-sm font-medium text-text-primary">
              SMS notifications enabled
            </p>
            <p className="text-xs text-text-secondary">
              You&rsquo;ll receive trip alerts and booking updates on your phone.
              Manage this in{" "}
              <Link
                href="/dashboard/settings"
                className="text-river underline"
              >
                Settings
              </Link>
              .
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-stone-light/20">
      <CardHeader className="relative">
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="absolute right-4 top-4 rounded-md p-1 text-text-light transition-colors hover:bg-stone-light/10 hover:text-text-secondary"
            aria-label="Dismiss SMS notification card"
          >
            <X className="size-4" />
          </button>
        )}
        <CardTitle className="flex items-center gap-2 text-lg">
          <Smartphone className="size-5 text-river" />
          Get Trip Alerts on Your Phone
        </CardTitle>
        <CardDescription>
          Optional &mdash; you can always enable this later in settings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Phone input */}
          <div className="space-y-1.5">
            <Label htmlFor="sms-phone" className="text-sm font-medium text-text-primary">
              Mobile number
            </Label>
            <Input
              id="sms-phone"
              type="tel"
              inputMode="numeric"
              placeholder="(555) 123-4567"
              value={formatPhone(phone)}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              className="max-w-xs"
              autoComplete="tel"
            />
          </div>

          {/* TCPA consent checkbox */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 size-4 shrink-0 rounded border-stone-light/40 accent-forest"
            />
            <span className="text-xs leading-relaxed text-text-secondary">
              I agree to receive text messages from AnglerPass including booking
              confirmations, trip reminders, and account notifications. Message
              frequency varies. Message and data rates may apply. Reply STOP to
              unsubscribe at any time. View our{" "}
              <Link href="/privacy" className="text-river underline">
                Privacy Policy
              </Link>{" "}
              and{" "}
              <Link href="/policies#sms-terms" className="text-river underline">
                SMS Terms
              </Link>
              .
            </span>
          </label>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600" role="alert" aria-live="polite">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={!canSubmit}
            className="bg-river text-white hover:bg-river/90"
          >
            {submitting && <Loader2 className="mr-1.5 size-4 animate-spin" />}
            Enable SMS Notifications
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
