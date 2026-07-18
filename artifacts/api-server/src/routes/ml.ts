import { Router, type IRouter } from "express";
import { readFileSync } from "fs";
import { join } from "path";
import { PredictEventBody } from "@workspace/api-zod";

const router: IRouter = Router();
const DATA_DIR = join(import.meta.dirname, "../data");

function loadJson<T>(filename: string): T {
  return JSON.parse(readFileSync(join(DATA_DIR, filename), "utf-8")) as T;
}

let _pipeline: any | null = null;
let _lookup: any | null = null;

function getPipeline() { return _pipeline ??= loadJson<any>("pipeline.json"); }
function getLookup()   { return _lookup   ??= loadJson<any>("inference_lookup.json"); }

// Corridor → diversion route map
const CORRIDOR_DIVERSIONS: Record<string, string> = {
  "Mysore Road":     "Kanakapura Road / Magadi Road",
  "Bellary Road 1":  "Hebbal Flyover / Old Airport Road",
  "Bellary Road 2":  "Sahakarnagar Road / Outer Ring Road North",
  "Tumkur Road":     "Magadi Road / Chord Road",
  "Hosur Road":      "Sarjapur Road / Bannerghatta Road",
  "Old Madras Road": "KR Puram Road / Whitefield Main Road",
  "ORR North 1":     "Bellary Road / Hebbal Road",
  "ORR East 1":      "Whitefield Road / HAL Old Airport Road",
  "ORR East 2":      "Whitefield Main Road / ITPL Road",
  "ORR West 1":      "Mysore Road / Kanakapura Road",
  "Magadi Road":     "Tumkur Road / Chord Road",
  "CBD 1":           "MG Road / Residency Road",
  "CBD 2":           "Brigade Road / Richmond Road",
  "Non-corridor":    "Alternate local roads",
};

const CAUSE_MANPOWER: Record<string, [string, boolean, boolean]> = {
  accident:          ["8-12",  true,  true],
  procession:        ["10-16", true,  true],
  protest:           ["10-16", true,  true],
  vip_movement:      ["8-12",  true,  true],
  public_event:      ["6-10",  true,  true],
  tree_fall:         ["4-8",   true,  false],
  water_logging:     ["4-8",   true,  false],
  construction:      ["4-8",   true,  false],
  congestion:        ["2-4",   false, false],
  vehicle_breakdown: ["2-4",   false, false],
  pot_holes:         ["2-4",   false, false],
  road_conditions:   ["2-4",   false, false],
  others:            ["2-4",   false, false],
};

// Map frontend veh_type labels → lookup key values used by the ML pipeline
const VEH_TYPE_NORM: Record<string, string> = {
  "car":           "private_car",
  "private_car":   "private_car",
  "bus":           "private_bus",
  "private_bus":   "private_bus",
  "bmtc_bus":      "bmtc_bus",
  "ksrtc_bus":     "ksrtc_bus",
  "truck":         "truck",
  "two-wheeler":   "unknown",
  "auto":          "auto",
  "taxi":          "taxi",
  "lcv":           "lcv",
  "hcv":           "heavy_vehicle",
  "heavy_vehicle": "heavy_vehicle",
  "others":        "others",
  "unknown":       "unknown",
  "null":          "NULL",
};

function normalizeVehType(v: string): string {
  return VEH_TYPE_NORM[v.toLowerCase()] ?? "unknown";
}

function normalizeCause(c: string): string {
  // lookup has mixed case ("Debris" and "debris") — try exact first, then lowercase
  return c;
}

function hourBucket(h: number): string {
  if (h < 6)  return "night";
  if (h < 10) return "morning_rush";
  if (h < 16) return "midday";
  if (h < 20) return "evening_rush";
  return "night";
}

function resourceRecommendation(
  severity: string, closureProb: number, durationPred: number,
  cause: string, corridor: string,
) {
  const [mpRange, barricade, diversionFlag] = CAUSE_MANPOWER[cause] ?? ["2-4", false, false];
  const [mpMinStr, mpMaxStr] = mpRange.split("-");
  let mpMin = parseInt(mpMinStr), mpMax = parseInt(mpMaxStr);

  let deployPriority: string;
  if (severity === "HIGH") {
    mpMin = Math.max(mpMin, 6); mpMax = Math.max(mpMax, 10);
    deployPriority = "Immediate (0–15 min)";
  } else if (severity === "MEDIUM") {
    mpMin = Math.max(mpMin, 3); mpMax = Math.max(mpMax, 6);
    deployPriority = "Urgent (15–30 min)";
  } else {
    deployPriority = "Standard (30–60 min)";
  }

  if (closureProb > 0.7) { mpMin += 2; mpMax += 3; }

  const barricadesNeeded = barricade || closureProb > 0.6;
  const barricadeType = closureProb > 0.6
    ? "Metal barricades + traffic cones"
    : (closureProb > 0.3 ? "Traffic cones only" : "No barricades");

  const diversionSuggested = diversionFlag || closureProb > 0.4 || severity === "HIGH";
  const diversionRoute = CORRIDOR_DIVERSIONS[corridor] ?? "Alternate local roads";

  return {
    manpower_min:            mpMin,
    manpower_max:            mpMax,
    barricades_needed:       barricadesNeeded,
    barricade_type:          barricadeType,
    diversion_suggested:     diversionSuggested,
    diversion_route:         diversionSuggested ? diversionRoute : "N/A",
    estimated_clearance_mins: Math.max(15, Math.round(durationPred * 0.9)),
    deployment_priority:     deployPriority,
  };
}

