// ═══════════════════════════════════════════════════════════════
// Property Knowledge Profile — Constants
// ═══════════════════════════════════════════════════════════════

// ── Section metadata ──────────────────────────────────────────

export const KNOWLEDGE_SECTIONS = [
  { key: "water_characteristics", label: "Water Characteristics", icon: "Droplets", description: "Clarity, temperature, depth, structure, and wading conditions" },
  { key: "species_detail", label: "Species Detail", icon: "Fish", description: "Per-species sizes, abundance, trophy potential, stocking, and behavior" },
  { key: "hatches_and_patterns", label: "Hatches & Fly Patterns", icon: "Bug", description: "Insect hatches, timing, and matching fly recommendations" },
  { key: "seasonal_conditions", label: "Seasonal Conditions", icon: "Calendar", description: "Best months, per-season profiles, runoff timing" },
  { key: "flow_and_gauge", label: "Flow & Gauge Data", icon: "Gauge", description: "USGS gauge info, optimal flows, stress thresholds" },
  { key: "access_and_logistics", label: "Access & Logistics", icon: "MapPin", description: "Parking, cell coverage, walk distance, boat access, nearest town" },
  { key: "regulations_and_rules", label: "Regulations & Rules", icon: "Scale", description: "Catch and release, barbless hooks, slot limits, seasonal closures" },
  { key: "equipment_recommendations", label: "Equipment Recommendations", icon: "Wrench", description: "Rod weights, waders, fly box essentials, tippet, and more" },
  { key: "safety_and_hazards", label: "Safety & Hazards", icon: "AlertTriangle", description: "Wildlife, terrain, water hazards, and emergency info" },
  { key: "amenities", label: "Amenities & Facilities", icon: "Home", description: "Restrooms, camping, cleaning stations, nearby services" },
  { key: "experience_profile", label: "Experience Profile", icon: "Star", description: "Solitude, scenery, skill level, what makes this place special" },
  { key: "pressure_and_crowding", label: "Pressure & Crowding", icon: "Users", description: "Fishing pressure by season and day of week" },
] as const;

export type KnowledgeSectionKey = (typeof KNOWLEDGE_SECTIONS)[number]["key"];

// ── Water Characteristics ─────────────────────────────────────

export const CLARITY_OPTIONS = ["crystal", "clear", "slightly_stained", "stained", "murky"] as const;
export type ClarityOption = (typeof CLARITY_OPTIONS)[number];
export const CLARITY_LABELS: Record<ClarityOption, string> = {
  crystal: "Crystal Clear (3ft+ visibility)",
  clear: "Clear (1.5-3ft visibility)",
  slightly_stained: "Slightly Stained (1-1.5ft)",
  stained: "Tea-Colored/Stained (<1ft)",
  murky: "Murky / Off-Color",
};

export const WADEABILITY_OPTIONS = ["easy", "moderate", "challenging", "expert_only", "not_wadeable"] as const;
export type WadeabilityOption = (typeof WADEABILITY_OPTIONS)[number];
export const WADEABILITY_LABELS: Record<WadeabilityOption, string> = {
  easy: "Easy — shallow, even bottom",
  moderate: "Moderate — knee to waist, some current",
  challenging: "Challenging — strong current, uneven bottom",
  expert_only: "Expert Only — deep, fast, or technical",
  not_wadeable: "Not Wadeable — float/boat access only",
};

export const DEPTH_ZONES = ["shallow_under_2ft", "wadeable_2_4ft", "deep_4_8ft", "very_deep_8ft_plus"] as const;
export type DepthZone = (typeof DEPTH_ZONES)[number];
export const DEPTH_ZONE_LABELS: Record<DepthZone, string> = {
  shallow_under_2ft: "Shallow (under 2ft)",
  wadeable_2_4ft: "Wadeable (2-4ft)",
  deep_4_8ft: "Deep (4-8ft)",
  very_deep_8ft_plus: "Very Deep (8ft+)",
};

