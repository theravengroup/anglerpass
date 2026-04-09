"use client";

import {
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
} from "@/lib/constants/property-knowledge";
import {
  displayValue,
  displaySelect,
  displayMultiSelect,
  displayBoolean,
} from "./knowledge-display-helpers";
import { SectionCard, Field, FieldValue, get } from "./knowledge-display-primitives";

export function AccessLogisticsSection({ data }: { data: unknown }) {
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

export function RegulationsSection({ data }: { data: unknown }) {
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

export function EquipmentSection({ data }: { data: unknown }) {
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

export function SafetySection({ data }: { data: unknown }) {
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
