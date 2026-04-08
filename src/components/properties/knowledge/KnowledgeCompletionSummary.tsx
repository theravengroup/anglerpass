"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KNOWLEDGE_SECTIONS } from "@/lib/constants/property-knowledge";
import { completenessMessage } from "@/lib/utils/knowledge-completeness";
import { cn } from "@/lib/utils";

interface KnowledgeCompletionSummaryProps {
  completenessScore: number;
  sectionFilled: Record<string, { filled: number; total: number }>;
}

export default function KnowledgeCompletionSummary({
  completenessScore,
  sectionFilled,
}: KnowledgeCompletionSummaryProps) {
  const { tier, message } = completenessMessage(completenessScore);

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
            Knowledge Profile Completeness
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-3">
            <span
              className={cn(
                "text-5xl font-bold tabular-nums",
                tier === "excellent"
                  ? "text-forest"
                  : tier === "rich"
                    ? "text-forest"
                    : tier === "basic"
                      ? "text-bronze"
                      : "text-text-secondary",
              )}
            >
              {completenessScore}%
            </span>
            <span className="mb-1 text-sm text-text-light">complete</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-stone-light/20">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                tier === "excellent" || tier === "rich"
                  ? "bg-forest"
                  : tier === "basic"
                    ? "bg-bronze"
                    : "bg-stone",
              )}
              role="progressbar"
              aria-valuenow={completenessScore}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Profile ${completenessScore}% complete`}
              /* Dynamic width requires inline style — not a design token */
              {...{ style: { width: `${completenessScore}%` } }}
            />
          </div>
          <p className="text-sm text-text-secondary">{message}</p>
        </CardContent>
      </Card>

      {/* Section Breakdown */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
            Section Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-stone-light/10">
            {KNOWLEDGE_SECTIONS.map((section) => {
              const status = sectionFilled[section.key] ?? {
                filled: 0,
                total: 0,
              };
              const isComplete = status.total > 0 && status.filled >= status.total;
              const percentage =
                status.total > 0
                  ? Math.round((status.filled / status.total) * 100)
                  : 0;

              return (
                <li
                  key={section.key}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex items-center gap-3">
                    {isComplete ? (
                      <span
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-forest text-white text-xs"
                        aria-label="Complete"
                      >
                        &#10003;
                      </span>
                    ) : (
                      <span
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-stone-light/20 text-text-light text-xs"
                        aria-label="Incomplete"
                      >
                        {percentage}
                      </span>
                    )}
                    <div>
                      <p
                        className={cn(
                          "text-sm font-medium",
                          isComplete
                            ? "text-text-primary"
                            : "text-text-secondary",
                        )}
                      >
                        {section.label}
                      </p>
                      {!isComplete && status.total > 0 && (
                        <p className="text-xs text-text-light">
                          {status.filled} of {status.total} fields completed
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="w-24">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-light/20">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          isComplete ? "bg-forest" : "bg-bronze/60",
                        )}
                        {...{
                          style: { width: `${percentage}%` },
                        }}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