export const STRUCTURAL_FEATURES = [
  "pools", "riffles", "runs", "pocket_water", "eddies",
  "undercut_banks", "deep_holes", "tailouts", "log_jams",
  "boulder_gardens", "spring_seeps", "side_channels",
] as const;
export type StructuralFeature = (typeof STRUCTURAL_FEATURES)[number];
export const STRUCTURAL_FEATURE_LABELS: Record<StructuralFeature, string> = {
  pools: "Pools",
  riffles: "Riffles",
  runs: "Runs",
  pocket_water: "Pocket Water",
  eddies: "Eddies",
  undercut_banks: "Undercut Banks",
  deep_holes: "Deep Holes",
  tailouts: "Tailouts",
  log_jams: "Log Jams / Woody Debris",
  boulder_gardens: "Boulder Gardens",
  spring_seeps: "Spring Seeps / Cold Water Inflows",
  side_channels: "Side Channels / Braids",
};

export const BOTTOM_COMPOSITIONS = ["gravel", "cobble", "sand", "silt", "boulder", "bedrock", "clay", "mixed"] as const;
export type BottomComposition = (typeof BOTTOM_COMPOSITIONS)[number];
export const BOTTOM_COMPOSITION_LABELS: Record<BottomComposition, string> = {
  gravel: "Gravel",
  cobble: "Cobble",
  sand: "Sand",
  silt: "Silt / Mud",
  boulder: "Boulder",
  bedrock: "Bedrock",
  clay: "Clay",
  mixed: "Mixed",
};

// ── Species Detail ────────────────────────────────────────────

export const ABUNDANCE_OPTIONS = ["abundant", "common", "present", "rare"] as const;
export type AbundanceOption = (typeof ABUNDANCE_OPTIONS)[number];
export const ABUNDANCE_LABELS: Record<AbundanceOption, string> = {
  abundant: "Abundant — dominant species",
  common: "Common — regularly caught",
  present: "Present — occasional catches",
  rare: "Rare — uncommon but possible",
};

export const POPULATION_SOURCE_OPTIONS = ["wild", "stocked", "mixed"] as const;
export type PopulationSourceOption = (typeof POPULATION_SOURCE_OPTIONS)[number];
export const POPULATION_SOURCE_LABELS: Record<PopulationSourceOption, string> = {
  wild: "Wild / Self-Sustaining",
  stocked: "Stocked",
  mixed: "Mixed (Wild + Stocked)",
};

export const FEEDING_PATTERNS = ["surface", "subsurface", "bottom", "streamer_hunters", "opportunistic"] as const;
export type FeedingPattern = (typeof FEEDING_PATTERNS)[number];
export const FEEDING_PATTERN_LABELS: Record<FeedingPattern, string> = {
  surface: "Surface Feeders (dry fly targets)",
  subsurface: "Subsurface / Nymph Feeders",
  bottom: "Bottom Feeders",
  streamer_hunters: "Streamer Hunters (aggressive)",
  opportunistic: "Opportunistic (take anything)",
};

export const SPAWN_MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
] as const;
export type SpawnMonth = (typeof SPAWN_MONTHS)[number];
export const MONTH_LABELS: Record<SpawnMonth, string> = {
  january: "January", february: "February", march: "March",
  april: "April", may: "May", june: "June",
  july: "July", august: "August", september: "September",
  october: "October", november: "November", december: "December",
};

// ── Hatches & Fly Patterns ────────────────────────────────────

export const INSECT_TYPES = ["mayfly", "caddis", "stonefly", "midge", "terrestrial", "other"] as const;
export type InsectType = (typeof INSECT_TYPES)[number];
export const INSECT_TYPE_LABELS: Record<InsectType, string> = {
  mayfly: "Mayfly",
  caddis: "Caddisfly",
  stonefly: "Stonefly",
  midge: "Midge",
  terrestrial: "Terrestrial (hoppers, ants, beetles)",
  other: "Other",
};

export const FLY_CATEGORIES = ["dry", "nymph", "emerger", "streamer", "wet"] as const;
export type FlyCategory = (typeof FLY_CATEGORIES)[number];
export const FLY_CATEGORY_LABELS: Record<FlyCategory, string> = {
  dry: "Dry Fly",
  nymph: "Nymph",
  emerger: "Emerger",
  streamer: "Streamer",
  wet: "Wet Fly",
};

export const TIME_OF_DAY_OPTIONS = ["early_morning", "morning", "midday", "afternoon", "evening", "dusk", "all_day"] as const;
export type TimeOfDay = (typeof TIME_OF_DAY_OPTIONS)[number];
export const TIME_OF_DAY_LABELS: Record<TimeOfDay, string> = {
  early_morning: "Early Morning (dawn)",
  morning: "Morning",
  midday: "Midday",
  afternoon: "Afternoon",
  evening: "Evening",
  dusk: "Dusk / Last Light",
  all_day: "All Day",
};

