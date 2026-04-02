"use client";

import { useState } from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  size?: "sm" | "lg";
  disabled?: boolean;
}

export default function StarRating({
  value,
  onChange,
  size = "lg",
  disabled = false,
}: StarRatingProps) {
  const [hovered, setHovered] = useState(0);

  const starSize = size === "lg" ? "size-11" : "size-7";
  const touchTarget = size === "lg" ? "p-1" : "p-0.5";
  const gap = size === "lg" ? "gap-1" : "gap-0.5";

  return (
    <div
      className={`flex ${gap}`}
      role="radiogroup"
      aria-label="Rating"
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const isActive = star <= (hovered || value);

        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={star === value}
            aria-label={`${star} star${star !== 1 ? "s" : ""}`}
            disabled={disabled}
            className={`${touchTarget} transition-transform duration-150 ${
              disabled
                ? "cursor-not-allowed opacity-50"
                : "cursor-pointer hover:scale-110 active:scale-95"
            }`}
            onClick={() => onChange(star)}
            onMouseEnter={() => !disabled && setHovered(star)}
            onMouseLeave={() => !disabled && setHovered(0)}
          >
            <Star
              className={`${starSize} transition-colors duration-150 ${
                isActive
                  ? "fill-bronze text-bronze"
                  : "fill-transparent text-stone-light/50"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
