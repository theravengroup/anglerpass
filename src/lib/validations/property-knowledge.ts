import { z } from "zod";

// ═══════════════════════════════════════════════════════════════
// Property Knowledge Profile — Zod Validation
// Every field is optional/nullable so landowners/clubs can skip anything.
// ═══════════════════════════════════════════════════════════════

// ── Reusable helpers ──────────────────────────────────────────

const optionalString = z.string().optional().nullable();
const optionalNumber = z.number().optional().nullable();
const optionalBoolean = z.boolean().optional().nullable();
const optionalStringArray = z.array(z.string()).optional().nullable();

const tempProfileSchema = z.object({
  min_f: optionalNumber,
  max_f: optionalNumber,
  optimal_f: optionalNumber,
}).optional().nullable();

// ── Section 1: Water Characteristics ──────────────────────────

export const waterCharacteristicsSchema = z.object({
  clarity: optionalString,
  wadeability: optionalString,
  depth_zones: optionalStringArray,
  structural_features: optionalStringArray,
  bottom_composition: optionalStringArray,
  stream_width_ft_min: optionalNumber,
  stream_width_ft_max: optionalNumber,
  temp_spring: tempProfileSchema,
  temp_summer: tempProfileSchema,
  temp_fall: tempProfileSchema,
  temp_winter: tempProfileSchema,
}).optional().nullable();

// ── Section 2: Species Detail ─────────────────────────────────

export const speciesEntrySchema = z.object({
  species_name: z.string().min(1, "Species name required"),
  abundance: optionalString,
  avg_size_min_inches: optionalNumber,
  avg_size_max_inches: optionalNumber,
  trophy_size_inches: optionalNumber,
  population_source: optionalString,
  stocking_schedule: optionalString,
  spawn_months: optionalStringArray,
  feeding_patterns: optionalStringArray,
  best_technique: optionalString,
  notes: optionalString,
});

export const speciesDetailSchema = z.array(speciesEntrySchema).default([]);

// ── Section 3: Hatches & Fly Patterns ─────────────────────────

export const hatchEntrySchema = z.object({
  insect_name: z.string().min(1, "Hatch name required"),
  insect_type: optionalString,
  peak_months: optionalStringArray,
  time_of_day: optionalString,
  matching_patterns: optionalString,  // free text: "Parachute Adams #16, RS2 #20"
  fly_categories: optionalStringArray, // ["dry", "nymph", "emerger"]
  hook_sizes: optionalString,         // free text: "14-20"
  intensity: optionalString,          // "sporadic", "moderate", "reliable", "blanket"
  notes: optionalString,
});

export const hatchesAndPatternsSchema = z.array(hatchEntrySchema).default([]);

// ── Section 4: Seasonal Conditions ────────────────────────────

const seasonProfileSchema = z.object({
  water_temp_range: optionalString,  // e.g. "45-55°F"
  clarity: optionalString,
  flow_description: optionalString,
  fish_activity: optionalString,
  best_techniques: optionalStringArray,
  wading_difficulty: optionalString,
  accessibility_notes: optionalString,
}).optional().nullable();

export const seasonalConditionsSchema = z.object({
  best_months: optionalStringArray,
  worst_months: optionalStringArray,
  runoff_timing: optionalString,    // e.g. "Late May through mid-June"
  runoff_notes: optionalString,
  spring: seasonProfileSchema,
  summer: seasonProfileSchema,
  fall: seasonProfileSchema,
  winter: seasonProfileSchema,
}).optional().nullable();

// ── Section 5: Flow & Gauge Data ──────────────────────────────

export const flowAndGaugeSchema = z.object({
  usgs_gauge_id: optionalString,
  gauge_url: optionalString,
  gauge_name: optionalString,
  optimal_wade_cfs_min: optionalNumber,
  optimal_wade_cfs_max: optionalNumber,
  optimal_float_cfs_min: optionalNumber,
  optimal_float_cfs_max: optionalNumber,
  max_safe_wade_cfs: optionalNumber,
  stress_temp_f: optionalNumber,     // above this, voluntary C&R recommended
  base_flow_cfs: optionalNumber,     // typical low-water flow
  notes: optionalString,
}).optional().nullable();

// ── Section 6: Access & Logistics ─────────────────────────────

export const accessAndLogisticsSchema = z.object({
  elevation_ft: optionalNumber,
  nearest_town: optionalString,
  nearest_town_distance_miles: optionalNumber,
  nearest_airport: optionalString,
  nearest_airport_distance_miles: optionalNumber,
  parking_spaces: optionalNumber,
  parking_surface: optionalString,
  vehicle_clearance: optionalString,
  walk_distance_to_water_ft: optionalNumber,
  walk_time_minutes: optionalNumber,
  cell_coverage: optionalString,
  best_cell_carriers: optionalString,
  access_method: optionalString,     // wade, float, both
  boat_launch_type: optionalString,
  boat_types_allowed: optionalStringArray,
  float_difficulty: optionalString,
  float_distance_miles: optionalNumber,
  shuttle_available: optionalBoolean,
  road_conditions_notes: optionalString,  // seasonal road conditions
  directions_notes: optionalString,       // general directions (NOT gate codes)
}).optional().nullable();

// ── Section 7: Regulations & Rules ────────────────────────────

const slotLimitSchema = z.object({
  species: z.string(),
  min_inches: optionalNumber,
  max_inches: optionalNumber,
  creel_limit: optionalNumber,
}).optional().nullable();

