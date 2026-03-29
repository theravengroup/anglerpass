"use client";

import { useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CalendarDays,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  ExternalLink,
} from "lucide-react";

interface CalendarSubscriptionProps {
  propertyId: string;
}

export default function CalendarSubscription({
  propertyId,
}: CalendarSubscriptionProps) {
  const [feedUrl, setFeedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const fetchToken = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/properties/${propertyId}/calendar-token`
      );
      if (!res.ok) {
        throw new Error("Failed to get calendar feed URL");
      }
      const data = await res.json();
      setFeedUrl(data.feed_url);
      setInitialized(true);
    } catch {
      setError("Could not load calendar feed. Try again.");
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  const regenerateToken = async () => {
    setRegenerating(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/properties/${propertyId}/calendar-token`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        throw new Error("Failed to regenerate token");
      }
      const data = await res.json();
      setFeedUrl(data.feed_url);
    } catch {
      setError("Could not regenerate feed URL. Try again.");
    } finally {
      setRegenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (!feedUrl) return;
    try {
      await navigator.clipboard.writeText(feedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement("input");
      input.value = feedUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="border-forest/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarDays className="size-4 text-forest" />
          Calendar Subscription
        </CardTitle>
        <CardDescription>
          Subscribe to your bookings in Apple Calendar, Google Calendar, or
          Outlook.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!initialized ? (
          <Button
            variant="outline"
            size="sm"
            onClick={fetchToken}
            disabled={loading}
            className="border-forest text-forest"
          >
            {loading ? (
              <>
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <CalendarDays className="mr-1.5 size-3.5" />
                Get Calendar Feed URL
              </>
            )}
          </Button>
        ) : (
          <>
            <div className="flex gap-2">
              <Input
                readOnly
                value={feedUrl ?? ""}
                className="font-mono text-xs"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyToClipboard}
                title="Copy feed URL"
                className="shrink-0"
              >
                {copied ? (
                  <Check className="size-4 text-forest" />
                ) : (
                  <Copy className="size-4" />
                )}
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={regenerateToken}
                disabled={regenerating}
                className="text-xs"
              >
                {regenerating ? (
                  <Loader2 className="mr-1.5 size-3 animate-spin" />
                ) : (
                  <RefreshCw className="mr-1.5 size-3" />
                )}
                Regenerate URL
              </Button>

              {feedUrl && (
                <a
                  href={feedUrl.replace(/^https?:/, "webcal:")}
                  className="inline-flex items-center gap-1 text-xs text-forest underline-offset-2 hover:underline"
                >
                  <ExternalLink className="size-3" />
                  Open in Calendar App
                </a>
              )}
            </div>

            <p className="text-[11px] text-text-light">
              This private URL contains a unique token. Regenerating it will
              invalidate any existing subscriptions. Calendar apps typically
              refresh every few hours.
            </p>
          </>
        )}

        {error && (
          <p className="text-xs text-red-600">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}
