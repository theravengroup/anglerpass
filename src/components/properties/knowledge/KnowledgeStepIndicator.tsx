"use client";

import { KNOWLEDGE_SECTIONS, type KnowledgeSectionKey } from "@/lib/constants/property-knowledge";
import { cn } from "@/lib/utils";

interface KnowledgeStepIndicatorProps {
  currentStep: number;
  sectionFilled: Record<KnowledgeSectionKey, { filled: number; total: number }>;
  onStepClick: (step: number) => void;
}

export default function KnowledgeStepIndicator({
  currentStep,
  sectionFilled,
  onStepClick,
}: KnowledgeStepIndicatorProps) {
  const isSummary = currentStep >= KNOWLEDGE_SECTIONS.length;

  return (
    <nav aria-label="Knowledge profile sections" className="space-y-1">
      {KNOWLEDGE_SECTIONS.map((section, idx) => {
        const { filled, total } = sectionFilled[section.key] ?? { filled: 0, total: 0 };
        const isActive = currentStep === idx;
        const isComplete = filled === total && total > 0;
        const hasData = filled > 0;

        return (
          <button
            key={section.key}
            type="button"
            onClick={() => onStepClick(idx)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
              isActive
                ? "bg-forest/10 text-forest"
                : "text-text-secondary hover:bg-parchment-light/50 hover:text-text-primary"
            )}
          >
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                isComplete
                  ? "bg-forest text-white"
                  : hasData
                    ? "bg-bronze/20 text-bronze"
                    : "bg-stone-light/20 text-text-light"
              )}
            >
              {isComplete ? "\u2713" : idx + 1}
            </span>
            <span className="min-w-0 grow truncate">{section.label}</span>
            {total > 0 && (
              <span className="shrink-0 text-xs text-text-light">
                {filled}/{total}
              </span>
            )}
          </button>
        );
      })}

      {/* Summary step */}
      <button
        type="button"
        onClick={() => onStepClick(KNOWLEDGE_SECTIONS.length)}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
          isSummary
            ? "bg-forest/10 text-forest"
            : "text-text-secondary hover:bg-parchment-light/50 hover:text-text-primary"
        )}
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-light/20 text-xs font-medium text-text-light">
          {KNOWLEDGE_SECTIONS.length + 1}
        </span>
        <span className="min-w-0 grow truncate">Summary</span>
      </button>
    </nav>
  );
}
