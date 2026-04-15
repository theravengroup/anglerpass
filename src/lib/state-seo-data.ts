export interface StateSeoData {
  name: string;
  slug: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  notableWaters: string[];
  targetSpecies: string[];
  keywords: string[];
  faqs: { question: string; answer: string }[];
}

export const STATE_SEO_DATA: StateSeoData[] = [
  {
    name: "Montana",
    slug: "montana",
    title: "Private Water Fly Fishing in Montana | AnglerPass",
    description:
      "Access private spring creeks and blue-ribbon trout streams across Montana. Book exclusive fly fishing on legendary waters through AnglerPass.",
    h1: "Book Private Fly Fishing Water in Montana",
    intro:
      "Montana is the spiritual home of American fly fishing, from the sweeping runs of the Madison River to the technical spring creeks of Paradise Valley. The state boasts thousands of miles of blue-ribbon trout water flowing through vast ranch land, much of it inaccessible without private permission. AnglerPass connects you with landowners who open their gates to visiting anglers seeking uncrowded, world-class fishing.",
    notableWaters: [
      "Madison River",
      "Yellowstone River",
      "Missouri River",
      "DePuy Spring Creek",
    ],
    targetSpecies: [
      "Rainbow Trout",
      "Brown Trout",
      "Cutthroat Trout",
      "Brook Trout",
      "Mountain Whitefish",
    ],
    keywords: [
      "private fly fishing montana",
      "montana trout streams",
      "montana spring creek access",
      "fly fishing ranch montana",
      "madison river private water",
      "montana blue ribbon streams",
    ],
    faqs: [
      {
        question: "What is the best time to fly fish in Montana?",
        answer:
          "Montana's prime fly fishing season runs from late June through September, with excellent dry fly hatches including salmonflies in June, PMDs through summer, and hoppers in August. Spring creeks fish well year-round, and fall offers outstanding brown trout fishing with fewer crowds.",
      },
      {
        question: "Do I need an independent guide to fish private water in Montana?",
        answer:
          "Not necessarily. Many AnglerPass properties offer walk-and-wade access with detailed maps and hatch charts. Some landowners do require guided trips, which can be arranged through the platform. Private spring creeks often fish best with local knowledge of the specific water.",
      },
      {
        question:
          "What makes Montana private water different from public access?",
        answer:
          "Montana's public rivers can see heavy pressure, especially in July and August near popular towns like Bozeman and Missoula. Private water offers solitude, healthier fish populations, and often access to spring creeks and side channels that never see public fishing pressure.",
      },
    ],
  },
  {
    name: "Colorado",
    slug: "colorado",
    title: "Private Water Fly Fishing in Colorado | AnglerPass",
    description:
      "Fish Colorado's gold medal waters and private ranch streams. Book exclusive fly fishing access on premium trout water through AnglerPass.",
    h1: "Book Private Fly Fishing Water in Colorado",
    intro:
      "Colorado is home to over 9,000 miles of trout streams and some of the most coveted gold medal waters in the West. From the fabled South Platte tailwaters to remote freestone streams in the San Juans, private ranch access unlocks stretches where wild trout grow large and see few flies. AnglerPass brings together Colorado landowners and traveling anglers seeking trophy-caliber fishing without the crowds.",
    notableWaters: [
      "South Platte River",
      "Frying Pan River",
      "Roaring Fork River",
      "Rio Grande",
    ],
    targetSpecies: [
      "Rainbow Trout",
      "Brown Trout",
      "Cutthroat Trout",
      "Brook Trout",
      "Kokanee Salmon",
    ],
    keywords: [
      "private fly fishing colorado",
      "colorado gold medal waters",
      "south platte private access",
      "colorado trout fishing ranches",
      "fly fishing colorado private water",
      "frying pan river access",
    ],
    faqs: [
      {
        question: "What are Colorado gold medal waters?",
        answer:
          "Gold medal designation is awarded by Colorado Parks and Wildlife to streams that produce trout of exceptional size and quantity. These waters must sustain at least 60 pounds of trout per acre with a significant number of fish over 14 inches. Private access to gold medal stretches is among the most sought-after fishing in the state.",
      },
      {
        question: "When is the best time to fly fish in Colorado?",
        answer:
          "Colorado fishing peaks from May through October. Runoff typically clears by late June on freestone rivers, while tailwaters like the Frying Pan and South Platte fish well year-round. Late summer brings excellent hopper fishing on private ranch water, and fall offers world-class sight-fishing to spawning brown trout.",
      },
      {
        question: "Can I access private water near Denver?",
        answer:
          "Yes. Several AnglerPass properties lie within a 90-minute drive of Denver along the South Platte corridor and in the foothills. Private stretches of Cheesman Canyon and Deckers-area ranches offer exceptional fishing close to the Front Range.",
      },
    ],
  },
  {
    name: "Wyoming",
    slug: "wyoming",
    title: "Private Water Fly Fishing in Wyoming | AnglerPass",
    description:
      "Access Wyoming's legendary trout rivers and remote ranch water. Book private fly fishing on the Snake, Green, and North Platte through AnglerPass.",
    h1: "Book Private Fly Fishing Water in Wyoming",
    intro:
      "Wyoming offers a fly fishing experience defined by wide-open landscapes and uncrowded rivers. The Snake River near Jackson Hole, the Green River below Fontenelle Dam, and the North Platte's Miracle Mile all hold trophy trout in dramatic Western settings. With much of the state's best water flowing through private ranch land, AnglerPass provides the key to fishing stretches most anglers only read about.",
    notableWaters: [
      "Snake River",
      "North Platte River",
      "Green River",
      "Bighorn River",
    ],
    targetSpecies: [
      "Snake River Cutthroat",
      "Rainbow Trout",
      "Brown Trout",
      "Brook Trout",
      "Mountain Whitefish",
    ],
    keywords: [
      "private fly fishing wyoming",
      "wyoming ranch fishing",
      "snake river private access",
      "north platte miracle mile",
      "wyoming cutthroat trout",
      "green river fly fishing",
    ],
    faqs: [
      {
        question: "What species of cutthroat trout are found in Wyoming?",
        answer:
          "Wyoming is home to the native Snake River fine-spotted cutthroat and Yellowstone cutthroat trout. These fish are found throughout the Snake River drainage and Yellowstone region. Private water access often provides the best opportunity to target native cutthroat in undisturbed habitat.",
      },
      {
        question:
          "Is Wyoming fly fishing only a summer activity?",
        answer:
          "While summer is peak season, Wyoming offers excellent fishing from April through November. Tailwaters like the Bighorn and North Platte's Grey Reef section fish well into late fall, and mild winter days can produce outstanding nymphing. Private spring-fed creeks often stay fishable when freestone rivers are frozen.",
      },
      {
        question: "How remote are Wyoming private fishing properties?",
        answer:
          "Properties range from easily accessible ranch water near Casper and Jackson Hole to remote backcountry streams in the Wind River and Absaroka ranges. Many ranches offer lodging on-site, and AnglerPass property listings include detailed access instructions and nearby amenities.",
      },
    ],
  },
  {
    name: "Idaho",
    slug: "idaho",
    title: "Private Water Fly Fishing in Idaho | AnglerPass",
    description:
      "Fish Idaho's legendary Silver Creek, Henry's Fork, and remote backcountry streams. Book private fly fishing access through AnglerPass.",
    h1: "Book Private Fly Fishing Water in Idaho",
    intro:
      "Idaho is a fly fishing paradise that ranges from the technical spring creek challenges of Silver Creek to the broad riffles of the South Fork of the Boise. The Henry's Fork of the Snake River draws anglers from around the world for its prolific hatches and educated rainbows. With vast tracts of private ranch and timber land lining Idaho's best rivers, AnglerPass unlocks fishing opportunities that rival anything in the Rocky Mountain West.",
    notableWaters: [
      "Henry's Fork",
      "Silver Creek",
      "South Fork of the Snake",
      "Big Wood River",
    ],
    targetSpecies: [
      "Rainbow Trout",
      "Brown Trout",
      "Cutthroat Trout",
      "Bull Trout",
      "Steelhead",
    ],
    keywords: [
      "private fly fishing idaho",
      "silver creek fly fishing",
      "henry's fork private access",
      "idaho trout streams",
      "idaho steelhead fishing",
      "sun valley fly fishing",
    ],
    faqs: [
      {
        question: "What makes Silver Creek special for fly fishing?",
        answer:
          "Silver Creek is one of the finest spring creeks in the world, producing large, selective trout in gin-clear water. The creek's prolific insect hatches — including Tricos, PMDs, and green drakes — demand precise presentations. Much of Silver Creek flows through private land, making AnglerPass access particularly valuable.",
      },
      {
        question: "Can I fish for steelhead on private water in Idaho?",
        answer:
          "Idaho's Clearwater and Salmon River drainages host returning steelhead runs. While steelhead fishing is largely on public water, some private properties along tributaries provide uncrowded bank access and staging areas. Check AnglerPass listings for seasonal steelhead access.",
      },
      {
        question: "When do the best hatches occur on the Henry's Fork?",
        answer:
          "The Henry's Fork is famous for its green drake hatch in late June, followed by PMDs and flavs through July. The fall brings blue-winged olive hatches from September into November. Private bank access on the Railroad Ranch section is among the most coveted fly fishing in the country.",
      },
    ],
  },
  {
    name: "Oregon",
    slug: "oregon",
    title: "Private Water Fly Fishing in Oregon | AnglerPass",
    description:
      "Access Oregon's Deschutes, Metolius, and private coastal streams. Book exclusive fly fishing on premium Pacific Northwest water with AnglerPass.",
    h1: "Book Private Fly Fishing Water in Oregon",
    intro:
      "Oregon offers extraordinary diversity for fly anglers — from the desert canyon waters of the Deschutes to the spring-fed clarity of the Metolius and the wild steelhead rivers of the coast. The state's mix of volcanic geology and Pacific moisture creates a remarkable range of fisheries within a few hours' drive. AnglerPass connects anglers with private ranch owners in central and eastern Oregon, where some of the best trout water flows far from public roads.",
    notableWaters: [
      "Deschutes River",
      "Metolius River",
      "Crooked River",
      "McKenzie River",
    ],
    targetSpecies: [
      "Redband Trout",
      "Rainbow Trout",
      "Brown Trout",
      "Steelhead",
      "Bull Trout",
    ],
    keywords: [
      "private fly fishing oregon",
      "deschutes river private access",
      "oregon trout streams",
      "metolius river fly fishing",
      "oregon steelhead fishing",
      "central oregon fly fishing",
    ],
    faqs: [
      {
        question: "What is a redband trout?",
        answer:
          "Redband trout are a subspecies of rainbow trout native to Oregon's high desert rivers and streams. They are adapted to warmer, drier conditions than their coastal relatives and are prized for their vivid coloring and aggressive strikes. The Deschutes and Crooked River systems are strongholds for wild redbands.",
      },
      {
        question: "When is the Deschutes salmonfly hatch?",
        answer:
          "The Deschutes salmonfly hatch typically begins in late May at lower elevations and moves upstream through mid-June. This is arguably the most exciting dry fly fishing in Oregon, with large stoneflies bringing even big trout to the surface. Private access avoids the intense pressure that popular public reaches experience during the hatch.",
      },
      {
        question: "Are there private fly fishing opportunities near Bend?",
        answer:
          "Yes. Central Oregon around Bend has excellent private water on the Deschutes, Crooked River, and smaller spring creeks within an hour's drive. Several ranches in the area offer AnglerPass bookings with walk-and-wade access to productive trout water.",
      },
    ],
  },
  {
    name: "Washington",
    slug: "washington",
    title: "Private Water Fly Fishing in Washington | AnglerPass",
    description:
      "Fish Washington's Yakima, Olympic Peninsula rivers, and private stillwaters. Book exclusive Pacific Northwest fly fishing through AnglerPass.",
    h1: "Book Private Fly Fishing Water in Washington",
    intro:
      "Washington State offers fly fishing that spans from the dry-side trout rivers of the Yakima Valley to the wild steelhead rivers of the Olympic Peninsula. The state's diverse geography creates opportunities for everything from sight-fishing to sipping trout on spring creeks to swinging flies for sea-run fish in mossy rainforest canyons. Private lakes and spring-fed ponds in eastern Washington provide exceptional stillwater fishing that rarely appears on public maps.",
    notableWaters: [
      "Yakima River",
      "Rocky Ford Creek",
      "Klickitat River",
      "Skagit River",
    ],
    targetSpecies: [
      "Rainbow Trout",
      "Cutthroat Trout",
      "Steelhead",
      "Bull Trout",
      "Largemouth Bass",
    ],
    keywords: [
      "private fly fishing washington",
      "yakima river fly fishing",
      "washington steelhead rivers",
      "rocky ford creek access",
      "washington trout lakes",
      "olympic peninsula fly fishing",
    ],
    faqs: [
      {
        question: "What is Rocky Ford Creek like for fly fishing?",
        answer:
          "Rocky Ford Creek is a legendary spring creek in eastern Washington's desert, producing rainbow trout well over 20 inches in crystal-clear, weed-rich water. The creek demands technical skill with small nymphs and precise presentations. Surrounding private land limits access, making AnglerPass bookings an excellent way to fish less-pressured stretches.",
      },
      {
        question:
          "Can I fly fish for steelhead on private water in Washington?",
        answer:
          "Several AnglerPass properties along Washington's coastal and Puget Sound tributaries offer private bank access for steelhead. While the rivers themselves are public, private land access provides uncrowded runs and convenient entry points that avoid the competition common at public launches.",
      },
      {
        question:
          "Are there good private stillwater options in Washington?",
        answer:
          "Eastern Washington has numerous private lakes and ponds stocked with trophy-class trout, including some managed specifically for catch-and-release fly fishing. These stillwaters fish best in spring and fall when Chironomid and Callibaetis hatches bring big fish to the surface.",
      },
    ],
  },
  {
    name: "Virginia",
    slug: "virginia",
    title: "Private Water Fly Fishing in Virginia | AnglerPass",
    description:
      "Access Virginia's mountain trout streams and private spring creeks in the Blue Ridge and Shenandoah Valley. Book through AnglerPass.",
    h1: "Book Private Fly Fishing Water in Virginia",
    intro:
      "Virginia's Blue Ridge and Allegheny mountains harbor an underrated network of cold-water trout streams that reward anglers willing to explore beyond the Appalachian Trail crossings. Shenandoah National Park's native brook trout streams are well known, but the private spring creeks and limestone-influenced streams of the Valley produce larger fish in less-pressured settings. AnglerPass opens access to ranch and farm water where Virginia's fly fishing tradition stretches back generations.",
    notableWaters: [
      "Mossy Creek",
      "Jackson River",
      "Smith River",
      "Rapidan River",
    ],
    targetSpecies: [
      "Brook Trout",
      "Rainbow Trout",
      "Brown Trout",
      "Smallmouth Bass",
    ],
    keywords: [
      "private fly fishing virginia",
      "virginia trout streams",
      "mossy creek fly fishing",
      "shenandoah valley fishing",
      "virginia spring creeks",
      "blue ridge fly fishing",
    ],
    faqs: [
      {
        question: "What is Mossy Creek and why is it famous?",
        answer:
          "Mossy Creek is a spring-fed limestone stream in the Shenandoah Valley that produces surprisingly large brown and rainbow trout for its size. The creek flows almost entirely through private agricultural land, and access is managed through landowner agreements. Its fertile waters produce dense insect hatches and trout that challenge even experienced anglers.",
      },
      {
        question:
          "When is the best season for fly fishing in Virginia?",
        answer:
          "Virginia offers year-round trout fishing, with spring creeks like Mossy Creek productive in every month. Freestone streams peak from March through June during sulphur, march brown, and green drake hatches. Fall fishing for brook trout in the mountains is exceptional, and the tailwater Smith River fishes well through winter.",
      },
      {
        question: "Does Virginia have native trout?",
        answer:
          "Yes. Virginia has native southern Appalachian brook trout in hundreds of small mountain streams, particularly in Shenandoah National Park and the George Washington National Forest. Many private properties in the foothills also hold native brookies in headwater streams that feed larger rivers.",
      },
    ],
  },
  {
    name: "Pennsylvania",
    slug: "pennsylvania",
    title: "Private Water Fly Fishing in Pennsylvania | AnglerPass",
    description:
      "Fish Pennsylvania's famous limestone creeks and wild trout streams. Book private fly fishing on premier spring creeks through AnglerPass.",
    h1: "Book Private Fly Fishing Water in Pennsylvania",
    intro:
      "Pennsylvania is the birthplace of American fly fishing, and the state's limestone spring creeks remain some of the most technically demanding trout water in the country. Streams like Penns Creek, Spruce Creek, and the Letort Spring Run have shaped fly fishing tactics for over a century. Much of Pennsylvania's finest water winds through private farmland and estates, and AnglerPass provides legitimate access to stretches that have produced exceptional trout for generations.",
    notableWaters: [
      "Penns Creek",
      "Spruce Creek",
      "Letort Spring Run",
      "Big Spring Creek",
    ],
    targetSpecies: [
      "Brown Trout",
      "Rainbow Trout",
      "Brook Trout",
      "Wild Trout",
    ],
    keywords: [
      "private fly fishing pennsylvania",
      "pennsylvania limestone creeks",
      "spruce creek private access",
      "penns creek fly fishing",
      "letort spring run",
      "pa wild trout streams",
    ],
    faqs: [
      {
        question:
          "What makes Pennsylvania limestone creeks special?",
        answer:
          "Pennsylvania's limestone spring creeks are fed by underground aquifers that maintain consistent water temperatures and produce extraordinary insect life. This creates dense populations of large, selective trout in relatively small streams. The alkaline water chemistry supports heavy weed growth and prolific hatches of sulphurs, Tricos, and terrestrials that define the technical fishing Pennsylvania is known for.",
      },
      {
        question: "Is Spruce Creek really that good?",
        answer:
          "Spruce Creek is considered one of the finest trout streams in the eastern United States. Flowing through private land in Huntingdon County, it produces wild brown trout over 20 inches in a picturesque limestone valley. Access has historically been restricted, making AnglerPass bookings a rare opportunity to fish this legendary water.",
      },
      {
        question:
          "What is the green drake hatch on Penns Creek?",
        answer:
          "The Penns Creek green drake hatch in late May and early June is one of the most anticipated events in eastern fly fishing. Ephemera guttulata emerges in huge numbers at dusk, bringing the creek's largest brown trout to the surface. Private access during the hatch avoids the significant angling pressure that public stretches receive.",
      },
    ],
  },
  {
    name: "North Carolina",
    slug: "north-carolina",
    title: "Private Water Fly Fishing in North Carolina | AnglerPass",
    description:
      "Access North Carolina's mountain trout streams and private water in the Blue Ridge and Great Smokies. Book fly fishing through AnglerPass.",
    h1: "Book Private Fly Fishing Water in North Carolina",
    intro:
      "North Carolina's western mountains offer some of the finest trout fishing in the Southeast, with over 4,000 miles of designated trout water in the Blue Ridge and Great Smoky Mountains. The state holds populations of native southern Appalachian brook trout alongside wild brown and rainbow trout in cold mountain streams. Private water in the highlands around Brevard, Boone, and Cashiers provides access to pristine streams that flow through dense rhododendron tunnels and old-growth forest.",
    notableWaters: [
      "Davidson River",
      "Nantahala River",
      "Watauga River",
      "South Holston River",
    ],
    targetSpecies: [
      "Brook Trout",
      "Rainbow Trout",
      "Brown Trout",
      "Smallmouth Bass",
    ],
    keywords: [
      "private fly fishing north carolina",
      "nc mountain trout streams",
      "blue ridge fly fishing",
      "great smoky mountains fishing",
      "north carolina trout fishing",
      "davidson river fly fishing",
    ],
    faqs: [
      {
        question:
          "Does North Carolina have wild trout?",
        answer:
          "Yes. North Carolina has approximately 3,800 miles of water classified as wild trout habitat, including native southern Appalachian brook trout in high-elevation streams. The state's Delayed Harvest program also creates excellent fishing on select streams. Private water often holds the healthiest wild trout populations due to reduced angling pressure.",
      },
      {
        question:
          "What is the best time to fly fish in the NC mountains?",
        answer:
          "North Carolina mountain streams fish well from March through November. Spring brings excellent hatches of quill gordons, hendricksons, and March browns. Summer fishing focuses on terrestrials and small attractor dries in rhododendron-shaded streams. Fall offers outstanding dry fly fishing with blue-winged olives and fewer anglers.",
      },
      {
        question:
          "Are there private fly fishing lodges in North Carolina?",
        answer:
          "Several AnglerPass properties in western North Carolina combine private stream access with lodge accommodations. These range from rustic streamside cabins to full-service lodges in the Highlands-Cashiers area, offering guided and unguided options on private mountain trout water.",
      },
    ],
  },
  {
    name: "Tennessee",
    slug: "tennessee",
    title: "Private Water Fly Fishing in Tennessee | AnglerPass",
    description:
      "Fish Tennessee's tailwaters and mountain streams. Book private fly fishing on the Clinch, Caney Fork, and Smoky Mountain water with AnglerPass.",
    h1: "Book Private Fly Fishing Water in Tennessee",
    intro:
      "Tennessee's tailwater rivers produce some of the largest trout in the eastern United States, with the Clinch River and South Holston regularly yielding brown trout over five pounds. The cold water released from deep reservoirs creates year-round trout fisheries in a state better known for its warmwater bass fishing. In the east, Great Smoky Mountains streams hold native brook trout in one of the most biodiverse aquatic ecosystems in North America. Private water access through AnglerPass opens tailwater stretches and mountain streams away from the crowds.",
    notableWaters: [
      "Clinch River",
      "South Holston River",
      "Caney Fork River",
      "Hiwassee River",
    ],
    targetSpecies: [
      "Brown Trout",
      "Rainbow Trout",
      "Brook Trout",
      "Smallmouth Bass",
      "Striped Bass",
    ],
    keywords: [
      "private fly fishing tennessee",
      "clinch river fly fishing",
      "tennessee tailwater fishing",
      "south holston river access",
      "great smoky mountains trout",
      "caney fork private water",
    ],
    faqs: [
      {
        question: "What are tailwater fisheries and why are they productive?",
        answer:
          "Tailwater fisheries are river sections below dams that release cold water from deep in the reservoir. In Tennessee, this cold water creates trout habitat in a region that would otherwise be too warm. The consistent temperatures and rich nutrient flow support dense aquatic insect populations, producing fast-growing trout. The Clinch and South Holston are among the most productive tailwaters in the country.",
      },
      {
        question:
          "Do I need to worry about water generation schedules?",
        answer:
          "Yes. Tennessee tailwaters are affected by TVA dam generation schedules, which can change water levels dramatically within hours. Wading can become dangerous during generation. AnglerPass properties often include real-time generation schedule information and access to stretches that fish well at multiple water levels.",
      },
      {
        question:
          "Can I fly fish year-round in Tennessee?",
        answer:
          "Absolutely. Tennessee tailwaters fish well in every month thanks to consistent cold-water releases. Winter midge fishing on the Clinch and South Holston is outstanding, and summer provides relief from the heat with sulphur and caddis hatches. The variety of tailwater and mountain stream options means there is always productive water available.",
      },
    ],
  },
  {
    name: "Utah",
    slug: "utah",
    title: "Private Water Fly Fishing in Utah | AnglerPass",
    description:
      "Access Utah's Blue Ribbon trout rivers and private ranch streams. Book exclusive fly fishing on the Provo, Green, and Weber through AnglerPass.",
    h1: "Book Private Fly Fishing Water in Utah",
    intro:
      "Utah's fly fishing is anchored by a handful of outstanding rivers that rival anything in the Rocky Mountain West. The Green River below Flaming Gorge Dam is one of the most productive tailwaters in the country, while the middle Provo River offers technical dry fly fishing within an hour of Salt Lake City. Private ranch water along the Weber, Provo, and Logan rivers provides access to stretches where large wild trout thrive in Utah's dramatically varied landscape.",
    notableWaters: [
      "Green River",
      "Provo River",
      "Weber River",
      "Logan River",
    ],
    targetSpecies: [
      "Brown Trout",
      "Rainbow Trout",
      "Cutthroat Trout",
      "Bonneville Cutthroat",
      "Mountain Whitefish",
    ],
    keywords: [
      "private fly fishing utah",
      "green river fly fishing",
      "provo river private access",
      "utah blue ribbon fisheries",
      "weber river fly fishing",
      "utah trout streams",
    ],
    faqs: [
      {
        question: "How productive is the Green River in Utah?",
        answer:
          "The Green River below Flaming Gorge Dam supports an estimated 8,000 to 14,000 trout per mile in its upper sections, making it one of the most fish-dense rivers in the world. The cold, clear tailwater produces rainbow and brown trout that feed aggressively on prolific Cicada, caddis, and midge hatches. Private access to bank sections avoids the drift boat congestion common on public stretches.",
      },
      {
        question: "What is a Bonneville cutthroat trout?",
        answer:
          "The Bonneville cutthroat is Utah's state fish and a native subspecies once found throughout the ancient Lake Bonneville drainage. Conservation efforts have restored populations in many mountain streams along the Wasatch Range. Private headwater properties often hold the best remaining Bonneville cutthroat habitat.",
      },
      {
        question: "Is there good fly fishing near Salt Lake City?",
        answer:
          "Yes. The middle Provo River, lower Provo River, and Weber River are all within 45 minutes to an hour of Salt Lake City. These Blue Ribbon fisheries offer excellent trout fishing in mountain settings, and private sections along these rivers are available through AnglerPass for day access.",
      },
    ],
  },
  {
    name: "New York",
    slug: "new-york",
    title: "Private Water Fly Fishing in New York | AnglerPass",
    description:
      "Fish New York's legendary Catskill rivers and Adirondack streams. Book private fly fishing on the Delaware, Beaverkill, and more with AnglerPass.",
    h1: "Book Private Fly Fishing Water in New York",
    intro:
      "New York's Catskill Mountains are where American dry fly fishing was born, and rivers like the Beaverkill, Willowemoc, and Delaware system continue to define eastern trout fishing. The upper Delaware's wild rainbow and brown trout fishery is one of the best in the Northeast, while the Adirondacks hold brook trout in pristine mountain ponds and streams. Private water access in the Catskills and Hudson Valley opens stretches of these storied rivers that have been in the hands of fishing clubs and estates for over a century.",
    notableWaters: [
      "Delaware River (West Branch)",
      "Beaverkill River",
      "Willowemoc Creek",
      "Ausable River",
    ],
    targetSpecies: [
      "Brown Trout",
      "Rainbow Trout",
      "Brook Trout",
      "Wild Trout",
    ],
    keywords: [
      "private fly fishing new york",
      "catskill fly fishing",
      "delaware river private access",
      "beaverkill river fishing",
      "adirondack trout streams",
      "new york trout fishing",
    ],
    faqs: [
      {
        question:
          "Why are the Catskills important to fly fishing history?",
        answer:
          "The Catskill Mountains are considered the birthplace of American dry fly fishing. Pioneers like Theodore Gordon adapted British chalk stream techniques to Catskill rivers in the late 1800s. The Catskill style of fly tying and the region's rivers — especially the Beaverkill and Willowemoc — have influenced fly fishing culture for over a century. Many private stretches remain managed in the tradition of the original fishing clubs.",
      },
      {
        question:
          "What makes the Delaware River system special?",
        answer:
          "The West Branch of the Delaware below Cannonsville Reservoir is a cold tailwater that supports wild rainbow and brown trout in sizes unusual for the Northeast. Fish over 20 inches are common, and the river's prolific hatches of sulphurs, March browns, and green drakes rival any eastern fishery. Private bank access avoids the heavy pressure on popular public pools.",
      },
      {
        question:
          "Are there private brook trout fishing opportunities in New York?",
        answer:
          "The Adirondack region and upper Catskills hold excellent brook trout fishing on private land. Many Adirondack ponds and small streams on private preserves have been managed for native brook trout for generations. AnglerPass listings include backcountry pond access and stream fishing that reaches fish rarely seen by the public.",
      },
    ],
  },
];
