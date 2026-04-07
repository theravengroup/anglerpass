/**
 * Species temperature profiles for common Colorado game fish.
 * Optimal, stress, and lethal thresholds for fishing advisories.
 */

export interface SpeciesTempProfile {
  name: string;
  scientificName: string;
  optimalRange: { min: number; max: number }; // °F — ideal activity
  stressRange: { min: number; max: number }; // °F — reduced feeding, stress
  lethalThreshold: number; // °F — mortality risk above this
  feedingNotes: string;
  bestTechniques: string[];
  seasonalNotes: string;
}

export const SPECIES_PROFILES: SpeciesTempProfile[] = [
  {
    name: "Brown Trout",
    scientificName: "Salmo trutta",
    optimalRange: { min: 54, max: 65 },
    stressRange: { min: 40, max: 72 },
    lethalThreshold: 77,
    feedingNotes:
      "Most active in low-light conditions. Feed aggressively at dawn/dusk and on overcast days. Become nocturnal feeders in summer heat.",
    bestTechniques: ["Streamer", "Nymph", "Dry fly (evening)"],
    seasonalNotes:
      "Fall spawners (Oct–Nov). Pre-spawn aggression in September makes them vulnerable to streamers. Post-spawn recovery in winter — fish gently.",
  },
  {
    name: "Rainbow Trout",
    scientificName: "Oncorhynchus mykiss",
    optimalRange: { min: 55, max: 64 },
    stressRange: { min: 42, max: 70 },
    lethalThreshold: 75,
    feedingNotes:
      "Willing feeders throughout the day. Less wary than browns. Respond well to attractor patterns and nymphs.",
    bestTechniques: ["Nymph", "Dry fly", "Dry-dropper"],
    seasonalNotes:
      "Spring spawners (March–May). Aggressive pre-spawn feeding. Handle with care during spawn — avoid redds.",
  },
  {
    name: "Cutthroat Trout",
    scientificName: "Oncorhynchus clarkii",
    optimalRange: { min: 50, max: 60 },
    stressRange: { min: 38, max: 65 },
    lethalThreshold: 70,
    feedingNotes:
      "The least wary trout. Surface feeders — dry fly fishing at its best. Feed throughout the day at altitude.",
    bestTechniques: ["Dry fly", "Attractor patterns", "Terrestrials"],
    seasonalNotes:
      "Native to Colorado's high country. Short summer season at altitude (July–September). Conservation-minded approach essential — they're vulnerable.",
  },
  {
    name: "Brook Trout",
    scientificName: "Salvelinus fontinalis",
    optimalRange: { min: 50, max: 60 },
    stressRange: { min: 36, max: 65 },
    lethalThreshold: 72,
    feedingNotes:
      "Eager feeders, especially in high-altitude streams. Small water generalists. Will hit most well-presented flies.",
    bestTechniques: [
      "Small dry flies",
      "Attractor patterns",
      "Short-line nymphing",
    ],
    seasonalNotes:
      "Fall spawners. Found in coldest headwater streams and beaver ponds. Often small but brilliantly colored.",
  },
  {
    name: "Cutbow (Hybrid)",
    scientificName: "O. mykiss × O. clarkii",
    optimalRange: { min: 52, max: 62 },
    stressRange: { min: 40, max: 68 },
    lethalThreshold: 73,
    feedingNotes:
      "Combines cutthroat willingness with rainbow fight. Good dry fly targets.",
    bestTechniques: ["Dry fly", "Nymph", "Dry-dropper"],
    seasonalNotes:
      "Common in stocked waters and where rainbow/cutthroat ranges overlap. Hardy and fun to catch.",
  },
  {
    name: "Lake Trout",
    scientificName: "Salvelinus namaycush",
    optimalRange: { min: 46, max: 55 },
    stressRange: { min: 38, max: 60 },
    lethalThreshold: 65,
    feedingNotes:
      "Deep-water predators in summer, shallow in spring/fall. Primarily feed on baitfish.",
    bestTechniques: [
      "Deep streamer (sink-tip lines)",
      "Trolling with fly gear",
      "Jigging",
    ],
    seasonalNotes:
      "Surface accessible in spring ice-off and late fall. Summer requires deep presentations (30–100ft).",
  },
  {
    name: "Kokanee Salmon",
    scientificName: "Oncorhynchus nerka",
    optimalRange: { min: 50, max: 58 },
    stressRange: { min: 42, max: 62 },
    lethalThreshold: 67,
    feedingNotes:
      "Plankton feeders — tricky on fly. Small bright patterns stripped slowly work near schools.",
    bestTechniques: ["Small wet flies", "Chironomid patterns", "Trolling"],
    seasonalNotes:
      "Fall spawning runs in tributaries. Reservoir fish in summer. Colorado's premier kokanee fisheries include Blue Mesa and Dillon.",
  },
  {
    name: "Northern Pike",
    scientificName: "Esox lucius",
    optimalRange: { min: 60, max: 72 },
    stressRange: { min: 45, max: 78 },
    lethalThreshold: 82,
    feedingNotes:
      "Ambush predators. Large streamers, erratic strips. Weedy shallows in morning, deeper structure midday.",
    bestTechniques: ["Large streamers", "Bunny flies", "Topwater poppers"],
    seasonalNotes:
      "Most active spring through fall. Wire leaders required. Spring spawning in shallow bays. Growing warm-water fly fishing scene in Colorado.",
  },
];