// ── Seasonal Conditions ───────────────────────────────────────

export const SEASONS = ["spring", "summer", "fall", "winter"] as const;
export type Season = (typeof SEASONS)[number];
export const SEASON_LABELS: Record<Season, string> = {
  spring: "Spring (Mar-May)",
  summer: "Summer (Jun-Aug)",
  fall: "Fall (Sep-Nov)",
  winter: "Winter (Dec-Feb)",
};

export const FISH_ACTIVITY_OPTIONS = ["very_active", "active", "moderate", "slow", "dormant"] as const;
export type FishActivity = (typeof FISH_ACTIVITY_OPTIONS)[number];
export const FISH_ACTIVITY_LABELS: Record<FishActivity, string> = {
  very_active: "Very Active — aggressive feeding",
  active: "Active — good action",
  moderate: "Moderate — selective feeding",
  slow: "Slow — lethargic, deep",
  dormant: "Dormant — minimal activity",
};

export const TECHNIQUE_OPTIONS = [
  "dry_fly", "nymphing", "euro_nymphing", "streamer",
  "wet_fly", "indicator_nymphing", "sight_fishing",
  "hopper_dropper", "mouse_patterns", "midging",
] as const;
export type Technique = (typeof TECHNIQUE_OPTIONS)[number];
export const TECHNIQUE_LABELS: Record<Technique, string> = {
  dry_fly: "Dry Fly",
  nymphing: "Nymphing",
  euro_nymphing: "Euro / Tight-Line Nymphing",
  streamer: "Streamer",
  wet_fly: "Wet Fly",
  indicator_nymphing: "Indicator Nymphing",
  sight_fishing: "Sight Fishing",
  hopper_dropper: "Hopper-Dropper",
  mouse_patterns: "Mouse / Night Patterns",
  midging: "Midging",
};

// ── Flow & Gauge ──────────────────────────────────────────────

// No enum options needed — mostly numeric/text fields

// ── Access & Logistics ────────────────────────────────────────

export const PARKING_SURFACE_OPTIONS = ["paved", "gravel", "dirt", "grass", "roadside"] as const;
export type ParkingSurface = (typeof PARKING_SURFACE_OPTIONS)[number];
export const PARKING_SURFACE_LABELS: Record<ParkingSurface, string> = {
  paved: "Paved",
  gravel: "Gravel",
  dirt: "Dirt / Unimproved",
  grass: "Grass",
  roadside: "Roadside Pullout",
};

export const VEHICLE_CLEARANCE_OPTIONS = ["any", "high_clearance", "awd_4wd"] as const;
export type VehicleClearance = (typeof VEHICLE_CLEARANCE_OPTIONS)[number];
export const VEHICLE_CLEARANCE_LABELS: Record<VehicleClearance, string> = {
  any: "Any Vehicle (sedan OK)",
  high_clearance: "High-Clearance Recommended",
  awd_4wd: "AWD / 4WD Required",
};

export const ACCESS_METHOD_OPTIONS = ["wade", "float", "both"] as const;
export type AccessMethod = (typeof ACCESS_METHOD_OPTIONS)[number];
export const ACCESS_METHOD_LABELS: Record<AccessMethod, string> = {
  wade: "Wade Only",
  float: "Float / Boat Only",
  both: "Both Wade & Float",
};

export const BOAT_LAUNCH_OPTIONS = ["improved_ramp", "gravel_ramp", "bank_launch", "carry_in", "none"] as const;
export type BoatLaunchType = (typeof BOAT_LAUNCH_OPTIONS)[number];
export const BOAT_LAUNCH_LABELS: Record<BoatLaunchType, string> = {
  improved_ramp: "Improved Ramp",
  gravel_ramp: "Gravel / Unimproved Ramp",
  bank_launch: "Bank Launch",
  carry_in: "Carry-In Only",
  none: "No Boat Launch",
};

export const FLOAT_DIFFICULTY_OPTIONS = ["easy", "intermediate", "advanced", "expert"] as const;
export type FloatDifficulty = (typeof FLOAT_DIFFICULTY_OPTIONS)[number];
export const FLOAT_DIFFICULTY_LABELS: Record<FloatDifficulty, string> = {
  easy: "Easy — calm water, no hazards",
  intermediate: "Intermediate — some rapids, rocks",
  advanced: "Advanced — significant rapids, maneuvering",
  expert: "Expert — dangerous conditions, guide required",
};

