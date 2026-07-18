import { Router, type IRouter } from "express";
import { readFileSync } from "fs";
import { join } from "path";

const router: IRouter = Router();
const DATA_DIR = join(import.meta.dirname, "../data");

function loadJson<T>(filename: string): T {
  return JSON.parse(readFileSync(join(DATA_DIR, filename), "utf-8")) as T;
}

let _analytics: any | null = null;
function getAnalytics() { return _analytics ??= loadJson<any>("analytics.json"); }

// GET /api/analytics/corridors
router.get("/analytics/corridors", (_req, res) => {
  res.json(getAnalytics().corridor_stats);
});

// GET /api/analytics/temporal
router.get("/analytics/temporal", (_req, res) => {
  res.json(getAnalytics().temporal);
});

// GET /api/analytics/causes  — cleaned: merge case variants, drop noise entries
router.get("/analytics/causes", (_req, res) => {
  const raw: any[] = getAnalytics().cause_stats;
  const FILTER_OUT = new Set(["test_demo", "Fog / Low Visibility"]);

  const merged = new Map<string, any>();
  for (const c of raw) {
    if (FILTER_OUT.has(c.cause)) continue;
    const key = c.cause.toLowerCase().trim();
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, { ...c, cause: key });
    } else {
      const total = existing.count + c.count;
      existing.high_severity_frac =
        (existing.high_severity_frac * existing.count + c.high_severity_frac * c.count) / total;
      existing.road_closure_frac =
        (existing.road_closure_frac * existing.count + c.road_closure_frac * c.count) / total;
      existing.avg_duration_mins = Math.round(
        ((existing.avg_duration_mins * existing.count + c.avg_duration_mins * c.count) / total) * 10,
      ) / 10;
      existing.count = total;
    }
  }

  const result = Array.from(merged.values()).sort((a, b) => b.count - a.count);
  res.json(result);
});

export default router;
