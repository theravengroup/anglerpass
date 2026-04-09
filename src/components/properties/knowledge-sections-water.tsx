"use client";

import {
  CLARITY_LABELS,
  WADEABILITY_LABELS,
  DEPTH_ZONE_LABELS,
  STRUCTURAL_FEATURE_LABELS,
  BOTTOM_COMPOSITION_LABELS,
  ABUNDANCE_LABELS,
  POPULATION_SOURCE_LABELS,
  FEEDING_PATTERN_LABELS,
  MONTH_LABELS,
  INSECT_TYPE_LABELS,
  FLY_CATEGORY_LABELS,
  TIME_OF_DAY_LABELS,
  SEASON_LABELS,
  FISH_ACTIVITY_LABELS,
  TECHNIQUE_LABELS,
} from "@/lib/constants/property-knowledge";
import {
  displayValue,
  displaySelect,
  displayMultiSelect,
} from "./knowledge-display-helpers";
import { SectionCard, Field, FieldValue, NotProvided, get } from "./knowledge-display-primitives";

export function WaterCharacteristicsSection({ data }: { data: unknown }) {
  return (
    <SectionCard title="Water Characteristics">
      <Field label="Clarity">
        <FieldValue value={displaySelect(get(data, "clarity"), CLARITY_LABELS)} />
      </Field>
      <Field label="Wadeability">
        <FieldValue value={displaySelect(get(data, "wadeability"), WADEABILITY_LABELS)} />
      </Field>
      <Field label="Depth Zones">
        <FieldValue value={displayMultiSelect(get(data, "depth_zones"), DEPTH_ZONE_LABELS)} />
      </Field>
      <Field label="Structural Features">
        <FieldValue value={displayMultiSelect(get(data, "structural_features"), STRUCTURAL_FEATURE_LABELS)} />
      </Field>
      <Field label="Bottom Composition">
        <FieldValue value={displayMultiSelect(get(data, "bottom_composition"), BOTTOM_COMPOSITION_LABELS)} />
      </Field>
      <Field label="Stream Width Range">
        <FieldValue value={displayValue(get(data, "stream_width_range"))} />
      </Field>
      <Field label="Spring Water Temperature" full>
        <FieldValue value={displayValue(get(data, "temp_spring"))} />
      </Field>
      <Field label="Summer Water Temperature">
        <FieldValue value={displayValue(get(data, "temp_summer"))} />
      </Field>
      <Field label="Fall Water Temperature">
        <FieldValue value={displayValue(get(data, "temp_fall"))} />
      </Field>
      <Field label="Winter Water Temperature">
        <FieldValue value={displayValue(get(data, "temp_winter"))} />
      </Field>
    </SectionCard>
  );
}

export function SpeciesDetailSection({ data }: { data: unknown }) {
  const entries = Array.isArray(data) ? data : [];
  return (
    <SectionCard title="Species Detail">
      {entries.length === 0 ? (
        <Field label="Species" full>
          <NotProvided />
        </Field>
      ) : (
        entries.map((entry: Record<string, unknown>, i: number) => (
          <div key={i} className="sm:col-span-2">
            <h4 className="mb-2 font-[family-name:var(--font-heading)] text-base font-semibold text-text-primary">
              {displayValue(entry.species_name)}
            </h4>
            <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
              <Field label="Abundance">
                <FieldValue value={displaySelect(entry.abundance, ABUNDANCE_LABELS)} />
              </Field>
              <Field label="Size Range">
                <FieldValue value={displayValue(entry.size_range)} />
              </Field>
              <Field label="Trophy Size">
                <FieldValue value={displayValue(entry.trophy_size)} />
              </Field>
              <Field label="Population Source">
                <FieldValue value={displaySelect(entry.population_source, POPULATION_SOURCE_LABELS)} />
              </Field>
              <Field label="Stocking Schedule">
                <FieldValue value={displayValue(entry.stocking_schedule)} />
              </Field>
              <Field label="Spawn Months">
                <FieldValue value={displayMultiSelect(entry.spawn_months, MONTH_LABELS)} />
              </Field>
              <Field label="Feeding Patterns">
                <FieldValue value={displayMultiSelect(entry.feeding_patterns, FEEDING_PATTERN_LABELS)} />
              </Field>
              <Field label="Best Technique">
                <FieldValue value={displaySelect(entry.best_technique, TECHNIQUE_LABELS)} />
              </Field>
              <Field label="Notes" full>
                <FieldValue value={displayValue(entry.notes)} />
              </Field>
            </dl>
            {i < entries.length - 1 && (
              <hr className="mt-4 border-stone-light/20" />
            )}
          </div>
        ))
      )}
    </SectionCard>
  );
}