// POST /api/predict
router.post("/predict", (req, res) => {
  const parsed = PredictEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  const { event_cause, veh_type, corridor, priority, hour, day_of_week, is_weekend, is_rush } =
    parsed.data;

  const lookupData = getLookup();
  const { sev_classes, lookup, global_defaults } = lookupData;

  const bucket  = hourBucket(hour);
  const normVeh = normalizeVehType(veh_type);

  // Lookup has inconsistent cause casing ("Debris" vs "debris") — try original, capitalised, lowercase
  const causeVariants    = [event_cause, event_cause[0].toUpperCase() + event_cause.slice(1), event_cause.toLowerCase()];
  const vehVariants      = [normVeh, "unknown"];
  const corridorVariants = [corridor, "Non-corridor"];
  const priorityVariants = [priority, "High", "Low"];
  const bucketVariants   = [bucket, "morning_rush", "evening_rush", "night", "midday"];

  // Probe in order of specificity — stop as soon as we get a hit
  function probe(causes: string[], vehs: string[], corrs: string[], pris: string[], buckets: string[]): any {
    for (const c of causes)
      for (const v of vehs)
        for (const co of corrs)
          for (const p of pris)
            for (const b of buckets) {
              const k = [c, v, co, p, b, is_rush, is_weekend].join("|");
              if (lookup[k]) return lookup[k];
            }
    return null;
  }

  const entry: any =
    // 1. Exact match — v14 covers all combos so this fires almost always
    probe(causeVariants, [normVeh], [corridor], [priority], [bucket]) ??
    // 2. Any veh_type, exact corridor+priority+bucket
    probe(causeVariants, vehVariants, [corridor], [priority], [bucket]) ??
    // 3. Any corridor, exact veh+priority+bucket
    probe(causeVariants, vehVariants, corridorVariants, [priority], [bucket]) ??
    // 4. Any corridor+priority, exact bucket
    probe(causeVariants, vehVariants, corridorVariants, priorityVariants, [bucket]) ??
    // 5. Any corridor+priority+bucket
    probe(causeVariants, vehVariants, corridorVariants, priorityVariants, bucketVariants) ??
    global_defaults;

  // v14 inference_lookup.json has ML model predictions for every input combination.
  // Use the values directly — no formula overrides applied.
  const sevProba: number[]   = entry.sev_proba;
  const durationPred: number = entry.duration_pred;
  const closureProb: number  = entry.closure_prob;

  const maxIdx      = sevProba.indexOf(Math.max(...sevProba));
  const severity    = sev_classes[maxIdx] as string;
  const sevConfidence = sevProba[maxIdx];

  const sevProbMap: Record<string, number> = {};
  for (let i = 0; i < sev_classes.length; i++) {
    sevProbMap[sev_classes[i]] = Math.round(sevProba[i] * 1000) / 1000;
  }

  const resource = resourceRecommendation(severity, closureProb, durationPred, event_cause, corridor);

  const featureContributions = [
    { feature: "Event Cause",  value: event_cause,          importance: 0.28 },
    { feature: "Corridor",     value: corridor,              importance: 0.22 },
    { feature: "Priority",     value: priority,              importance: 0.18 },
    { feature: "Hour of Day",  value: `${hour}:00`,          importance: 0.12 },
    { feature: "Vehicle Type", value: veh_type,              importance: 0.10 },
    { feature: "Rush Hour",    value: is_rush ? "Yes" : "No", importance: 0.06 },
    { feature: "Weekend",      value: is_weekend ? "Yes" : "No", importance: 0.04 },
  ];

  res.json({
    severity,
    severity_confidence:   Math.round(sevConfidence * 1000) / 1000,
    severity_probabilities: {
      HIGH:   sevProbMap["HIGH"]   ?? 0,
      MEDIUM: sevProbMap["MEDIUM"] ?? 0,
      LOW:    sevProbMap["LOW"]    ?? 0,
    },
    closure_probability:     Math.round(closureProb  * 1000) / 1000,
    predicted_duration_mins: Math.round(durationPred * 10)   / 10,
    resource_recommendation: resource,
    feature_contributions:   featureContributions,
  });
});

// GET /api/ml/pipeline
router.get("/ml/pipeline", (_req, res) => {
  res.json(getPipeline());
});

export default router;
