"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  KNOWLEDGE_SECTIONS,
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
  PARKING_SURFACE_LABELS,
  VEHICLE_CLEARANCE_LABELS,
  ACCESS_METHOD_LABELS,
  BOAT_LAUNCH_LABELS,
  FLOAT_DIFFICULTY_LABELS,
  BOAT_TYPE_LABELS,
  CELL_COVERAGE_LABELS,
  CATCH_RELEASE_LABELS,
  HOOK_RULE_LABELS,
  METHOD_RESTRICTION_LABELS,
  WADER_TYPE_LABELS,
  BOOT_TYPE_LABELS,
  ESSENTIAL_FLY_CATEGORY_LABELS,
  WILDLIFE_HAZARD_LABELS,
  WATER_HAZARD_LABELS,
  TERRAIN_DIFFICULTY_LABELS,
  REMOTE_RATING_LABELS,
  RESTROOM_TYPE_LABELS,
  SITE_AMENITIES,
  NEARBY_SERVICES,
  BEST_FOR_LABELS,
  PRESSURE_LEVEL_LABELS,
} from "@/lib/constants/property-knowledge";
import {
  displayValue,
  displaySelect,
  displayMultiSelect,
  displayRating,
  displayBoolean,
} from "./knowledge-display-helpers";

interface KnowledgeDisplayProps {
  knowledge: Record<string, unknown> | null;
}

/* ── Reusable sub-components ───────────────────────────────── */

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-stone-light/20">
      <CardHeader>
        <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
          {children}
        </dl>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={cn(full && "sm:col-span-2")}>
      <dt className="text-xs font-medium text-text-secondary">{label}</dt>
      <dd className="mt-0.5 text-sm text-text-primary">{children}</dd>
    </div>
  );
}

function NotProvided() {
  return <span className="text-text-light italic">Not provided</span>;
}

function FieldValue({ value }: { value: string }) {
  return value === "Not provided" ? <NotProvided /> : <>{value}</>;
}

/* ── Section renderers ─────────────────────────────────────── */

function get(obj: unknown, key: string): unknown {
  if (obj && typeof obj === "object") return (obj as Record<string, unknown>)[key];
  return undefined;
}

