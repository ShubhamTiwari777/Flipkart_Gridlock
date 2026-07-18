import { Router, type IRouter } from "express";
import { readFileSync } from "fs";
import { join } from "path";
import { GetEventsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

const DATA_DIR = join(import.meta.dirname, "../data");

function loadJson<T>(filename: string): T {
  return JSON.parse(readFileSync(join(DATA_DIR, filename), "utf-8")) as T;
}

// Lazy-load data once
let _events: any[] | null = null;
let _hotspots: any[] | null = null;
let _analytics: any | null = null;
let _pipeline: any | null = null;
let _lookup: any | null = null;

function getEvents() { return _events ??= loadJson<any[]>("events.json"); }
function getHotspots() { return _hotspots ??= loadJson<any[]>("hotspots.json"); }
function getAnalytics() { return _analytics ??= loadJson<any>("analytics.json"); }
function getPipeline() { return _pipeline ??= loadJson<any>("pipeline.json"); }
function getLookup() { return _lookup ??= loadJson<any>("inference_lookup.json"); }

// GET /api/events
router.get("/events", (req, res) => {
  const parsed = GetEventsQueryParams.safeParse(req.query);
  const limit  = parsed.success ? (parsed.data.limit ?? 200) : 200;
  const offset = parsed.success ? (parsed.data.offset ?? 0) : 0;
  const cause  = typeof req.query.cause === "string" ? req.query.cause : null;
  const severity = typeof req.query.severity === "string" ? req.query.severity : null;
  const corridor = typeof req.query.corridor === "string" ? req.query.corridor : null;

  let events = getEvents();
  if (cause) events = events.filter((e) => e.event_cause === cause);
  if (severity) events = events.filter((e) => e.ml_severity === severity);
  if (corridor) events = events.filter((e) => e.corridor === corridor);

  res.json({
    total: events.length,
    offset,
    limit,
    events: events.slice(offset, offset + limit),
  });
});

// GET /api/events/summary
router.get("/events/summary", (_req, res) => {
  const events = getEvents();
  const total = events.length;
  const active = events.filter((e) => e.status === "active").length;
  const high = events.filter((e) => e.ml_severity === "HIGH").length;
  const med = events.filter((e) => e.ml_severity === "MEDIUM").length;
  const low = events.filter((e) => e.ml_severity === "LOW").length;
  const durations = events.map((e) => e.ml_duration_pred).filter(Boolean);
  const avgDur = durations.reduce((a, b) => a + b, 0) / durations.length;
  const closures = events.filter((e) => e.requires_road_closure).length;

  const causeCounts: Record<string, number> = {};
  const corridorCounts: Record<string, number> = {};
  for (const e of events) {
    causeCounts[e.event_cause] = (causeCounts[e.event_cause] ?? 0) + 1;
    corridorCounts[e.corridor] = (corridorCounts[e.corridor] ?? 0) + 1;
  }
  const topCause = Object.entries(causeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
  const topCorridor = Object.entries(corridorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";

  const pipeline = getPipeline();
  const modelAcc = pipeline?.models?.[0]?.f1_score ?? 0;
  const classDist = pipeline?.models?.[0]?.class_distribution ?? {};
  const hotspots = getHotspots();

  res.json({
    total_events: total,
    active_events: active,
    // ML predictions from events.json
    high_severity: high,
    medium_severity: med,
    low_severity: low,
    // True training labels from pipeline (matches v13 training output)
    high_severity_labels: classDist["HIGH"] ?? high,
    medium_severity_labels: classDist["MEDIUM"] ?? med,
    low_severity_labels: classDist["LOW"] ?? low,
    avg_duration_mins: Math.round(avgDur * 10) / 10,
    road_closure_count: closures,
    total_hotspots: hotspots.length,
    top_corridor: topCorridor,
    top_cause: topCause,
    model_accuracy: modelAcc,
  });
});

// GET /api/events/hotspots
router.get("/events/hotspots", (_req, res) => {
  res.json(getHotspots());
});

export default router;
