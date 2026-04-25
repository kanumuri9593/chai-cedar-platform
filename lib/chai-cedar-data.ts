export type SeasonMode = "spring" | "summer" | "fall" | "winter";
export type LightMode = "day" | "night";
export type VisionMode = "current" | "future";

export type SceneMode = {
  light: LightMode;
  season: SeasonMode;
  vision: VisionMode;
};

export type CameraView =
  | "aerial"
  | "cabin"
  | "pond"
  | "orchard"
  | "tent"
  | "play";

export type LandZoneId =
  | "barn"
  | "cabin"
  | "tent"
  | "play"
  | "pond"
  | "orchard"
  | "forest"
  | "road";

export type LandObjectType =
  | "barn"
  | "cabin"
  | "tent"
  | "play"
  | "pond"
  | "orchard"
  | "forest"
  | "road"
  | "path"
  | "lighting";

export type Vector3Tuple = [number, number, number];

export type LandSceneObject = {
  id: LandZoneId;
  title: string;
  type: LandObjectType;
  phase: "existing" | "planned" | "future";
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  scale: Vector3Tuple;
  material: string;
  status: string;
  costRange: string;
  revenueRole: string;
  summary: string;
  steps: string[];
  aiPrompts: string[];
};

export type ProjectRecord = {
  id: LandZoneId;
  title: string;
  phase: string;
  priority: string;
  nextStep: string;
  estimatedCost: number;
  actualCost: number;
  projectedAnnualRevenue: number;
  status: string;
};

export type ScenarioRecord = {
  id: string;
  title: string;
  state: "draft" | "active" | "archived";
  prompt: string;
  changeSummary: string;
  estimatedImpact: string;
};

export const defaultSceneMode: SceneMode = {
  light: "day",
  season: "summer",
  vision: "future"
};

export const cameraViews: Record<CameraView, { label: string; position: Vector3Tuple; target: Vector3Tuple }> = {
  aerial: { label: "Aerial", position: [0, 14, 15], target: [0, 0, 0] },
  cabin: { label: "Cabin deck", position: [6.4, 4.3, -4.8], target: [1.1, 0, 3.4] },
  pond: { label: "Pond edge", position: [2.2, 2.7, 8.4], target: [1.3, 0, 4.2] },
  orchard: { label: "Orchard sitout", position: [0.4, 5, 6.1], target: [0.2, 0, 0.2] },
  tent: { label: "CanvasCamp", position: [-7.8, 4.2, 7.2], target: [-5.8, 0, 4.2] },
  play: { label: "Viaan play", position: [8.4, 4.4, 6.6], target: [6.2, 0, 4.2] }
};

