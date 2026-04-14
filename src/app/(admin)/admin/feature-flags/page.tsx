"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Loader2, Power } from "lucide-react";

type Flag = {
  key: string;
  enabled: boolean;
  description: string | null;
  updated_at: string;
  updated_by: string | null;
};

/**
 * Admin "break-glass" screen.
 *
 * Deliberately plain. No filtering, no search, no pagination. When
 * something is on fire at 2am, the admin should see every switch on
 * one screen and be one click away from the off state.
 */
export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<Flag[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/admin/feature-flags", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load flags");
      const json = await res.json();
      setFlags(json.flags ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }

  useEffect(() => {
    load();
  }, []);

  function toggle(flag: Flag, nextEnabled: boolean) {
    if (
      !nextEnabled &&
      !confirm(
        `Disable "${flag.key}"? New requests to this surface will return 503 within ~20 seconds.`
      )
    ) {
      return;
    }

    setPendingKey(flag.key);
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/feature-flags", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ key: flag.key, enabled: nextEnabled }),
        });
        if (!res.ok) throw new Error("Toggle failed");
        await load();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setPendingKey(null);
      }
    });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="font-heading text-3xl text-forest">Kill Switches</h1>
        <p className="text-stone">
          Each switch gates a critical user surface. Flipping one to{" "}
          <span className="font-semibold">OFF</span> causes new requests to that
          route to return <code className="font-mono text-sm">503</code> within
          ~20 seconds. In-flight requests complete normally. Use this during
          incidents — not as a configuration tool.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {flags === null && !error && (
        <div className="flex items-center gap-2 text-stone">
          <Loader2 className="size-4 animate-spin" /> Loading flags…
        </div>
      )}

      {flags && flags.length === 0 && (
        <Card>
          <CardContent className="p-6 text-stone">
            No feature flags defined. Seed them via migration 00090.
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {flags?.map((flag) => {
          const isBusy = pendingKey === flag.key && isPending;
          return (
            <Card
              key={flag.key}
              className={
                flag.enabled
                  ? "border-stone-light"
                  : "border-red-300 bg-red-50/50"
              }
            >
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div className="space-y-1">
                  <CardTitle className="font-mono text-base text-charcoal">
                    {flag.key}
                  </CardTitle>
                  {flag.description && (
                    <CardDescription>{flag.description}</CardDescription>
                  )}
                  <div className="pt-1 text-xs text-stone">
                    Last changed{" "}
                    {new Date(flag.updated_at).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={flag.enabled ? "default" : "destructive"}
                    className={
                      flag.enabled
                        ? "bg-forest text-white"
                        : "bg-red-600 text-white"
                    }
                  >
                    {flag.enabled ? "ON" : "OFF"}
                  </Badge>
                  <Button
                    variant={flag.enabled ? "destructive" : "default"}
                    size="sm"
                    onClick={() => toggle(flag, !flag.enabled)}
                    disabled={isBusy}
                    aria-label={
                      flag.enabled
                        ? `Disable ${flag.key}`
                        : `Enable ${flag.key}`
                    }
                  >
                    {isBusy ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Power className="size-4" />
                    )}
                    <span className="ml-2">
                      {flag.enabled ? "Disable" : "Enable"}
                    </span>
                  </Button>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
