"use client";

interface StepWrittenReviewProps {
  value: string;
  onChange: (value: string) => void;
  error: string | null;
}

const MIN_CHARS = 50;

export default function StepWrittenReview({
  value,
  onChange,
  error,
}: StepWrittenReviewProps) {
  const charCount = value.length;
  const remaining = MIN_CHARS - charCount;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-[family-name:var(--font-heading)] text-xl font-semibold text-text-primary">
          Describe your experience
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Help future anglers know what to expect at this property.
        </p>
      </div>

      <div className="space-y-2">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={6}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm leading-relaxed placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          placeholder="Describe your experience on the water. What did you find when you arrived? How did the property match the listing? What would future anglers want to know?"
        />

        <div className="flex items-center justify-between">
          {error ? (
            <p className="text-xs text-red-500" role="alert" aria-live="polite">
              {error}
            </p>
          ) : remaining > 0 ? (
            <p className="text-xs text-text-light">
              {remaining} more character{remaining !== 1 ? "s" : ""} needed
            </p>
          ) : (
            <p className="text-xs text-forest">Minimum met</p>
          )}

          <p
            className={`text-xs ${
              charCount < MIN_CHARS ? "text-text-light" : "text-text-secondary"
            }`}
          >
            {charCount} character{charCount !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
