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
import { Input } from "@/components/ui/input";
import {
  CalendarDays,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarFeedCardProps {
  /** API endpoint to GET/DELETE the calendar token */
  tokenEndpoint: string;
  /** Card title */
  title?: string;
  /** Card description */
  description?: string;
  /** Accent color class (e.g. "forest", "river") */
  color?: "forest" | "river" | "bronze" | "charcoal";
  className?: string;
}

const COLOR_MAP = {
  forest: { text: "text-forest", border: "border-forest" },
  river: { text: "text-river", border: "border-river" },
  bronze: { text: "text-bronze", border: "border-bronze" },
  charcoal: { text: "text-charcoal", border: "border-charcoal" },
};

export default function CalendarFeedCard({
  tokenEndpoint,
  title = "Calendar Subscription",
  description = "Subscribe to bookings in Apple Calendar, Google Calendar, or Outlook.",
  color = "forest",
  className,
}: CalendarFeedCardProps) {
  const [feedUrl, setFeedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const colors = COLOR_MAP[color];

  async function fetchToken() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(tokenEndpoint);
      if (!res.ok) throw new Error("Failed to get calendar feed URL");
      const data = await res.json();
      setFeedUrl(data.feed_url);
      setInitialized(true);
    } catch {
      setError("Could not load calendar feed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function regenerateToken() {
    setRegenerating(true);
    setError(null);
    try {
      const res = await fetch(tokenEndpoint, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to regenerate token");
      const data = await res.json();
      setFeedUrl(data.feed_url);
    } catch {
      setError("Could not regenerate feed URL. Try again.");
    } finally {
      setRegenerating(false);
    }
  }

  async function copyToClipboard() {
    if (!feedUrl) return;
    try {
      await navigator.clipboard.writeText(feedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.warn("Clipboard API is not available in this browser.");
    }
  }

  return (
    <Card className={cn(`${colors.border}/20`, className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarDays className={cn("size-4", colors.text)} />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!initialized ? (
          <Button
            variant="outline"
            size="sm"
            onClick={fetchToken}
            disabled={loading}
            className={cn(colors.border, colors.text)}
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
                  <Check className={cn("size-4", colors.text)} />
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
                  className={cn(
                    "inline-flex items-center gap-1 text-xs underline-offset-2 hover:underline",
                    colors.text
                  )}
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

        {error && <p className="text-xs text-red-600">{error}</p>}
      </CardContent>
    </Card>
  );
}
