"use client";

import { Button } from "@/components/ui/button";

const SUGGESTIONS = [
  "Find trout water near Denver",
  "What should I bring for spring creek fishing?",
  "Best time to fish tailwaters in Colorado",
  "How does cross-club booking work?",
] as const;

interface CompassSuggestionChipsProps {
  onSelect: (text: string) => void;
}

export default function CompassSuggestionChips({
  onSelect,
}: CompassSuggestionChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {SUGGESTIONS.map((suggestion) => (
        <Button
          key={suggestion}
          variant="outline"
          size="sm"
          className="border-bronze/30 bg-bronze/5 text-charcoal hover:bg-bronze/10 hover:border-bronze/50 text-left h-auto py-2 px-3 text-xs font-body whitespace-normal"
          onClick={() => onSelect(suggestion)}
        >
          {suggestion}
        </Button>
      ))}
    </div>
  );
}