export const BOAT_TYPES_ALLOWED = [
  "drift_boat", "raft", "kayak", "canoe", "pontoon", "jet_boat", "motorized",
] as const;
export type BoatType = (typeof BOAT_TYPES_ALLOWED)[number];
export const BOAT_TYPE_LABELS: Record<BoatType, string> = {
  drift_boat: "Drift Boat",
  raft: "Raft",
  kayak: "Kayak",
  canoe: "Canoe",
  pontoon: "Pontoon / Kick Boat",
  jet_boat: "Jet Boat",
  motorized: "Motorized Boat",
};

export const CELL_COVERAGE_OPTIONS = ["full", "limited", "emergency_only", "none"] as const;
export type CellCoverage = (typeof CELL_COVERAGE_OPTIONS)[number];
export const CELL_COVERAGE_LABELS: Record<CellCoverage, string> = {
  full: "Full Coverage (4G/5G)",
  limited: "Limited / Spotty",
  emergency_only: "Emergency Calls Only",
  none: "No Coverage",
};

// ── Regulations & Rules ───────────────────────────────────────

export const CATCH_RELEASE_OPTIONS = ["required", "voluntary", "harvest_allowed"] as const;
export type CatchReleaseOption = (typeof CATCH_RELEASE_OPTIONS)[number];
export const CATCH_RELEASE_LABELS: Record<CatchReleaseOption, string> = {
  required: "Catch and Release Required",
  voluntary: "Voluntary Catch and Release (recommended)",
  harvest_allowed: "Harvest Allowed (within limits)",
};

export const HOOK_RULE_OPTIONS = ["barbless_required", "barbless_recommended", "single_hook", "no_restriction"] as const;
export type HookRule = (typeof HOOK_RULE_OPTIONS)[number];
export const HOOK_RULE_LABELS: Record<HookRule, string> = {
  barbless_required: "Barbless Hooks Required",
  barbless_recommended: "Barbless Hooks Recommended",
  single_hook: "Single Hook Only",
  no_restriction: "No Hook Restrictions",
};

export const METHOD_RESTRICTION_OPTIONS = ["fly_only", "artificial_only", "no_restriction"] as const;
export type MethodRestriction = (typeof METHOD_RESTRICTION_OPTIONS)[number];
export const METHOD_RESTRICTION_LABELS: Record<MethodRestriction, string> = {
  fly_only: "Fly Fishing Only",
  artificial_only: "Artificial Lures / Flies Only",
  no_restriction: "No Method Restrictions",
};

// ── Equipment Recommendations ─────────────────────────────────

export const ROD_WEIGHTS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"] as const;
export type RodWeight = (typeof ROD_WEIGHTS)[number];

export const WADER_TYPE_OPTIONS = ["chest", "hip", "wet_wade", "varies_by_season"] as const;
export type WaderType = (typeof WADER_TYPE_OPTIONS)[number];
export const WADER_TYPE_LABELS: Record<WaderType, string> = {
  chest: "Chest Waders",
  hip: "Hip Waders / Hip Boots",
  wet_wade: "Wet Wade (no waders needed)",
  varies_by_season: "Varies by Season",
};

export const BOOT_TYPE_OPTIONS = ["felt", "rubber", "studded", "any"] as const;
export type BootType = (typeof BOOT_TYPE_OPTIONS)[number];
export const BOOT_TYPE_LABELS: Record<BootType, string> = {
  felt: "Felt Sole",
  rubber: "Rubber Sole",
  studded: "Studded / Cleated",
  any: "Any Type",
};

export const ESSENTIAL_FLY_CATEGORIES = [
  "dries", "nymphs", "streamers", "emergers", "terrestrials", "midges",
] as const;
export type EssentialFlyCategory = (typeof ESSENTIAL_FLY_CATEGORIES)[number];
export const ESSENTIAL_FLY_CATEGORY_LABELS: Record<EssentialFlyCategory, string> = {
  dries: "Dry Flies",
  nymphs: "Nymphs",
  streamers: "Streamers",
  emergers: "Emergers",
  terrestrials: "Terrestrials (hoppers, ants, beetles)",
  midges: "Midges",
};

// ── Safety & Hazards ──────────────────────────────────────────

