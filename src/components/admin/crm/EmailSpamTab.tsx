"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  XCircle,
} from "lucide-react";
import type { SpamCheckResult } from "@/lib/crm/spam-scorer";

export function SpamScoreBadge({
  score,
  rating,
}: {
  score: number;
  rating: string;
}) {
  const color =
    rating === "excellent" || rating === "good"
      ? "bg-forest/10 text-forest"
      : rating === "warning"
        ? "bg-amber-100 text-amber-700"
        : "bg-red-100 text-red-700";

  return (
    <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${color}`}>
      {score}
    </span>
  );
}

export default function EmailSpamTab({ result }: { result: SpamCheckResult }) {
  const [expanded, setExpanded] = useState(true);

  const scoreColor =
    result.rating === "excellent"
      ? "text-forest"
      : result.rating === "good"
        ? "text-forest"
        : result.rating === "warning"
          ? "text-amber-600"
          : "text-red-600";

  const scoreBg =
    result.rating === "excellent"
      ? "bg-forest/10"
      : result.rating === "good"
        ? "bg-forest/10"
        : result.rating === "warning"
          ? "bg-amber-50"
          : "bg-red-50";

  return (
    <div className="space-y-4">
      {/* Score display */}
      <div className={`rounded-lg ${scoreBg} p-4 text-center`}>
        <p className={`text-3xl font-bold ${scoreColor}`}>{result.score}</p>
        <p className="text-xs text-text-secondary">out of 10</p>
        <p className={`mt-1 text-sm font-medium capitalize ${scoreColor}`}>
          {result.rating}
        </p>
      </div>

      {/* Score bar */}
      <div className="h-2 rounded-full bg-stone-light/20">
        <div
          className={`h-full rounded-full transition-all ${
            result.score <= 1
              ? "bg-forest"
              : result.score <= 3
                ? "bg-forest"
                : result.score <= 6
                  ? "bg-amber-400"
                  : "bg-red-500"
          }`}
          aria-label={`Spam score ${result.score} out of 10`}
          role="progressbar"
          aria-valuenow={result.score}
          aria-valuemin={0}
          aria-valuemax={10}
        >
          <div
            className={`h-full rounded-full ${
              result.score <= 3 ? "bg-forest" : result.score <= 6 ? "bg-amber-400" : "bg-red-500"
            }`}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Issues */}
      {result.issues.length > 0 && (
        <div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex w-full items-center justify-between text-xs font-semibold text-text-secondary"
          >
            {result.issues.length} issue{result.issues.length !== 1 ? "s" : ""}{" "}
            found
            {expanded ? (
              <ChevronUp className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )}
          </button>
          {expanded && (
            <div className="mt-2 space-y-2">
              {result.issues.map((issue, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 rounded-md border border-stone-light/20 p-2"
                >
                  {issue.severity === "high" ? (
                    <XCircle className="mt-0.5 size-3.5 shrink-0 text-red-500" />
                  ) : issue.severity === "medium" ? (
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
                  ) : (
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-stone" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-text-primary">{issue.message}</p>
                    <p className="text-[10px] text-text-light">
                      {issue.category} · +{issue.points} points
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Suggestions */}
      {result.suggestions.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-text-secondary">
            Suggestions
          </p>
          {result.suggestions.map((s, i) => (
            <p key={i} className="text-xs text-text-light">
              &bull; {s}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
