"use client";

import { useState, useEffect } from "react";
import { PHASES } from "./roadmap-data";

// ─── Storage ───────────────────────────────────────────────────────

const STORAGE_KEY = "anglerpass-roadmap-checked";

function loadChecked(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveChecked(checked: Record<string, boolean>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
  } catch {
    // localStorage unavailable
  }
}

// ─── Component ─────────────────────────────────────────────────────

export default function RoadmapChecklist() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setChecked(loadChecked());
    setMounted(true);
  }, []);

  function toggle(id: string, defaultDone: boolean) {
    setChecked((prev) => {
      const currentVal = prev[id] ?? defaultDone;
      const next = { ...prev, [id]: !currentVal };
      saveChecked(next);
      return next;
    });
  }

  function isChecked(id: string, defaultDone: boolean) {
    if (!mounted) return defaultDone;
    return checked[id] ?? defaultDone;
  }

  // Stats
  const allItems = PHASES.flatMap((p) => p.sections.flatMap((s) => s.items));
  const totalCount = allItems.length;
  const doneCount = allItems.filter((item) => isChecked(item.id, item.done)).length;
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-12">
      {/* Progress bar */}
      <div className="rounded-xl border border-stone-light/50 bg-white p-6 shadow-sm">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-heading text-xl font-medium text-forest-deep">
            Overall Progress
          </h2>
          <span className="font-mono text-sm text-text-secondary">
            {doneCount} / {totalCount} ({pct}%)
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-parchment">
          <div
            className="h-full rounded-full bg-forest transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Phases */}
      {PHASES.map((phase) => {
        const phaseItems = phase.sections.flatMap((s) => s.items);
        const phaseDone = phaseItems.filter((i) => isChecked(i.id, i.done)).length;
        const phaseTotal = phaseItems.length;
        const phasePct = phaseTotal > 0 ? Math.round((phaseDone / phaseTotal) * 100) : 0;

        return (
          <div key={phase.id} className="space-y-6">
            {/* Phase header */}
            <div className="flex items-start gap-4">
              <div className={`mt-1 h-4 w-4 shrink-0 rounded-full ${phase.accent}`} />
              <div className="min-w-0">
                <h2 className="font-heading text-2xl font-medium text-forest-deep">
                  {phase.title}
                </h2>
                <p className="font-body text-sm text-text-secondary mt-1">
                  {phase.subtitle}
                </p>
                <p className="font-mono text-xs text-text-light mt-1">
                  {phaseDone}/{phaseTotal} complete ({phasePct}%)
                </p>
              </div>
            </div>

            {/* Sections */}
            {phase.sections.map((section) => (
              <div
                key={section.id}
                className="ml-8 rounded-xl border border-stone-light/50 bg-white shadow-sm overflow-hidden"
              >
                <div className="border-b border-stone-light/30 bg-parchment-light/30 px-5 py-3">
                  <h3 className="font-heading text-lg font-medium text-forest-deep">
                    {section.title}
                  </h3>
                  {section.description && (
                    <p className="font-body text-sm text-text-secondary mt-0.5">
                      {section.description}
                    </p>
                  )}
                </div>
                <ul className="divide-y divide-stone-light/20">
                  {section.items.map((item) => {
                    const done = isChecked(item.id, item.done);
                    return (
                      <li key={item.id} className="group">
                        <button
                          type="button"
                          onClick={() => toggle(item.id, item.done)}
                          className="flex w-full items-start gap-3 px-5 py-3 text-left transition-colors hover:bg-parchment-light/20"
                        >
                          <span
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                              done
                                ? "border-forest bg-forest text-white"
                                : "border-stone-light bg-white text-transparent group-hover:border-stone"
                            }`}
                          >
                            {done && (
                              <svg
                                className="h-3 w-3"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={3}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </span>
                          <div className="min-w-0">
                            <span
                              className={`font-body text-sm leading-snug transition-colors ${
                                done
                                  ? "text-text-light line-through"
                                  : "text-text-primary"
                              }`}
                            >
                              {item.label}
                            </span>
                            {item.detail && (
                              <span
                                className={`block font-body text-xs leading-relaxed mt-0.5 ${
                                  done ? "text-text-light/60" : "text-text-secondary"
                                }`}
                              >
                                {item.detail}
                              </span>
                            )}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        );
      })}

      {/* Footer */}
      <div className="rounded-xl border border-stone-light/50 bg-parchment-light/30 p-6 text-center">
        <p className="font-body text-sm text-text-secondary">
          Checkbox state is saved locally in your browser. Sources:{" "}
          <span className="font-medium text-text-primary">
            Platform Architecture, Strategic Gap Analysis, System Audit
          </span>{" "}
          (April 2, 2026).
        </p>
      </div>
    </div>
  );
}
