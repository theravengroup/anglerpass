"use client";

import { Loader2, Star, Compass } from "lucide-react";
import { Label } from "@/components/ui/label";

interface MatchedGuide {
  id: string;
  display_name: string;
  profile_photo_url: string | null;
  techniques: string[];
  rating_avg: number;
  rating_count: number;
  trips_completed: number;
  rate: number | null;
  rate_full_day: number | null;
  rate_half_day: number | null;
}

interface GuidesSectionProps {
  loadingGuides: boolean;
  availableGuides: MatchedGuide[];
  selectedGuideId: string | null;
  onSelectGuide: (id: string | null) => void;
}

export default function GuidesSection({
  loadingGuides,
  availableGuides,
  selectedGuideId,
  onSelectGuide,
}: GuidesSectionProps) {
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5">
        <Compass className="size-3.5 text-charcoal" />
        Add an Independent Guide
      </Label>

      {loadingGuides ? (
        <div className="flex items-center gap-2 rounded-lg border border-stone-light/15 px-3 py-2 text-xs text-text-light">
          <Loader2 className="size-3 animate-spin" />
          Finding available independent guides...
        </div>
      ) : availableGuides.length === 0 ? (
        <p className="text-xs text-text-light">
          No independent guides available for this date
        </p>
      ) : (
        <div className="space-y-2">
          {/* No guide option */}
          <button
            type="button"
            onClick={() => onSelectGuide(null)}
            className={`w-full rounded-lg border p-2.5 text-left text-sm transition-colors ${
              !selectedGuideId
                ? "border-charcoal bg-charcoal/5"
                : "border-stone-light/20 hover:border-stone-light/40"
            }`}
          >
            No independent guide needed
          </button>

          {availableGuides.slice(0, 5).map((guide, idx) => (
            <button
              key={guide.id}
              type="button"
              onClick={() => onSelectGuide(guide.id)}
              className={`w-full rounded-lg border p-2.5 text-left transition-colors ${
                selectedGuideId === guide.id
                  ? "border-charcoal bg-charcoal/5"
                  : "border-stone-light/20 hover:border-stone-light/40"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-charcoal/10 text-xs font-semibold text-charcoal">
                  {guide.display_name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-medium text-text-primary">
                      {guide.display_name}
                    </span>
                    {idx === 0 && (
                      <span className="shrink-0 rounded bg-bronze/10 px-1.5 py-0.5 text-[10px] font-medium text-bronze">
                        Best match
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text-light">
                    {guide.rating_count > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Star className="size-3 fill-bronze text-bronze" />
                        {Number(guide.rating_avg).toFixed(1)}
                      </span>
                    )}
                    {guide.trips_completed > 0 && (
                      <span>{guide.trips_completed} trips</span>
                    )}
                  </div>
                </div>
                <span className="text-sm font-semibold text-forest">
                  ${guide.rate}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
