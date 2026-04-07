/**
 * Gear recommendation decision trees for fly fishing trips.
 * Provides rod/reel, wading, layering, boot, and fly suggestions
 * based on conditions, species, water type, and time of year.
 */

export interface GearRecommendation {
  rod: {
    weight: string;
    length: string;
    notes: string;
  };
  leader: {
    length: string;
    tippet: string;
    notes: string;
  };
  wading: {
    type: "chest waders" | "hip waders" | "wet wade" | "optional";
    material: string;
    notes: string;
  };
  boots: {
    type: "felt sole" | "rubber sole" | "studded rubber" | "either";
    notes: string;
  };
  layers: string[];
  accessories: string[];
  flies: Array<{
    category: string;
    patterns: string[];
    sizes: string;
    notes: string;
  }>;
}

interface GearInput {
  waterTempF: number | null;
  airTempHighF: number;
  airTempLowF: number;
  waterType: string | null;
  species: string[] | null;
  month: number;
  precipChance: number;
  wind: string | null;
}

/**
 * Generate comprehensive gear recommendations based on conditions.
 */
export function getGearRecommendation(input: GearInput): GearRecommendation {
  const {
    waterTempF,
    airTempHighF,
    airTempLowF,
    waterType,
    species,
    month,
    precipChance,
    wind,
  } = input;

  const avgAirTemp = (airTempHighF + airTempLowF) / 2;
  const isWinter = month >= 11 || month <= 3;
  const isSummer = month >= 6 && month <= 8;
  const isSpring = month >= 4 && month <= 5;
  const isFall = month >= 9 && month <= 10;

  const wt = (waterType ?? "").toLowerCase();
  const isLargeWater =
    wt.includes("river") || wt.includes("tailwater") || wt.includes("canyon");
  const isSmallWater =
    wt.includes("stream") || wt.includes("creek") || wt.includes("spring");
  const isStillwater =
    wt.includes("lake") || wt.includes("pond") || wt.includes("stillwater");

  const hasLargeSpecies =
    species?.some(
      (s) =>
        s.toLowerCase().includes("pike") ||
        s.toLowerCase().includes("lake trout")
    ) ?? false;

  // ─── Rod recommendation ───
  let rodWeight: string;
  let rodLength: string;
  let rodNotes: string;

  if (hasLargeSpecies) {
    rodWeight = "7-8wt";
    rodLength = "9ft";
    rodNotes =
      "Heavy rod for large streamers and fighting power. Fast action preferred.";
  } else if (isStillwater) {
    rodWeight = "5-6wt";
    rodLength = "9-9.5ft";
    rodNotes =
      "Medium-fast action for distance casting. Consider sink-tip line for deeper presentations.";
  } else if (isSmallWater) {
    rodWeight = "3-4wt";
    rodLength = "7.5-8.5ft";
    rodNotes =
      "Short, light rod for tight quarters. Protects light tippets on spooky fish.";
  } else if (isLargeWater) {
    rodWeight = "5-6wt";
    rodLength = "9-10ft";
    rodNotes =
      "Versatile setup for nymphing and dry fly. 10ft ideal for euro-nymphing.";
  } else {
    rodWeight = "4-5wt";
    rodLength = "9ft";
    rodNotes = "All-around setup that handles most Colorado situations.";
  }

  // ─── Leader / tippet ───
  let leaderLength: string;
  let tippet: string;
  let leaderNotes: string;

  if (isSmallWater || wt.includes("spring")) {
    leaderLength = "10-12ft";
    tippet = "5x-6x";
    leaderNotes =
      "Long, fine leaders for clear water and educated fish. Fluorocarbon tippet recommended.";
  } else if (isStillwater) {
    leaderLength = "12-15ft";
    tippet = "4x-5x";
    leaderNotes =
      "Long leaders to separate fly from fly line shadow. Fluorocarbon for subsurface.";
  } else if (hasLargeSpecies) {
    leaderLength = "7-9ft";
    tippet = "0x-2x";
    leaderNotes =
      "Heavy tippet for toothy fish. Wire bite tippet for pike.";
  } else {
    leaderLength = "9-12ft";
    tippet = "4x-5x";
    leaderNotes =
      "Standard trout leader. Go finer (5x-6x) for picky fish, heavier (3x-4x) for streamers.";
  }

  // ─── Wading ───
  let wadingType: GearRecommendation["wading"]["type"];
  let wadingMaterial: string;
  let wadingNotes: string;

  if (isWinter || (waterTempF !== null && waterTempF < 50)) {
    wadingType = "chest waders";
    wadingMaterial = "Breathable (Gore-Tex or similar)";
    wadingNotes = "Insulated base layer underneath. Neoprene booties help in cold water.";
  } else if (isSummer && airTempHighF > 75 && (waterTempF === null || waterTempF > 58)) {
    wadingType = "wet wade";
    wadingMaterial = "Quick-dry pants or shorts with wading boots";
    wadingNotes =
      "Comfortable in warm conditions. Neoprene socks protect from rocks and cold spots.";
  } else if (isSpring || isFall) {
    wadingType = "chest waders";
    wadingMaterial = "Breathable";
    wadingNotes = "Spring runoff and fall temps make waders essential. Wading belt always.";
  } else {
    wadingType = "optional";
    wadingMaterial = "Breathable waders or wet wade";
    wadingNotes = "Conditions are moderate — personal preference. Bring waders to be safe.";
  }

  // ─── Boots ───
  let bootType: GearRecommendation["boots"]["type"];
  let bootNotes: string;

  if (wt.includes("tailwater") || wt.includes("canyon") || wt.includes("freestone")) {
    bootType = "felt sole";
    bootNotes =
      "Felt provides the best grip on slick river rocks. Add studs for extra traction in fast water.";
  } else if (isStillwater) {
    bootType = "rubber sole";
    bootNotes =
      "Rubber soles work well on soft lake bottoms and trails. Easier to clean.";
  } else {
    bootType = "either";
    bootNotes =
      "Both work. Felt is better on rocks, rubber is easier for trail access. Check property rules — some restrict felt.";
  }

  // ─── Layers ───
  const layers: string[] = [];

  if (airTempLowF < 35) {
    layers.push("Heavyweight merino base layer (top and bottom)");
    layers.push("Fleece mid-layer");
    layers.push("Insulated puffy jacket");
    layers.push("Warm beanie and fleece neck gaiter");
    layers.push("Insulated gloves (fingerless fishing gloves + warm backup pair)");
  } else if (airTempLowF < 50) {
    layers.push("Midweight merino base layer");
    layers.push("Fleece or softshell mid-layer");
    layers.push("Packable insulated jacket for morning");
    layers.push("Buff/neck gaiter");
  } else if (airTempHighF < 70) {
    layers.push("Lightweight merino or synthetic base");
    layers.push("Light fleece or vest");
    layers.push("Rain shell (packable)");
  } else {
    layers.push("Sun shirt (UPF 50+, long sleeve)");
    layers.push("Quick-dry pants or shorts");
    layers.push("Light rain shell (afternoon storms)");
  }

  if (precipChance > 30) {
    layers.push("Waterproof rain jacket — storms likely");
  }

  layers.push("Polarized sunglasses (amber/copper for overcast, gray for bright sun)");
  layers.push("Hat with brim for sun and glare protection");

  if (isSummer) {
    layers.push("Sunscreen SPF 50+ (apply to ears, neck, back of hands)");
    layers.push("Bug spray (mosquitoes near stillwater and meadows)");
  }

  // ─── Accessories ───
  const accessories: string[] = [
    "Nippers, forceps, and tippet",
    "Fly floatant (Gink or similar)",
    "Strike indicators (Thingamabobbers or yarn)",
    "Split shot assortment",
    "Net (rubber bag, catch-and-release friendly)",
  ];

  if (isSmallWater) {
    accessories.push("Small chest pack or sling — keep it light");
  }

  if (isStillwater) {
    accessories.push("Float tube or pontoon boat if allowed");
    accessories.push("Anchor system");
  }

  if (wind && (wind.includes("15") || wind.includes("20") || wind.includes("gust"))) {
    accessories.push("Wind-resistant lighter or waterproof matches for warmth breaks");
  }

  accessories.push("Water bottle and high-energy snacks");
  accessories.push("Headlamp (for early starts and late evening fishing)");

  // ─── Flies ───
  const flies: GearRecommendation["flies"] = [];

  if (isWinter) {
    flies.push({
      category: "Nymphs (primary)",
      patterns: ["Zebra Midge", "Mercury Midge", "RS2", "Top Secret Midge", "Pheasant Tail"],
      sizes: "18-24",
      notes: "Winter = midge season. Fish slow, deep, and small.",
    });
    flies.push({
      category: "Dry (when midges cluster)",
      patterns: ["Griffith's Gnat", "Midge Cluster"],
      sizes: "18-22",
      notes: "Watch for midge clusters in eddies and foam lines.",
    });
  } else if (isSpring) {
    flies.push({
      category: "Dries",
      patterns: ["Parachute BWO", "Sparkle Dun", "Blue Quill"],
      sizes: "18-22",
      notes: "BWO hatches are the main event. Fish overcast afternoons.",
    });
    flies.push({
      category: "Nymphs",
      patterns: ["Pheasant Tail", "RS2", "WD-40", "Pat's Rubber Legs"],
      sizes: "14-20",
      notes: "Pre-hatch nymphing is productive. Cover the water column.",
    });
    flies.push({
      category: "Streamers",
      patterns: ["Woolly Bugger (olive/black)", "Slumpbuster", "Sculpzilla"],
      sizes: "6-10",
      notes: "Spring runoff makes streamers effective in off-color water.",
    });
  } else if (isSummer) {
    flies.push({
      category: "Dries",
      patterns: ["PMD Parachute", "Elk Hair Caddis", "Chubby Chernobyl", "Stimulator"],
      sizes: "10-18",
      notes: "Summer hatches are diverse. Hopper-dropper rigs cover water efficiently.",
    });
    flies.push({
      category: "Terrestrials",
      patterns: ["Charlie Boy Hopper", "Chernobyl Ant", "Foam Beetle"],
      sizes: "8-14",
      notes: "Afternoon terrestrial fishing is peak summer fun. Target banks.",
    });
    flies.push({
      category: "Nymphs",
      patterns: ["Copper John", "Rainbow Warrior", "Flashback PT"],
      sizes: "14-18",
      notes: "Reliable subsurface producers when nothing's hatching.",
    });
  } else {
    // Fall
    flies.push({
      category: "Dries",
      patterns: ["Parachute BWO", "Trico Spinner", "October Caddis"],
      sizes: "16-22",
      notes: "Fall BWO hatches rival spring. Tricos in the morning, BWOs in the afternoon.",
    });
    flies.push({
      category: "Streamers",
      patterns: ["Autumn Splendor", "Woolly Bugger (brown/olive)", "Circus Peanut"],
      sizes: "4-8",
      notes: "Pre-spawn browns are aggressive. Swing big streamers at dusk.",
    });
    flies.push({
      category: "Nymphs",
      patterns: ["Pheasant Tail", "Mercury Midge", "Barr's Emerger"],
      sizes: "16-22",
      notes: "Transition season — midges and BWO nymphs are reliable.",
    });
  }

  return {
    rod: { weight: rodWeight, length: rodLength, notes: rodNotes },
    leader: { length: leaderLength, tippet, notes: leaderNotes },
    wading: { type: wadingType, material: wadingMaterial, notes: wadingNotes },
    boots: { type: bootType, notes: bootNotes },
    layers,
    accessories,
    flies,
  };
}
