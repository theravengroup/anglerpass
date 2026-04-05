"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, Map, List, Home, MapPin } from "lucide-react";
import { WATER_TYPE_OPTIONS, COMMON_SPECIES } from "@/lib/constants/water-types";

const STATES = [
  "Montana", "Colorado", "Wyoming", "Idaho", "Oregon", "Washington",
  "Virginia", "Pennsylvania", "North Carolina", "Tennessee", "Utah", "New York",
];

export interface SearchFiltersState {
  q: string;
  water_type: string;
  species: string;
  state: string;
  min_price: string;
  max_price: string;
  lodging: boolean;
}

interface SearchFiltersProps {
  filters: SearchFiltersState;
  onChange: (filters: SearchFiltersState) => void;
  viewMode: "map" | "list";
  onViewModeChange: (mode: "map" | "list") => void;
  resultCount: number;
}

export default function SearchFilters({
  filters,
  onChange,
  viewMode,
  onViewModeChange,
  resultCount,
}: SearchFiltersProps) {
  const update = (key: keyof SearchFiltersState, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  const hasFilters =
    filters.q ||
    filters.water_type ||
    filters.species ||
    filters.state ||
    filters.min_price ||
    filters.max_price ||
    filters.lodging;

  const clearFilters = () => {
    onChange({
      q: "",
      water_type: "",
      species: "",
      state: "",
      min_price: "",
      max_price: "",
      lodging: false,
    });
  };

  return (
    <div className="space-y-3">
      {/* Search bar + view toggle */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-light" />
          <Input
            placeholder="Search properties..."
            value={filters.q}
            onChange={(e) => update("q", e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex rounded-lg border border-stone-light/20 overflow-hidden">
          <button
            onClick={() => onViewModeChange("map")}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
              viewMode === "map"
                ? "bg-forest text-white"
                : "bg-white text-text-secondary hover:bg-stone-light/10"
            }`}
          >
            <Map className="size-3.5" />
            Map
          </button>
          <button
            onClick={() => onViewModeChange("list")}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
              viewMode === "list"
                ? "bg-forest text-white"
                : "bg-white text-text-secondary hover:bg-stone-light/10"
            }`}
          >
            <List className="size-3.5" />
            List
          </button>
        </div>
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={filters.water_type || "_all"}
          onValueChange={(v) => update("water_type", v === "_all" ? "" : v)}
        >
          <SelectTrigger className="w-[140px] text-xs">
            <SelectValue placeholder="Water Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All Water Types</SelectItem>
            {WATER_TYPE_OPTIONS.map((wt) => (
              <SelectItem key={wt.value} value={wt.value}>
                {wt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.state || "_all"}
          onValueChange={(v) => update("state", v === "_all" ? "" : v)}
        >
          <SelectTrigger className="w-[140px] text-xs">
            <SelectValue placeholder="State" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All States</SelectItem>
            {STATES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.species || "_all"}
          onValueChange={(v) => update("species", v === "_all" ? "" : v)}
        >
          <SelectTrigger className="w-[160px] text-xs">
            <SelectValue placeholder="Species" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All Species</SelectItem>
            {COMMON_SPECIES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1">
          <Input
            type="number"
            placeholder="Min $"
            value={filters.min_price}
            onChange={(e) => update("min_price", e.target.value)}
            className="w-[80px] text-xs"
          />
          <span className="text-xs text-text-light">–</span>
          <Input
            type="number"
            placeholder="Max $"
            value={filters.max_price}
            onChange={(e) => update("max_price", e.target.value)}
            className="w-[80px] text-xs"
          />
        </div>

        <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-stone-light/20 px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:border-bronze/30 hover:bg-bronze/5">
          <input
            type="checkbox"
            checked={filters.lodging}
            onChange={(e) =>
              onChange({ ...filters, lodging: e.target.checked })
            }
            className="size-3.5 rounded border-stone-light/30 accent-bronze"
          />
          <Home className="size-3.5 text-bronze" />
          Lodging
        </label>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-xs text-text-light"
          >
            <X className="mr-1 size-3" />
            Clear
          </Button>
        )}

        <span className="ml-auto text-xs text-text-light">
          {resultCount} {resultCount === 1 ? "property" : "properties"}
        </span>
      </div>
    </div>
  );
}
