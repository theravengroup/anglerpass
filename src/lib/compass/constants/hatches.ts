/**
 * Colorado Hatch Chart — 14 common aquatic insects.
 *
 * Each hatch includes: name, scientific order, typical pattern names and sizes,
 * season, water types, time of day, and temperature triggers.
 */

export interface HatchInfo {
  name: string;
  scientificName: string;
  order: string;
  patterns: string[];
  sizes: string; // e.g. "16-20"
  season: { start: number; end: number }; // 1-12 month range
  seasonLabel: string;
  waterTypes: string[];
  timeOfDay: string;
  temperatureTriggerF: { min: number; max: number } | null;
  notes: string;
}

export const COLORADO_HATCHES: HatchInfo[] = [
  {
    name: "Blue-Winged Olive (BWO)",
    scientificName: "Baetis spp.",
    order: "Ephemeroptera",
    patterns: ["Parachute BWO", "RS2", "Sparkle Dun", "WD-40", "Pheasant Tail"],
    sizes: "18-22",
    season: { start: 3, end: 11 },
    seasonLabel: "March–November (peak: April–May, Sept–Oct)",
    waterTypes: ["tailwater", "freestone", "spring creek"],
    timeOfDay: "Late morning through afternoon, best on overcast days",
    temperatureTriggerF: { min: 40, max: 55 },
    notes:
      "The most reliable hatch in Colorado. Prolific on cloudy, drizzly days. Fish small and delicate.",
  },
  {
    name: "Pale Morning Dun (PMD)",
    scientificName: "Ephemerella spp.",
    order: "Ephemeroptera",
    patterns: ["PMD Sparkle Dun", "PMD Parachute", "PMD Emerger", "Dorsey's PMD"],
    sizes: "16-20",
    season: { start: 6, end: 9 },
    seasonLabel: "June–September (peak: July–August)",
    waterTypes: ["tailwater", "spring creek"],
    timeOfDay: "Mid-morning to early afternoon",
    temperatureTriggerF: { min: 50, max: 62 },
    notes:
      "Generates blanket hatches on tailwaters. Fish become very selective — precise imitations required.",
  },
  {
    name: "Green Drake",
    scientificName: "Drunella grandis",
    order: "Ephemeroptera",
    patterns: ["Green Drake Parachute", "Green Drake Emerger", "Lawson's Green Drake"],
    sizes: "10-12",
    season: { start: 6, end: 8 },
    seasonLabel: "Late June–August (brief, intense)",
    waterTypes: ["freestone", "high-altitude stream"],
    timeOfDay: "Late morning, often during cloudy periods",
    temperatureTriggerF: { min: 48, max: 58 },
    notes:
      "The big-bug event. Brief emergence windows (1-2 weeks per stream). Big trout commit to these.",
  },
  {
    name: "Trico",
    scientificName: "Tricorythodes spp.",
    order: "Ephemeroptera",
    patterns: ["Trico Spinner", "Trico Parachute", "Trico Cluster"],
    sizes: "20-24",
    season: { start: 7, end: 10 },
    seasonLabel: "July–October (peak: August–September)",
    waterTypes: ["tailwater", "spring creek"],
    timeOfDay: "Early morning spinner falls, 7–10am",
    temperatureTriggerF: { min: 55, max: 70 },
    notes:
      "Tiny flies in massive numbers. Spinner fall is the main event. Fish the foam lines.",
  },
  {
    name: "Red Quill",
    scientificName: "Rhithrogena spp.",
    order: "Ephemeroptera",
    patterns: ["Red Quill Parachute", "Red Quill Emerger", "Quigley Cripple"],
    sizes: "14-16",
    season: { start: 4, end: 6 },
    seasonLabel: "April–June",
    waterTypes: ["freestone"],
    timeOfDay: "Midday",
    temperatureTriggerF: { min: 45, max: 55 },
    notes: "Spring freestone staple. Often concurrent with early BWO activity.",
  },
  {
    name: "Elk Hair Caddis / Spotted Sedge",
    scientificName: "Hydropsyche spp.",
    order: "Trichoptera",
    patterns: ["Elk Hair Caddis", "X-Caddis", "Goddard Caddis", "Pettis Pulsating Caddis"],
    sizes: "14-18",
    season: { start: 5, end: 9 },
    seasonLabel: "May–September (peak: June–July)",
    waterTypes: ["freestone", "tailwater"],
    timeOfDay: "Evening, dusk into dark",
    temperatureTriggerF: { min: 50, max: 65 },
    notes:
      "Iconic evening hatch. Fish the skitter/swing. Caddis emergers in the film produce well.",
  },
  {
    name: "Mother's Day Caddis",
    scientificName: "Brachycentrus spp.",
    order: "Trichoptera",
    patterns: ["Mothers Day Caddis", "Deep Sparkle Pupa", "Peacock Caddis"],
    sizes: "14-16",
    season: { start: 4, end: 5 },
    seasonLabel: "Late April–mid May",
    waterTypes: ["tailwater", "large freestone"],
    timeOfDay: "Midday to afternoon",
    temperatureTriggerF: { min: 48, max: 58 },
    notes:
      "Massive emergence on rivers like the Arkansas. One of the season's most anticipated events.",
  },
  {
    name: "Golden Stonefly",
    scientificName: "Perlidae",
    order: "Plecoptera",
    patterns: ["Golden Stone Dry", "Stimulator", "Chubby Chernobyl", "Pat's Rubber Legs"],
    sizes: "6-10",
    season: { start: 6, end: 8 },
    seasonLabel: "June–August (peak with runoff)",
    waterTypes: ["freestone", "canyon"],
    timeOfDay: "Afternoon, warm days",
    temperatureTriggerF: { min: 55, max: 70 },
    notes:
      "Big attractor patterns work as searching flies even between emergence windows. Bank feeders love these.",
  },
  {
    name: "Salmonfly",
    scientificName: "Pteronarcys californica",
    order: "Plecoptera",
    patterns: ["Salmonfly", "Sofa Pillow", "Chubby Chernobyl", "Fluttering Stone"],
    sizes: "4-8",
    season: { start: 5, end: 7 },
    seasonLabel: "Late May–July (follows snowmelt progression)",
    waterTypes: ["large freestone", "canyon"],
    timeOfDay: "Afternoon, warm sunny days",
    temperatureTriggerF: { min: 50, max: 62 },
    notes:
      "The big show. 2–3 inch stoneflies. Follows the water temp upstream through the season. Explosive surface takes.",
  },
  {
    name: "Midges",
    scientificName: "Chironomidae",
    order: "Diptera",
    patterns: ["Zebra Midge", "Mercury Midge", "Top Secret Midge", "Griffith's Gnat"],
    sizes: "18-24",
    season: { start: 1, end: 12 },
    seasonLabel: "Year-round (critical in winter)",
    waterTypes: ["tailwater", "spring creek", "stillwater"],
    timeOfDay: "Warmest part of the day in winter; all day in warmer months",
    temperatureTriggerF: null,
    notes:
      "The bread and butter of Colorado tailwaters. Year-round availability makes this the most important fly family to master.",
  },
  {
    name: "Crane Fly",
    scientificName: "Tipulidae",
    order: "Diptera",
    patterns: ["Crane Fly Larva", "San Juan Worm (orange)", "Gummy Worm"],
    sizes: "8-12",
    season: { start: 3, end: 10 },
    seasonLabel: "March–October (larva year-round)",
    waterTypes: ["freestone", "tailwater"],
    timeOfDay: "Subsurface all day; adults late evening",
    temperatureTriggerF: null,
    notes:
      "Often overlooked. The large orange larva is a staple subsurface food source.",
  },
  {
    name: "Callibaetis",
    scientificName: "Callibaetis spp.",
    order: "Ephemeroptera",
    patterns: ["Callibaetis Dun", "Callibaetis Spinner", "Gulper Special"],
    sizes: "14-16",
    season: { start: 6, end: 9 },
    seasonLabel: "June–September",
    waterTypes: ["stillwater", "lake", "pond"],
    timeOfDay: "Mid-morning to early afternoon",
    temperatureTriggerF: { min: 55, max: 68 },
    notes:
      "The primary stillwater mayfly. Critical for lake fly fishing. Trout cruise and sip.",
  },
  {
    name: "Damselfly",
    scientificName: "Coenagrionidae",
    order: "Odonata",
    patterns: ["Damsel Nymph", "Woolly Bugger (olive)", "Marabou Damsel"],
    sizes: "8-12",
    season: { start: 6, end: 8 },
    seasonLabel: "June–August",
    waterTypes: ["stillwater", "lake", "pond"],
    timeOfDay: "Midday, when nymphs migrate to shore for emergence",
    temperatureTriggerF: { min: 60, max: 75 },
    notes:
      "Nymphs swimming to shore trigger aggressive takes. Strip slowly with pauses.",
  },
  {
    name: "Terrestrials (Hoppers/Ants/Beetles)",
    scientificName: "Various",
    order: "Various",
    patterns: ["Chernobyl Ant", "Charlie Boy Hopper", "Foam Beetle", "Hi-Vis Ant", "Amy's Ant"],
    sizes: "8-16",
    season: { start: 7, end: 10 },
    seasonLabel: "July–October (peak: August–September)",
    waterTypes: ["freestone", "meadow stream", "spring creek"],
    timeOfDay: "Afternoon, warm windy days",
    temperatureTriggerF: null,
    notes:
      "Wind is your friend. Hopper-dropper rigs cover water efficiently. Bank anglers do well here.",
  },
];

/**
 * Get hatches likely active for a given month and water temperature.
 */
export function getActiveHatches(
  month: number,
  waterTempF: number | null
): HatchInfo[] {
  return COLORADO_HATCHES.filter((h) => {
    // Check season
    const inSeason =
      h.season.start <= h.season.end
        ? month >= h.season.start && month <= h.season.end
        : month >= h.season.start || month <= h.season.end;

    if (!inSeason) return false;

    // Check water temp if available
    if (waterTempF !== null && h.temperatureTriggerF) {
      const margin = 8; // Allow some margin
      if (
        waterTempF < h.temperatureTriggerF.min - margin ||
        waterTempF > h.temperatureTriggerF.max + margin
      ) {
        return false;
      }
    }

    return true;
  });
}
