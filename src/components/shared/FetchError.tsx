"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FetchErrorProps {
  message?: string;
  onRetry?: () => void;
}

/**
 * Inline error state for failed data fetches.
 * Replaces blank screens / silent failures.
 */
export function FetchError({
  message = "Failed to load data. Please try again.",
  onRetry,
}: FetchErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-red-50">
        <AlertTriangle className="size-5 text-red-500" />
      </div>
      <p className="mt-3 text-sm text-text-secondary">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