export const WILDLIFE_HAZARDS = [
  "bears", "mountain_lions", "moose", "rattlesnakes", "ticks",
  "mosquitoes", "wasps", "wild_boar", "alligators",
] as const;
export type WildlifeHazard = (typeof WILDLIFE_HAZARDS)[number];
export const WILDLIFE_HAZARD_LABELS: Record<WildlifeHazard, string> = {
  bears: "Bears (Black or Grizzly)",
  mountain_lions: "Mountain Lions / Cougars",
  moose: "Moose",
  rattlesnakes: "Rattlesnakes",
  ticks: "Ticks",
  mosquitoes: "Mosquitoes / Biting Insects",
  wasps: "Wasps / Hornets",
  wild_boar: "Wild Boar / Feral Hogs",
  alligators: "Alligators",
};

export const WATER_HAZARDS = [
  "strong_current", "deep_holes", "slippery_rocks", "sweepers",
  "logjams", "flash_flood_risk", "cold_water_shock", "waterfalls",
] as const;
export type WaterHazard = (typeof WATER_HAZARDS)[number];
export const WATER_HAZARD_LABELS: Record<WaterHazard, string> = {
  strong_current: "Strong Current",
  deep_holes: "Deep Holes / Sudden Drop-offs",
  slippery_rocks: "Slippery Rocks / Algae",
  sweepers: "Sweepers / Overhanging Trees",
  logjams: "Log Jams",
  flash_flood_risk: "Flash Flood Risk",
  cold_water_shock: "Cold Water Shock Risk",
  waterfalls: "Waterfalls / Drops",
};

export const TERRAIN_DIFFICULTY_OPTIONS = ["easy", "moderate", "rugged", "extreme"] as const;
export type TerrainDifficulty = (typeof TERRAIN_DIFFICULTY_OPTIONS)[number];
export const TERRAIN_DIFFICULTY_LABELS: Record<TerrainDifficulty, string> = {
  easy: "Easy — flat, well-maintained paths",
  moderate: "Moderate — some uneven terrain",
  rugged: "Rugged — steep, rocky, or overgrown",
  extreme: "Extreme — scrambling, no trail",
};

export const REMOTE_RATING_OPTIONS = ["accessible", "somewhat_remote", "remote", "very_remote"] as const;
export type RemoteRating = (typeof REMOTE_RATING_OPTIONS)[number];
export const REMOTE_RATING_LABELS: Record<RemoteRating, string> = {
  accessible: "Accessible — close to town/services",
  somewhat_remote: "Somewhat Remote — 30+ min from services",
  remote: "Remote — 1+ hour from services",
  very_remote: "Very Remote — backcountry / off-grid",
};

// ── Amenities ─────────────────────────────────────────────────

export const RESTROOM_TYPE_OPTIONS = ["flush", "vault", "pit", "portable", "none"] as const;
export type RestroomType = (typeof RESTROOM_TYPE_OPTIONS)[number];
export const RESTROOM_TYPE_LABELS: Record<RestroomType, string> = {
  flush: "Flush Toilet",
  vault: "Vault Toilet",
  pit: "Pit Toilet / Outhouse",
  portable: "Portable / Porta-Potty",
  none: "None (pack it out)",
};

export const SITE_AMENITIES = [
  { key: "restrooms", label: "Restrooms" },
  { key: "drinking_water", label: "Drinking Water" },
  { key: "shade_structures", label: "Shade / Shelters" },
  { key: "picnic_tables", label: "Picnic Tables" },
  { key: "fire_pits", label: "Fire Pits" },
  { key: "camping_allowed", label: "Camping Allowed" },
  { key: "rv_hookups", label: "RV Hookups" },
  { key: "fish_cleaning_station", label: "Fish Cleaning Station" },
  { key: "gear_storage", label: "Gear Storage" },
  { key: "boat_storage", label: "Boat Storage" },
  { key: "trash_disposal", label: "Trash / Recycling" },
  { key: "dog_friendly", label: "Dog Friendly" },
] as const;

export const NEARBY_SERVICES = [
  { key: "fly_shop", label: "Fly Shop" },
  { key: "grocery", label: "Grocery Store" },
  { key: "gas_station", label: "Gas Station" },
  { key: "restaurant", label: "Restaurant / Cafe" },
  { key: "hospital", label: "Hospital / Urgent Care" },
  { key: "lodging_nearby", label: "Lodging Nearby" },
  { key: "guide_service", label: "Guide Service" },
  { key: "gear_rental", label: "Gear Rental" },
] as const;