export const landSceneObjects: LandSceneObject[] = [
  {
    id: "barn",
    title: "Existing Barn + Road Entry",
    type: "barn",
    phase: "existing",
    position: [-6.4, 0, -4.6],
    rotation: [0, -0.08, 0],
    scale: [1.45, 0.88, 1],
    material: "weathered-stone",
    status: "Existing operational asset",
    costRange: "$2k-$8k cleanup and lighting",
    revenueRole: "Operations base that protects guest-facing value",
    summary:
      "Road-side control center for tools, canoe gear, guest supplies, future maintenance, and arrival identity.",
    steps: [
      "Zone the barn into tools, outdoor gear, hospitality supplies, and maintenance materials.",
      "Add solar/security light and a simple camera facing the entry and driveway.",
      "Create a guest-safe boundary so the barn stays operational, not guest-facing clutter.",
      "Use the barn wall or a signpost as the first Chai & Cedar arrival marker."
    ],
    aiPrompts: [
      "Create a cleaner arrival sign and lighting concept for the barn side.",
      "Show a version where tool storage is hidden behind cedar screens."
    ]
  },
  {
    id: "cabin",
    title: "16x40 Cabin - Main STR Anchor",
    type: "cabin",
    phase: "planned",
    position: [5.9, 0, -4.55],
    rotation: [0, 0.08, 0],
    scale: [2.15, 1.04, 1.06],
    material: "black-metal-cedar",
    status: "Planned contractor build",
    costRange: "$85k-$155k target envelope",
    revenueRole: "Primary booking engine and brand hero",
    summary:
      "Main revenue-producing stay facing pond and forest, with warm deck light, large glass, and family-friendly layout.",
    steps: [
      "Lock final orientation so the deck and living room face the pond and forest view.",
      "Use black/cedar exterior, large windows, warm deck lighting, and a restrained roofline.",
      "Plan electric, water, septic, and low-voltage conduit in one trenching phase.",
      "Landscape the path from cabin to orchard and pond so it feels intentional from day one."
    ],
    aiPrompts: [
      "Show cabin material options: black metal roof, cedar siding, and warm deck lighting.",
      "Estimate the guest revenue difference between simple deck and premium covered deck."
    ]
  },
  {
    id: "tent",
    title: "CanvasCamp 20x20 Platform",
    type: "tent",
    phase: "existing",
    position: [-6.25, 0, 4.9],
    rotation: [0, -0.35, 0],
    scale: [1.35, 0.85, 1.25],
    material: "canvas-cedar-platform",
    status: "Existing DIY asset",
    costRange: "$3k-$12k upgrades",
    revenueRole: "Lower-cost glamping stay and proof of demand",
    summary:
      "A separate rustic stay near the road side, emotionally connected to pond, orchard, and forest without crossing private work zones.",
    steps: [
      "Keep the tent as a separate rustic tier from the cabin.",
      "Add a defined guest path from road/barn side.",
      "Create a private firepit and picnic pad.",
      "Use plantings and split-rail fencing to separate tent and cabin guest flow."
    ],
    aiPrompts: [
      "Create three privacy planting layouts around the CanvasCamp platform.",
      "Show a lower-cost firepit and picnic pad version."
    ]
  },
  {
    id: "play",
    title: "Viaan Treehouse-Style Play + Net Lounge",
    type: "play",
    phase: "future",
    position: [6.35, 0, 4.75],
    rotation: [0, -0.18, 0],
    scale: [1.45, 1.1, 1.35],
    material: "cedar-rope-net",
    status: "Future family and guest amenity",
    costRange: "$4k-$28k phased build",
    revenueRole: "Family conversion, memory maker, and future amenity differentiator",
    summary:
      "A treehouse-inspired family zone: toddler play now, older-kid adventure later, adult net lounge under stars.",
    steps: [
      "Start with mulch base and bordered timber edge for safety and cleanliness.",
      "Build phase 1: small platform, slide, climbing wall, sandbox edge, and shaded seating.",
      "Build phase 2: elevated net lounge and rope-bridge feeling without overbuilding.",
      "Keep it separate from cabin traffic while still visible enough to feel safe."
    ],
    aiPrompts: [
      "Design a toddler-safe phase 1 play zone for Viaan.",
      "Show a premium adult net lounge version for family STR bookings."
    ]
  },
  {
    id: "pond",
    title: "Existing Pond + North Forest Edge",
    type: "pond",
    phase: "existing",
    position: [1.1, -0.05, 5.35],
    rotation: [0, 0, 0],
    scale: [3.15, 0.05, 1.55],
    material: "deep-water",
    status: "Natural feature",
    costRange: "$1k-$15k framing only",
    revenueRole: "Emotional luxury feature and view anchor",
    summary:
      "The emotional heart of the property: water, reflection, wildlife, and the strongest visual anchor.",
    steps: [
      "Keep the pond natural and avoid overbuilding the edge.",
      "Add one sitting node: bench, boulder seat, or small dock-like moment.",
      "Use native wet-edge plants to stabilize soil.",
      "Protect the cabin-to-pond view corridor."
    ],
    aiPrompts: [
      "Show one quiet pond sitting node without making the edge feel commercial.",
      "Create a night lighting plan that protects the natural pond feeling."
    ]
  },
  {
    id: "orchard",
    title: "Orchard Lounge + Food Forest",
    type: "orchard",
    phase: "planned",
    position: [0.1, 0, 0.2],
    rotation: [0, 0, 0],
    scale: [2.6, 0.2, 2.05],
    material: "edible-forest",
    status: "Planned 0.3-0.5 acre",
    costRange: "$4k-$25k phased food forest",
    revenueRole: "Seasonal story, harvest moments, and guest memory engine",
    summary:
      "Small, manageable-height fruit ecosystem with center sitout, pollinator plants, staggered harvest, and visual storytelling.",
    steps: [
      "Use dwarf and semi-dwarf rootstocks so trees stay roughly 8-12 ft with pruning.",
      "Plant pollination clusters: early, mid, late apples plus peach, pear, cherry, berries, herbs.",
      "Keep a central sitting circle with gravel or woodchips, chairs, low lights, and future water feature.",
      "Use clover, comfrey, thyme, lavender, currants, blueberries, and gooseberries as support layers."
    ],
    aiPrompts: [
      "Create a spring bloom version of the orchard for marketing.",
      "Show fall harvest with warm path lights and a sitout fire bowl."
    ]
  },
  {
    id: "forest",
    title: "North Forest Edge",
    type: "forest",
    phase: "existing",
    position: [0, 0, -6.2],
    rotation: [0, 0, 0],
    scale: [7.8, 1.7, 1],
    material: "native-forest",
    status: "Protected natural boundary",
    costRange: "Preserve first",
    revenueRole: "Privacy, immersion, and retreat backdrop",
    summary:
      "The north edge stays forest-forward so the property feels like a retreat instead of a yard with buildings.",
    steps: [
      "Keep clearing minimal.",
      "Preserve privacy from the road and surrounding properties.",
      "Add only trail-like interventions.",
      "Use the forest edge as the visual backdrop for cabin and pond experiences."
    ],
    aiPrompts: ["Show a minimal trail loop that does not disturb the forest edge."]
  },
  {
    id: "road",
    title: "Road / Entry Side",
    type: "road",
    phase: "existing",
    position: [-2.2, 0.02, -6.55],
    rotation: [0, 0.08, 0],
    scale: [5.2, 0.05, 0.34],
    material: "gravel-road",
    status: "Existing arrival edge",
    costRange: "$1k-$10k arrival sequence",
    revenueRole: "First impression and operational access",
    summary:
      "The barn and tent stay on the road side, keeping the cabin and pond side calm, immersive, and premium.",
    steps: [
      "Clarify arrival with simple signage.",
      "Separate guest path from service path.",
      "Keep gravel and drainage practical.",
      "Use low lighting only where orientation is needed."
    ],
    aiPrompts: ["Design the cheapest premium-looking arrival sequence for the road side."]
  }
];