function WaterCharacteristicsSection({ data }: { data: unknown }) {
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

function SpeciesDetailSection({ data }: { data: unknown }) {
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

function HatchesSection({ data }: { data: unknown }) {
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

function SeasonalConditionsSection({ data }: { data: unknown }) {
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

function FlowGaugeSection({ data }: { data: unknown }) {
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

function AccessLogisticsSection({ data }: { data: unknown }) {
  return (
    <SectionCard title="Access & Logistics">
      <Field label="Elevation (ft)">
        <FieldValue value={displayValue(get(data, "elevation_ft"))} />
      </Field>
      <Field label="Nearest Town">
        <FieldValue value={displayValue(get(data, "nearest_town"))} />
      </Field>
      <Field label="Nearest Airport">
        <FieldValue value={displayValue(get(data, "nearest_airport"))} />
      </Field>
      <Field label="Parking Spaces">
        <FieldValue value={displayValue(get(data, "parking_spaces"))} />
      </Field>
      <Field label="Parking Surface">
        <FieldValue value={displaySelect(get(data, "parking_surface"), PARKING_SURFACE_LABELS)} />
      </Field>
      <Field label="Vehicle Clearance">
        <FieldValue value={displaySelect(get(data, "vehicle_clearance"), VEHICLE_CLEARANCE_LABELS)} />
      </Field>
      <Field label="Walk to Water (ft)">
        <FieldValue value={displayValue(get(data, "walk_distance_ft"))} />
      </Field>
      <Field label="Cell Coverage">
        <FieldValue value={displaySelect(get(data, "cell_coverage"), CELL_COVERAGE_LABELS)} />
      </Field>
      <Field label="Access Method">
        <FieldValue value={displaySelect(get(data, "access_method"), ACCESS_METHOD_LABELS)} />
      </Field>
      <Field label="Boat Launch">
        <FieldValue value={displaySelect(get(data, "boat_launch"), BOAT_LAUNCH_LABELS)} />
      </Field>
      <Field label="Boat Types Allowed">
        <FieldValue value={displayMultiSelect(get(data, "boat_types_allowed"), BOAT_TYPE_LABELS)} />
      </Field>
      <Field label="Float Difficulty">
        <FieldValue value={displaySelect(get(data, "float_difficulty"), FLOAT_DIFFICULTY_LABELS)} />
      </Field>
      <Field label="Float Distance (miles)">
        <FieldValue value={displayValue(get(data, "float_distance_miles"))} />
      </Field>
      <Field label="Road Conditions">
        <FieldValue value={displayValue(get(data, "road_conditions"))} />
      </Field>
      <Field label="Directions" full>
        <FieldValue value={displayValue(get(data, "directions"))} />
      </Field>
    </SectionCard>
  );
}

function RegulationsSection({ data }: { data: unknown }) {
  return (
    <SectionCard title="Regulations & Rules">
      <Field label="Catch & Release">
        <FieldValue value={displaySelect(get(data, "catch_release"), CATCH_RELEASE_LABELS)} />
      </Field>
      <Field label="Hook Rules">
        <FieldValue value={displaySelect(get(data, "hook_rules"), HOOK_RULE_LABELS)} />
      </Field>
      <Field label="Method Restriction">
        <FieldValue value={displaySelect(get(data, "method_restriction"), METHOD_RESTRICTION_LABELS)} />
      </Field>
      <Field label="Creel Limit">
        <FieldValue value={displayValue(get(data, "creel_limit"))} />
      </Field>
      <Field label="Slot Limits" full>
        <FieldValue value={displayValue(get(data, "slot_limits"))} />
      </Field>
      <Field label="Seasonal Closures" full>
        <FieldValue value={displayValue(get(data, "seasonal_closures"))} />
      </Field>
      <Field label="Handling Requirements" full>
        <FieldValue value={displayValue(get(data, "handling_requirements"))} />
      </Field>
      <Field label="Club-Specific Rules" full>
        <FieldValue value={displayValue(get(data, "club_specific_rules"))} />
      </Field>
      <Field label="License Info" full>
        <FieldValue value={displayValue(get(data, "license_info"))} />
      </Field>
    </SectionCard>
  );
}

function EquipmentSection({ data }: { data: unknown }) {
  return (
    <SectionCard title="Equipment Recommendations">
      <Field label="Primary Rod Weight">
        <FieldValue value={displayValue(get(data, "rod_weight_primary"))} />
      </Field>
      <Field label="Secondary Rod Weight">
        <FieldValue value={displayValue(get(data, "rod_weight_secondary"))} />
      </Field>
      <Field label="Wader Type">
        <FieldValue value={displaySelect(get(data, "wader_type"), WADER_TYPE_LABELS)} />
      </Field>
      <Field label="Boot Type">
        <FieldValue value={displaySelect(get(data, "boot_type"), BOOT_TYPE_LABELS)} />
      </Field>
      <Field label="Essential Flies">
        <FieldValue value={displayMultiSelect(get(data, "essential_flies"), ESSENTIAL_FLY_CATEGORY_LABELS)} />
      </Field>
      <Field label="Fly Size Range">
        <FieldValue value={displayValue(get(data, "fly_size_range"))} />
      </Field>
      <Field label="Tippet Range">
        <FieldValue value={displayValue(get(data, "tippet_range"))} />
      </Field>
      <Field label="Leader Length">
        <FieldValue value={displayValue(get(data, "leader_length"))} />
      </Field>
      <Field label="Net Required">
        <FieldValue value={displayBoolean(get(data, "net_required"))} />
      </Field>
      <Field label="Wading Staff Recommended">
        <FieldValue value={displayBoolean(get(data, "wading_staff_recommended"))} />
      </Field>
      <Field label="Indicator Recommended">
        <FieldValue value={displayBoolean(get(data, "indicator_recommended"))} />
      </Field>
      <Field label="Specific Fly Recommendations" full>
        <FieldValue value={displayValue(get(data, "specific_fly_recs"))} />
      </Field>
      <Field label="Gear Notes" full>
        <FieldValue value={displayValue(get(data, "gear_notes"))} />
      </Field>
    </SectionCard>
  );
}

function SafetySection({ data }: { data: unknown }) {
  return (
    <SectionCard title="Safety & Hazards">
      <Field label="Wildlife Hazards">
        <FieldValue value={displayMultiSelect(get(data, "wildlife_hazards"), WILDLIFE_HAZARD_LABELS)} />
      </Field>
      <Field label="Water Hazards">
        <FieldValue value={displayMultiSelect(get(data, "water_hazards"), WATER_HAZARD_LABELS)} />
      </Field>
      <Field label="Terrain Difficulty">
        <FieldValue value={displaySelect(get(data, "terrain_difficulty"), TERRAIN_DIFFICULTY_LABELS)} />
      </Field>
      <Field label="Remoteness">
        <FieldValue value={displaySelect(get(data, "remote_rating"), REMOTE_RATING_LABELS)} />
      </Field>
      <Field label="Nearest Hospital">
        <FieldValue value={displayValue(get(data, "nearest_hospital"))} />
      </Field>
      <Field label="Emergency Info" full>
        <FieldValue value={displayValue(get(data, "emergency_info"))} />
      </Field>
      <Field label="Bear Spray Recommended">
        <FieldValue value={displayBoolean(get(data, "bear_spray_recommended"))} />
      </Field>
      <Field label="Wading Buddy Recommended">
        <FieldValue value={displayBoolean(get(data, "wading_buddy_recommended"))} />
      </Field>
      <Field label="Safety Notes" full>
        <FieldValue value={displayValue(get(data, "safety_notes"))} />
      </Field>
    </SectionCard>
  );
}

function AmenitiesSection({ data }: { data: unknown }) {
  const siteAmenities = get(data, "site_amenities") as Record<string, boolean> | undefined;
  const nearbyServices = get(data, "nearby_services") as Record<string, boolean> | undefined;

  return (
    <SectionCard title="Amenities & Facilities">
      <Field label="Restroom Type">
        <FieldValue value={displaySelect(get(data, "restroom_type"), RESTROOM_TYPE_LABELS)} />
      </Field>
      <Field label="Fly Shop Distance">
        <FieldValue value={displayValue(get(data, "fly_shop_distance"))} />
      </Field>
      <Field label="Grocery Distance">
        <FieldValue value={displayValue(get(data, "grocery_distance"))} />
      </Field>
      <Field label="Camping Details" full>
        <FieldValue value={displayValue(get(data, "camping_details"))} />
      </Field>

      {/* Site amenities grid */}
      <div className="sm:col-span-2">
        <dt className="mb-2 text-xs font-medium text-text-secondary">Site Amenities</dt>
        <dd className="flex flex-wrap gap-2">
          {SITE_AMENITIES.map(({ key, label }) => {
            const available = siteAmenities?.[key];
            return (
              <span
                key={key}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs",
                  available
                    ? "bg-forest/10 text-forest"
                    : "bg-offwhite text-text-light"
                )}
              >
                {available ? "+" : "-"} {label}
              </span>
            );
          })}
        </dd>
      </div>

      {/* Nearby services grid */}
      <div className="sm:col-span-2">
        <dt className="mb-2 text-xs font-medium text-text-secondary">Nearby Services</dt>
        <dd className="flex flex-wrap gap-2">
          {NEARBY_SERVICES.map(({ key, label }) => {
            const available = nearbyServices?.[key];
            return (
              <span
                key={key}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs",
                  available
                    ? "bg-river/10 text-river"
                    : "bg-offwhite text-text-light"
                )}
              >
                {available ? "+" : "-"} {label}
              </span>
            );
          })}
        </dd>
      </div>

      <Field label="Notes" full>
        <FieldValue value={displayValue(get(data, "notes"))} />
      </Field>
    </SectionCard>
  );
}

function ExperienceProfileSection({ data }: { data: unknown }) {
  return (
    <SectionCard title="Experience Profile">
      <Field label="Solitude">
        <FieldValue value={displayRating(get(data, "solitude_rating"), "solitude")} />
      </Field>
      <Field label="Scenery">
        <FieldValue value={displayRating(get(data, "scenery_rating"), "scenery")} />
      </Field>
      <Field label="Photography">
        <FieldValue value={displayRating(get(data, "photography_rating"), "photography")} />
      </Field>
      <Field label="Beginner-Friendly">
        <FieldValue value={displayRating(get(data, "beginner_rating"), "beginner_friendly")} />
      </Field>
      <Field label="Best For">
        <FieldValue value={displayMultiSelect(get(data, "best_for"), BEST_FOR_LABELS)} />
      </Field>
      <Field label="Property Story" full>
        <FieldValue value={displayValue(get(data, "property_story"))} />
      </Field>
      <Field label="Unique Features" full>
        <FieldValue value={displayValue(get(data, "unique_features"))} />
      </Field>
      <Field label="Scenic Highlights" full>
        <FieldValue value={displayValue(get(data, "scenic_highlights"))} />
      </Field>
      <Field label="Photography Spots" full>
        <FieldValue value={displayValue(get(data, "photography_spots"))} />
      </Field>
      <Field label="Notes" full>
        <FieldValue value={displayValue(get(data, "notes"))} />
      </Field>
    </SectionCard>
  );
}

function PressureCrowdingSection({ data }: { data: unknown }) {
  return (
    <SectionCard title="Pressure & Crowding">
      <Field label="Overall Pressure">
        <FieldValue value={displaySelect(get(data, "overall_pressure"), PRESSURE_LEVEL_LABELS)} />
      </Field>
      <Field label="Weekday Pressure">
        <FieldValue value={displaySelect(get(data, "weekday_pressure"), PRESSURE_LEVEL_LABELS)} />
      </Field>
      <Field label="Weekend Pressure">
        <FieldValue value={displaySelect(get(data, "weekend_pressure"), PRESSURE_LEVEL_LABELS)} />
      </Field>
      <Field label="Peak Season Pressure">
        <FieldValue value={displaySelect(get(data, "peak_pressure"), PRESSURE_LEVEL_LABELS)} />
      </Field>
      <Field label="Off-Season Pressure">
        <FieldValue value={displaySelect(get(data, "off_season_pressure"), PRESSURE_LEVEL_LABELS)} />
      </Field>
      <Field label="Busiest Months">
        <FieldValue value={displayMultiSelect(get(data, "busiest_months"), MONTH_LABELS)} />
      </Field>
      <Field label="Quietest Months">
        <FieldValue value={displayMultiSelect(get(data, "quietest_months"), MONTH_LABELS)} />
      </Field>
      <Field label="Crowd Type">
        <FieldValue value={displayValue(get(data, "crowd_type"))} />
      </Field>
      <Field label="Notes" full>
        <FieldValue value={displayValue(get(data, "notes"))} />
      </Field>
    </SectionCard>
  );
}

/* ── Main component ────────────────────────────────────────── */

const SECTION_RENDERERS: Record<string, (data: unknown) => React.ReactNode> = {
  water_characteristics: (d) => <WaterCharacteristicsSection data={d} />,
  species_detail: (d) => <SpeciesDetailSection data={d} />,
  hatches_and_patterns: (d) => <HatchesSection data={d} />,
  seasonal_conditions: (d) => <SeasonalConditionsSection data={d} />,
  flow_and_gauge: (d) => <FlowGaugeSection data={d} />,
  access_and_logistics: (d) => <AccessLogisticsSection data={d} />,
  regulations_and_rules: (d) => <RegulationsSection data={d} />,
  equipment_recommendations: (d) => <EquipmentSection data={d} />,
  safety_and_hazards: (d) => <SafetySection data={d} />,
  amenities: (d) => <AmenitiesSection data={d} />,
  experience_profile: (d) => <ExperienceProfileSection data={d} />,
  pressure_and_crowding: (d) => <PressureCrowdingSection data={d} />,
};

export default function KnowledgeDisplay({ knowledge }: KnowledgeDisplayProps) {
  if (!knowledge) {
    return (
      <div className="rounded-xl border border-stone-light/20 p-6 text-center">
        <p className="text-sm text-text-light italic">
          No knowledge profile available for this property.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="font-[family-name:var(--font-heading)] text-xl font-semibold text-text-primary">
        Property Knowledge Profile
      </h2>
      {KNOWLEDGE_SECTIONS.map((section) => {
        const renderer = SECTION_RENDERERS[section.key];
        if (!renderer) return null;
        const sectionData = knowledge[section.key];
        return <div key={section.key}>{renderer(sectionData)}</div>;
      })}
    </div>
  );
}