/**
 * Get fishing advisory based on water temperature and target species.
 */
export function getSpeciesAdvisory(
  speciesName: string,
  waterTempF: number
): {
  species: SpeciesTempProfile;
  status: "optimal" | "marginal" | "stressed" | "dangerous";
  advisory: string;
} | null {
  const species = SPECIES_PROFILES.find(
    (s) => s.name.toLowerCase() === speciesName.toLowerCase()
  );

  if (!species) return null;

  let status: "optimal" | "marginal" | "stressed" | "dangerous";
  let advisory: string;

  if (
    waterTempF >= species.optimalRange.min &&
    waterTempF <= species.optimalRange.max
  ) {
    status = "optimal";
    advisory = `Water temperature (${waterTempF}°F) is in the optimal range for ${species.name}. Active feeding expected.`;
  } else if (
    waterTempF >= species.stressRange.min &&
    waterTempF <= species.stressRange.max
  ) {
    status = "marginal";
    advisory = `Water temperature (${waterTempF}°F) is outside the optimal range but fishable for ${species.name}. Feeding may be reduced.`;
  } else if (waterTempF > species.stressRange.max) {
    if (waterTempF >= species.lethalThreshold) {
      status = "dangerous";
      advisory = `⚠️ Water temperature (${waterTempF}°F) is at or above the lethal threshold for ${species.name}. Do NOT target this species — fish mortality is likely. Consider fishing higher-elevation water.`;
    } else {
      status = "stressed";
      advisory = `⚠️ Water temperature (${waterTempF}°F) puts ${species.name} under significant stress. Fish early morning when temps are lowest, keep fish in the water, and minimize fight time.`;
    }
  } else {
    status = "marginal";
    advisory = `Water temperature (${waterTempF}°F) is quite cold for ${species.name}. Activity will be sluggish — fish slow and deep.`;
  }

  return { species, status, advisory };
}

/**
 * Find all species that are fishable at a given water temperature.
 */
export function getFishableSpecies(
  waterTempF: number
): Array<{ species: SpeciesTempProfile; status: "optimal" | "marginal" }> {
  return SPECIES_PROFILES.filter((s) => {
    return (
      waterTempF >= s.stressRange.min && waterTempF <= s.stressRange.max
    );
  }).map((s) => ({
    species: s,
    status:
      waterTempF >= s.optimalRange.min && waterTempF <= s.optimalRange.max
        ? ("optimal" as const)
        : ("marginal" as const),
  }));
}