export const projectRecords: ProjectRecord[] = [
  {
    id: "cabin",
    title: "16x40 Cabin",
    phase: "Contractor pricing",
    priority: "P0",
    nextStep: "Finalize orientation, utility trench plan, and deck envelope.",
    estimatedCost: 125000,
    actualCost: 0,
    projectedAnnualRevenue: 52000,
    status: "Planned"
  },
  {
    id: "orchard",
    title: "Orchard Lounge",
    phase: "Planting design",
    priority: "P1",
    nextStep: "Choose first tree order and sitout footprint.",
    estimatedCost: 14000,
    actualCost: 2200,
    projectedAnnualRevenue: 8500,
    status: "Design"
  },
  {
    id: "tent",
    title: "CanvasCamp Platform",
    phase: "Guest-ready upgrades",
    priority: "P1",
    nextStep: "Add defined path, firepit pad, and privacy planting.",
    estimatedCost: 8500,
    actualCost: 3800,
    projectedAnnualRevenue: 18000,
    status: "Existing"
  },
  {
    id: "play",
    title: "Viaan Play Area",
    phase: "Concept",
    priority: "P2",
    nextStep: "Lock toddler-safe phase 1 before adding elevated net lounge.",
    estimatedCost: 9500,
    actualCost: 0,
    projectedAnnualRevenue: 7000,
    status: "Future"
  }
];

export const scenarioRecords: ScenarioRecord[] = [
  {
    id: "scenario-night-orchard",
    title: "Night orchard guest mode",
    state: "draft",
    prompt: "Show night mode with warm string lights around orchard and one quiet pond sitting node.",
    changeSummary: "Adds low amber path lights, fire bowl at sitout, and restrained pond edge glow.",
    estimatedImpact: "High marketing value, low construction complexity."
  },
  {
    id: "scenario-cabin-materials",
    title: "Cabin material comparison",
    state: "draft",
    prompt: "Compare black metal roof with cedar siding vs darker cabin shell.",
    changeSummary: "Creates two visual variations for premium cabin exterior direction.",
    estimatedImpact: "Improves brand cohesion before contractor decisions."
  },
  {
    id: "scenario-play-phase-one",
    title: "Viaan phase 1 play build",
    state: "active",
    prompt: "Create a toddler-safe first phase with mulch, small platform, slide, shaded seating, and sandbox edge.",
    changeSummary: "Keeps near-term cost low and leaves space for future elevated net lounge.",
    estimatedImpact: "Family appeal without committing to the full build immediately."
  }
];

export const orchardPlan = [
  {
    zone: "Early Bloom",
    items: "Pink Pearl apple, Pristine apple, Stella cherry",
    season: "Spring bloom / early fruit"
  },
  {
    zone: "Summer",
    items: "Reliance peach, Contender peach, Shinseiki Asian pear, Honeycrisp",
    season: "July-August"
  },
  {
    zone: "Fall",
    items: "GoldRush, Enterprise, Fuji, Bosc pear",
    season: "September-October"
  },
  {
    zone: "Support",
    items: "Blueberry, currant, gooseberry, comfrey, clover, thyme, lavender",
    season: "All season"
  }
];

export function currency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}
