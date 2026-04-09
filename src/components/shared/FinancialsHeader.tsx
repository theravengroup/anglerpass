"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";
import { PERIOD_OPTIONS } from "@/lib/constants/status";

interface FinancialsHeaderProps {
  backHref: string;
  title: string;
  subtitle: string;
  days: number;
  onDaysChange: (days: number) => void;
  onExport: () => void;
  /** Tailwind bg class for the active period button, e.g. "bg-bronze" */
  activeBg: string;
}

export default function FinancialsHeader({
  backHref,
  title,
  subtitle,
  days,
  onDaysChange,
  onExport,
  activeBg,
}: FinancialsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Link href={backHref}>
          <Button variant="ghost" size="sm" className="text-text-secondary">
            <ArrowLeft className="mr-1 size-4" />
            Dashboard
          </Button>
        </Link>
        <div>
          <h2 className="font-heading text-2xl font-semibold text-text-primary">
            {title}
          </h2>
          <p className="mt-0.5 text-sm text-text-secondary">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={onExport}
        >
          <Download className="mr-1 size-3" />
          Export CSV
        </Button>
        <div className="flex rounded-lg border border-stone-light/20">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onDaysChange(opt.value)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors first:rounded-l-lg last:rounded-r-lg ${
                days === opt.value
                  ? `${activeBg} text-white`
                  : "text-text-secondary hover:bg-offwhite"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