export function HatchesSection({ data }: { data: unknown }) {
  const entries = Array.isArray(data) ? data : [];
  return (
    <SectionCard title="Hatches & Fly Patterns">
      {entries.length === 0 ? (
        <Field label="Hatches" full>
          <NotProvided />
        </Field>
      ) : (
        entries.map((entry: Record<string, unknown>, i: number) => (
          <div key={i} className="sm:col-span-2">
            <h4 className="mb-2 font-[family-name:var(--font-heading)] text-base font-semibold text-text-primary">
              {displayValue(entry.insect_name)}
            </h4>
            <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
              <Field label="Insect Type">
                <FieldValue value={displaySelect(entry.insect_type, INSECT_TYPE_LABELS)} />
              </Field>
              <Field label="Peak Months">
                <FieldValue value={displayMultiSelect(entry.peak_months, MONTH_LABELS)} />
              </Field>
              <Field label="Time of Day">
                <FieldValue value={displaySelect(entry.time_of_day, TIME_OF_DAY_LABELS)} />
              </Field>
              <Field label="Matching Patterns">
                <FieldValue value={displayValue(entry.matching_patterns)} />
              </Field>
              <Field label="Fly Categories">
                <FieldValue value={displayMultiSelect(entry.fly_categories, FLY_CATEGORY_LABELS)} />
              </Field>
              <Field label="Hook Sizes">
                <FieldValue value={displayValue(entry.hook_sizes)} />
              </Field>
              <Field label="Intensity">
                <FieldValue value={displayValue(entry.intensity)} />
              </Field>
              <Field label="Notes" full>
                <FieldValue value={displayValue(entry.notes)} />
              </Field>
            </dl>
            {i < entries.length - 1 && (
              <hr className="mt-4 border-stone-light/20" />
            )}
          </div>
        ))
      )}
    </SectionCard>
  );
}

export function SeasonalConditionsSection({ data }: { data: unknown }) {
  const seasons = ["spring", "summer", "fall", "winter"] as const;
  return (
    <SectionCard title="Seasonal Conditions">
      <Field label="Best Months">
        <FieldValue value={displayMultiSelect(get(data, "best_months"), MONTH_LABELS)} />
      </Field>
      <Field label="Worst Months">
        <FieldValue value={displayMultiSelect(get(data, "worst_months"), MONTH_LABELS)} />
      </Field>
      <Field label="Runoff Timing">
        <FieldValue value={displayValue(get(data, "runoff_timing"))} />
      </Field>
      <Field label="Runoff Notes" full>
        <FieldValue value={displayValue(get(data, "runoff_notes"))} />
      </Field>
      {seasons.map((season) => {
        const sData = get(data, season) as Record<string, unknown> | undefined;
        return (
          <div key={season} className="sm:col-span-2">
            <h4 className="mb-2 mt-2 font-[family-name:var(--font-heading)] text-base font-semibold text-text-primary">
              {SEASON_LABELS[season]}
            </h4>
            <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
              <Field label="Fish Activity">
                <FieldValue value={displaySelect(get(sData, "fish_activity"), FISH_ACTIVITY_LABELS)} />
              </Field>
              <Field label="Best Techniques">
                <FieldValue value={displayMultiSelect(get(sData, "best_techniques"), TECHNIQUE_LABELS)} />
              </Field>
              <Field label="Water Temperature Range">
                <FieldValue value={displayValue(get(sData, "water_temp_range"))} />
              </Field>
              <Field label="Notes" full>
                <FieldValue value={displayValue(get(sData, "notes"))} />
              </Field>
            </dl>
          </div>
        );
      })}
    </SectionCard>
  );
}

export function FlowGaugeSection({ data }: { data: unknown }) {
  return (
    <SectionCard title="Flow & Gauge Data">
      <Field label="Gauge ID">
        <FieldValue value={displayValue(get(data, "gauge_id"))} />
      </Field>
      <Field label="Gauge Name">
        <FieldValue value={displayValue(get(data, "gauge_name"))} />
      </Field>
      <Field label="Gauge URL" full>
        {get(data, "gauge_url") ? (
          <a
            href={String(get(data, "gauge_url"))}
            target="_blank"
            rel="noopener noreferrer"
            className="text-river underline hover:text-river/80"
          >
            {String(get(data, "gauge_url"))}
          </a>
        ) : (
          <NotProvided />
        )}
      </Field>
      <Field label="Optimal Wade Flow (CFS min)">
        <FieldValue value={displayValue(get(data, "optimal_wade_cfs_min"))} />
      </Field>
      <Field label="Optimal Wade Flow (CFS max)">
        <FieldValue value={displayValue(get(data, "optimal_wade_cfs_max"))} />
      </Field>
      <Field label="Optimal Float Flow (CFS min)">
        <FieldValue value={displayValue(get(data, "optimal_float_cfs_min"))} />
      </Field>
      <Field label="Optimal Float Flow (CFS max)">
        <FieldValue value={displayValue(get(data, "optimal_float_cfs_max"))} />
      </Field>
      <Field label="Stress Temperature (F)">
        <FieldValue value={displayValue(get(data, "stress_temp_f"))} />
      </Field>
      <Field label="Base Flow (CFS)">
        <FieldValue value={displayValue(get(data, "base_flow_cfs"))} />
      </Field>
      <Field label="Notes" full>
        <FieldValue value={displayValue(get(data, "notes"))} />
      </Field>
    </SectionCard>
  );
}