// ── Experience Profile ────────────────────────────────────────

export const RATING_OPTIONS = [1, 2, 3, 4, 5] as const;
export type RatingValue = (typeof RATING_OPTIONS)[number];

export const RATING_LABELS: Record<string, Record<number, string>> = {
  solitude: { 1: "Very Crowded", 2: "Busy", 3: "Moderate", 4: "Peaceful", 5: "Total Solitude" },
  scenery: { 1: "Plain", 2: "Pleasant", 3: "Nice", 4: "Beautiful", 5: "Spectacular" },
  photography: { 1: "Limited", 2: "Fair", 3: "Good", 4: "Excellent", 5: "World-Class" },
  beginner_friendly: { 1: "Expert Only", 2: "Advanced", 3: "Intermediate", 4: "Beginner OK", 5: "Very Beginner-Friendly" },
};

export const BEST_FOR_OPTIONS = [
  "beginners", "intermediate", "experienced", "trophy_hunters",
  "families", "solitude_seekers", "photographers", "wade_fishers",
  "float_fishers", "dry_fly_purists",
] as const;
export type BestForOption = (typeof BEST_FOR_OPTIONS)[number];
export const BEST_FOR_LABELS: Record<BestForOption, string> = {
  beginners: "Beginners",
  intermediate: "Intermediate Anglers",
  experienced: "Experienced Anglers",
  trophy_hunters: "Trophy Hunters",
  families: "Families",
  solitude_seekers: "Solitude Seekers",
  photographers: "Photographers / Scenery Lovers",
  wade_fishers: "Wade Fishers",
  float_fishers: "Float / Boat Fishers",
  dry_fly_purists: "Dry Fly Purists",
};

// ── Pressure & Crowding ───────────────────────────────────────

export const PRESSURE_LEVEL_OPTIONS = ["very_low", "low", "moderate", "high", "very_high"] as const;
export type PressureLevel = (typeof PRESSURE_LEVEL_OPTIONS)[number];
export const PRESSURE_LEVEL_LABELS: Record<PressureLevel, string> = {
  very_low: "Very Low — rarely see another angler",
  low: "Low — occasional encounters",
  moderate: "Moderate — shared water but manageable",
  high: "High — popular, plan for company",
  very_high: "Very High — crowded, especially weekends",
};

export const DAYS_OF_WEEK = [
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
] as const;
export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];
export const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday",
  thursday: "Thursday", friday: "Friday", saturday: "Saturday", sunday: "Sunday",
};

// ── Completeness field counts per section ─────────────────────
// Used by knowledge-completeness.ts to calculate profile score.
// Each number represents the total "answerable" fields in that section.

export const SECTION_FIELD_COUNTS: Record<KnowledgeSectionKey, number> = {
  water_characteristics: 8,   // clarity, temp_spring/summer/fall/winter, wadeability, depth_zones, structural_features, bottom_composition
  species_detail: 1,          // at least one species entry with 3+ filled fields
  hatches_and_patterns: 1,    // at least one hatch entry with 3+ filled fields
  seasonal_conditions: 6,     // best_months, runoff_timing, + 4 season profiles
  flow_and_gauge: 5,          // gauge_id, gauge_url, optimal_wade_cfs_min/max, stress_temp_f
  access_and_logistics: 10,   // elevation, nearest_town, parking_spaces, parking_surface, vehicle_clearance, walk_distance_ft, cell_coverage, access_method, boat_launch, float_difficulty
  regulations_and_rules: 5,   // catch_release, hook_rules, method_restriction, creel_limit, club_specific_rules
  equipment_recommendations: 7, // rod_weight_primary, rod_weight_secondary, wader_type, boot_type, essential_flies, fly_size_range, tippet_range
  safety_and_hazards: 5,      // wildlife_hazards, water_hazards, terrain_difficulty, remote_rating, nearest_hospital
  amenities: 3,               // site_amenities, restroom_type, nearby_services
  experience_profile: 6,      // solitude_rating, scenery_rating, beginner_rating, best_for, property_story, unique_features
  pressure_and_crowding: 3,   // overall_pressure, weekday_pressure, weekend_pressure
};

export const TOTAL_KNOWLEDGE_FIELDS = Object.values(SECTION_FIELD_COUNTS).reduce((a, b) => a + b, 0);
