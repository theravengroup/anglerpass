"use client";

import { ThumbsUp, ThumbsDown } from "lucide-react";

interface StepWouldFishAgainProps {
  value: boolean | null;
  onChange: (value: boolean) => void;
}

export default function StepWouldFishAgain({
  value,
  onChange,
}: StepWouldFishAgainProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="font-[family-name:var(--font-heading)] text-xl font-semibold text-text-primary">
          Would you fish this property again?
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          This single question helps future anglers more than any score.
        </p>
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`flex flex-1 flex-col items-center gap-3 rounded-xl border-2 px-6 py-8 transition-all duration-200 ${
            value === true
              ? "border-forest bg-forest/5 shadow-sm"
              : "border-stone-light/25 hover:border-forest/40"
          }`}
          aria-pressed={value === true}
        >
          <div
            className={`flex size-14 items-center justify-center rounded-full transition-colors ${
              value === true ? "bg-forest/15" : "bg-offwhite"
            }`}
          >
            <ThumbsUp
              className={`size-7 ${
                value === true ? "text-forest" : "text-text-light"
              }`}
            />
          </div>
          <span
            className={`text-lg font-semibold ${
              value === true ? "text-forest" : "text-text-secondary"
            }`}
          >
            Yes
          </span>
        </button>

        <button
          type="button"
          onClick={() => onChange(false)}
          className={`flex flex-1 flex-col items-center gap-3 rounded-xl border-2 px-6 py-8 transition-all duration-200 ${
            value === false
              ? "border-red-400 bg-red-50 shadow-sm"
              : "border-stone-light/25 hover:border-red-300"
          }`}
          aria-pressed={value === false}
        >
          <div
            className={`flex size-14 items-center justify-center rounded-full transition-colors ${
              value === false ? "bg-red-100" : "bg-offwhite"
            }`}
          >
            <ThumbsDown
              className={`size-7 ${
                value === false ? "text-red-500" : "text-text-light"
              }`}
            />
          </div>
          <span
            className={`text-lg font-semibold ${
              value === false ? "text-red-600" : "text-text-secondary"
            }`}
          >
            No
          </span>
        </button>
      </div>
    </div>
  );
}