export const regulationsAndRulesSchema = z.object({
  catch_release: optionalString,
  hook_rules: optionalString,
  method_restriction: optionalString,
  creel_limit: optionalNumber,
  slot_limits: z.array(slotLimitSchema).optional().nullable(),
  seasonal_closures: optionalString,   // free text description
  handling_requirements: optionalString, // "wet hands, rubber net, keep in water"
  wading_restrictions: optionalString,
  club_specific_rules: optionalString, // free text for club-imposed rules
  state_license_required: optionalBoolean,
  state_license_url: optionalString,
}).optional().nullable();

// ── Section 8: Equipment Recommendations ──────────────────────

export const equipmentRecommendationsSchema = z.object({
  rod_weight_primary: optionalString,
  rod_weight_secondary: optionalString,
  rod_length_ft_min: optionalNumber,
  rod_length_ft_max: optionalNumber,
  wader_type: optionalString,
  boot_type: optionalString,
  essential_fly_categories: optionalStringArray,
  fly_size_range: optionalString,      // e.g. "12-22"
  tippet_range: optionalString,        // e.g. "4X-6X"
  leader_length: optionalString,       // e.g. "9ft-12ft"
  net_recommended: optionalBoolean,
  wading_staff_recommended: optionalBoolean,
  strike_indicator_useful: optionalBoolean,
  specific_fly_recommendations: optionalString,  // free text: top 5-10 patterns
  gear_notes: optionalString,
}).optional().nullable();

// ── Section 9: Safety & Hazards ───────────────────────────────

export const safetyAndHazardsSchema = z.object({
  wildlife_hazards: optionalStringArray,
  wildlife_notes: optionalString,
  water_hazards: optionalStringArray,
  water_hazard_notes: optionalString,
  terrain_difficulty: optionalString,
  terrain_notes: optionalString,
  remote_rating: optionalString,
  nearest_hospital: optionalString,
  nearest_hospital_distance_miles: optionalNumber,
  emergency_response_minutes: optionalNumber,
  cell_for_emergency: optionalBoolean,
  bear_spray_recommended: optionalBoolean,
  wading_staff_for_safety: optionalBoolean,
  safety_notes: optionalString,        // general safety tips
}).optional().nullable();

// ── Section 10: Amenities ─────────────────────────────────────

export const amenitiesSchema = z.object({
  site_amenities: z.record(z.string(), z.boolean()).optional().nullable(),
  restroom_type: optionalString,
  nearby_services: z.record(z.string(), z.boolean()).optional().nullable(),
  nearest_fly_shop: optionalString,
  nearest_fly_shop_distance_miles: optionalNumber,
  nearest_grocery_distance_miles: optionalNumber,
  camping_details: optionalString,     // if camping allowed, describe
  amenity_notes: optionalString,
}).optional().nullable();

// ── Section 11: Experience Profile ────────────────────────────

export const experienceProfileSchema = z.object({
  solitude_rating: optionalNumber,     // 1-5
  scenery_rating: optionalNumber,      // 1-5
  photography_rating: optionalNumber,  // 1-5
  beginner_friendly_rating: optionalNumber, // 1-5
  best_for: optionalStringArray,
  property_story: optionalString,      // "What makes this place special?"
  unique_features: optionalString,     // specific highlights
  scenic_highlights: optionalString,   // mountains, canyons, wildlife viewing
  best_photography_spots: optionalString,
  experience_notes: optionalString,
}).optional().nullable();

// ── Section 12: Pressure & Crowding ───────────────────────────

export const pressureAndCrowdingSchema = z.object({
  overall_pressure: optionalString,
  weekday_pressure: optionalString,
  weekend_pressure: optionalString,
  peak_season_pressure: optionalString,
  off_season_pressure: optionalString,
  busiest_months: optionalStringArray,
  quietest_months: optionalStringArray,
  crowd_type: optionalString,          // "fly fishers only", "mixed recreation"
  pressure_notes: optionalString,
}).optional().nullable();

// ── Master schema ─────────────────────────────────────────────

export const propertyKnowledgeSchema = z.object({
  water_characteristics: waterCharacteristicsSchema,
  species_detail: speciesDetailSchema,
  hatches_and_patterns: hatchesAndPatternsSchema,
  seasonal_conditions: seasonalConditionsSchema,
  flow_and_gauge: flowAndGaugeSchema,
  access_and_logistics: accessAndLogisticsSchema,
  regulations_and_rules: regulationsAndRulesSchema,
  equipment_recommendations: equipmentRecommendationsSchema,
  safety_and_hazards: safetyAndHazardsSchema,
  amenities: amenitiesSchema,
  experience_profile: experienceProfileSchema,
  pressure_and_crowding: pressureAndCrowdingSchema,
});

export type PropertyKnowledgeFormData = z.input<typeof propertyKnowledgeSchema>;

// Per-section schemas map for wizard step validation
export const SECTION_SCHEMAS = {
  water_characteristics: waterCharacteristicsSchema,
  species_detail: speciesDetailSchema,
  hatches_and_patterns: hatchesAndPatternsSchema,
  seasonal_conditions: seasonalConditionsSchema,
  flow_and_gauge: flowAndGaugeSchema,
  access_and_logistics: accessAndLogisticsSchema,
  regulations_and_rules: regulationsAndRulesSchema,
  equipment_recommendations: equipmentRecommendationsSchema,
  safety_and_hazards: safetyAndHazardsSchema,
  amenities: amenitiesSchema,
  experience_profile: experienceProfileSchema,
  pressure_and_crowding: pressureAndCrowdingSchema,
} as const;
