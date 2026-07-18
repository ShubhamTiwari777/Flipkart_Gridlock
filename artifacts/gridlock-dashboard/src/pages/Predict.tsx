import { useState } from "react";
import { usePredictEvent } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import {
  BrainCircuit, AlertTriangle, Clock, Shield, Users,
  Construction, Navigation, Loader2,
} from "lucide-react";

const EVENT_CAUSES = [
  "accident","procession","protest","vip_movement","public_event",
  "tree_fall","water_logging","construction","congestion",
  "vehicle_breakdown","pot_holes","road_conditions","debris","others",
];

const VEH_TYPES = [
  "Car","Bus","Truck","Two-Wheeler","Auto","LCV","HCV","Unknown",
];

const CORRIDORS = [
  "Hosur Road","Mysore Road","Tumkur Road","Bellary Road 1","Bellary Road 2",
  "Old Madras Road","Magadi Road","Old Airport Road","Bannerghata Road",
  "ORR North 1","ORR North 2","ORR East 1","ORR East 2","ORR West 1",
  "West of Chord Road","Hennur Main Road","Varthur Road",
  "CBD 1","CBD 2","Non-corridor",
];

const PRIORITIES = ["Low","Medium","High"];

const DAYS = [
  { value: 0, label: "Monday" },
  { value: 1, label: "Tuesday" },
  { value: 2, label: "Wednesday" },
  { value: 3, label: "Thursday" },
  { value: 4, label: "Friday" },
  { value: 5, label: "Saturday" },
  { value: 6, label: "Sunday" },
];

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const label =
    i === 0  ? "12:00 AM (Midnight)" :
    i < 12   ? `${i}:00 AM` :
    i === 12 ? "12:00 PM (Noon)" :
               `${i - 12}:00 PM`;
  return { value: i, label };
});

function isRushHour(h: number) {
  return (h >= 7 && h <= 9) || (h >= 16 && h <= 20);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

function SelectInput({
  value, onChange, options,
}: {
  value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 text-sm rounded-lg bg-muted border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 appearance-none"
    >
      {options.map((o) => (
        <option key={o} value={o}>{o.replace(/_/g, " ")}</option>
      ))}
    </select>
  );
}

function ProbBar({ label, prob, color }: { label: string; prob: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground font-medium">{label}</span>
        <span className="font-mono font-semibold" style={{ color }}>{(prob * 100).toFixed(1)}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${prob * 100}%`, background: color }}
        />
      </div>
    </div>
  );
}

function ResourceCard({ icon: Icon, label, value, sub, accent = false }: {
  icon: any; label: string; value: string; sub?: string; accent?: boolean;
}) {
  return (
    <div className={cn(
      "rounded-lg border p-4",
      accent ? "border-primary/30 bg-primary/8" : "border-border bg-muted/30"
    )}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn("w-4 h-4", accent ? "text-primary" : "text-muted-foreground")} />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
      </div>
      <p className={cn("text-sm font-bold", accent ? "text-primary" : "text-foreground")}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

export default function PredictPage() {
  const [form, setForm] = useState({
    event_cause: "accident",
    veh_type:    "Car",
    corridor:    "Hosur Road",
    priority:    "High",
    hour:        8,
    day_of_week: 1,
    is_rush:     1,
  });

  // is_weekend is fully derived from day_of_week — no separate control needed
  const is_weekend = form.day_of_week >= 5 ? 1 : 0;

  const [lastPredictedForm, setLastPredictedForm] = useState<(typeof form & { is_weekend: number }) | null>(null);
  const { mutate, isPending, data: result, isError } = usePredictEvent();

  const submitted = lastPredictedForm
    ? { ...lastPredictedForm }
    : null;
  const current = { ...form, is_weekend };
  const isStale = result && submitted && JSON.stringify(current) !== JSON.stringify(submitted);

  // When hour changes, auto-update rush hour to match
  function handleHourChange(h: number) {
    setForm(f => ({ ...f, hour: h, is_rush: isRushHour(h) ? 1 : 0 }));
  }

  // When day changes, form.day_of_week updates; is_weekend auto-derives
  function handleDayChange(d: number) {
    setForm(f => ({ ...f, day_of_week: d }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...form, is_weekend };
    setLastPredictedForm(payload);
    mutate({ data: payload });
  }

  const sevColors: Record<string, string> = {
    HIGH: "#ef4444", MEDIUM: "#f59e0b", LOW: "#22c55e",
  };

  const sev = result?.severity ?? "";
  const sevColor = sevColors[sev] ?? "#6b7280";

  const rushLabel = form.is_rush ? "Rush hour" : "Off-peak";
  const weekendLabel = is_weekend ? "Weekend" : "Weekday";
  const hourLabel = HOURS.find(h => h.value === form.hour)?.label ?? `${form.hour}:00`;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BrainCircuit className="w-6 h-6 text-primary" />
          Event Impact Predictor
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          ML inference using 3 trained models — severity classifier · duration predictor · closure probability
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-4 rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold text-foreground border-b border-border pb-3 mb-4">
            Event Parameters
          </h2>

          <Field label="Event Cause">
            <SelectInput
              value={form.event_cause}
              onChange={(v) => setForm(f => ({ ...f, event_cause: v }))}
              options={EVENT_CAUSES}
            />
          </Field>

          <Field label="Vehicle Type">
            <SelectInput
              value={form.veh_type}
              onChange={(v) => setForm(f => ({ ...f, veh_type: v }))}
              options={VEH_TYPES}
            />
          </Field>

          <Field label="Corridor">
            <SelectInput
              value={form.corridor}
              onChange={(v) => setForm(f => ({ ...f, corridor: v }))}
              options={CORRIDORS}
            />
          </Field>

          <Field label="Priority">
            <SelectInput
              value={form.priority}
              onChange={(v) => setForm(f => ({ ...f, priority: v }))}
              options={PRIORITIES}
            />
          </Field>

          {/* Hour + Day */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Time of Day">
              <select
                value={form.hour}
                onChange={(e) => handleHourChange(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg bg-muted border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              >
                {HOURS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </Field>
            <Field label="Day of Week">
              <select
                value={form.day_of_week}
                onChange={(e) => handleDayChange(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg bg-muted border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              >
                {DAYS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </Field>
          </div>

          {/* Derived badges row */}
          <div className="flex items-center gap-2 text-xs">
            <span className={cn(
              "px-2 py-0.5 rounded-full font-medium border",
              form.is_rush
                ? "bg-amber-400/15 text-amber-400 border-amber-400/30"
                : "bg-muted text-muted-foreground border-border"
            )}>
              {rushLabel}
            </span>
            <span className={cn(
              "px-2 py-0.5 rounded-full font-medium border",
              is_weekend
                ? "bg-blue-400/15 text-blue-400 border-blue-400/30"
                : "bg-muted text-muted-foreground border-border"
            )}>
              {weekendLabel}
            </span>
            <span className="text-muted-foreground/60">{hourLabel}</span>
          </div>

          {/* Manual rush override */}
          <Field label="Rush Hour Override">
            <select
              value={form.is_rush}
              onChange={(e) => setForm(f => ({ ...f, is_rush: Number(e.target.value) }))}
              className="w-full px-3 py-2 text-sm rounded-lg bg-muted border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            >
              <option value={1}>Yes — Rush hour (7–9, 16–20)</option>
              <option value={0}>No — Off-peak</option>
            </select>
          </Field>

          <button
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60 mt-2"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Running inference...
              </>
            ) : (
              <>
                <BrainCircuit className="w-4 h-4" />
                Predict Impact
              </>
            )}
          </button>

          {isError && (
            <p className="text-xs text-red-400 text-center">Prediction failed — check API connection.</p>
          )}
        </form>

        {/* ── Results ── */}
        <div className="lg:col-span-3 space-y-4">
          {!result && !isPending && (
            <div className="rounded-xl border border-dashed border-border bg-card/50 h-full flex items-center justify-center p-12">
              <div className="text-center">
                <BrainCircuit className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm font-medium text-muted-foreground">Configure parameters and click Predict Impact</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  3 ML models will run in real-time to forecast severity, duration, and closure risk
                </p>
              </div>
            </div>
          )}

          {isPending && (
            <div className="rounded-xl border border-border bg-card h-64 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Running 3 ML models...</p>
              </div>
            </div>
          )}

          {result && !isPending && (
            <>
              {isStale && (
                <div className="rounded-lg border border-amber-400/40 bg-amber-400/10 px-4 py-2.5 flex items-center gap-2 text-xs text-amber-400 font-medium">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  Parameters changed — click <span className="font-bold mx-1">Predict Impact</span> to update results
                </div>
              )}

              {/* Severity banner */}
              <div
                className={cn("rounded-xl border p-5", isStale && "opacity-60")}
                style={{ background: `${sevColor}14`, borderColor: `${sevColor}40` }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      Predicted Severity
                    </p>
                    <p className="text-4xl font-black" style={{ color: sevColor }}>{sev}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Confidence: <span className="font-semibold text-foreground">
                        {((result.severity_confidence ?? 0) * 100).toFixed(1)}%
                      </span>
                    </p>
                  </div>
                  <AlertTriangle className="w-16 h-16 opacity-20" style={{ color: sevColor }} />
                </div>
              </div>

              {/* Severity probabilities */}
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                  Model 1 — Severity Class Probabilities
                </h3>
                <div className="space-y-3">
                  <ProbBar label="HIGH"   prob={result.severity_probabilities?.HIGH ?? 0}   color="#ef4444" />
                  <ProbBar label="MEDIUM" prob={result.severity_probabilities?.MEDIUM ?? 0} color="#f59e0b" />
                  <ProbBar label="LOW"    prob={result.severity_probabilities?.LOW ?? 0}    color="#22c55e" />
                </div>
              </div>

              {/* Key metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Model 2 — Duration</span>
                  </div>
                  <p className="text-3xl font-black text-foreground">
                    {result.predicted_duration_mins?.toFixed(0)}
                    <span className="text-lg font-normal text-muted-foreground"> min</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">XGBoost regression estimate</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Model 3 — Closure Prob</span>
                  </div>
                  <p className="text-3xl font-black text-foreground">
                    {((result.closure_probability ?? 0) * 100).toFixed(0)}
                    <span className="text-lg font-normal text-muted-foreground">%</span>
                  </p>
                  <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(result.closure_probability ?? 0) * 100}%`,
                        background: (result.closure_probability ?? 0) > 0.6 ? "#ef4444"
                          : (result.closure_probability ?? 0) > 0.3 ? "#f59e0b" : "#22c55e",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Resource recommendations */}
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                  Resource Deployment Recommendations
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <ResourceCard
                    icon={Users} label="Manpower" accent
                    value={`${result.resource_recommendation?.manpower_min}–${result.resource_recommendation?.manpower_max} officers`}
                  />
                  <ResourceCard
                    icon={AlertTriangle} label="Deploy Priority"
                    value={result.resource_recommendation?.deployment_priority ?? "—"}
                  />
                  <ResourceCard
                    icon={Construction} label="Barricades"
                    value={result.resource_recommendation?.barricade_type ?? "—"}
                    sub={result.resource_recommendation?.barricades_needed ? "Required" : "Not required"}
                  />
                  <ResourceCard
                    icon={Clock} label="Est. Clearance"
                    value={`${result.resource_recommendation?.estimated_clearance_mins ?? 0} min`}
                  />
                </div>
                {result.resource_recommendation?.diversion_suggested && (
                  <div className="mt-3 rounded-lg border border-blue-400/30 bg-blue-400/8 p-3 flex items-start gap-2">
                    <Navigation className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-blue-400">Suggested Diversion Route</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {result.resource_recommendation?.diversion_route}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Feature contributions */}
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                  Feature Contributions (SHAP-style)
                </h3>
                <div className="space-y-2">
                  {(result.feature_contributions ?? []).map((fc: any, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-28 text-xs text-muted-foreground truncate flex-shrink-0">{fc.feature}</div>
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary/70 transition-all"
                          style={{ width: `${fc.importance * 100}%` }}
                        />
                      </div>
                      <div className="text-xs font-mono text-muted-foreground w-8 text-right flex-shrink-0">
                        {(fc.importance * 100).toFixed(0)}%
                      </div>
                      <div className="text-xs text-foreground w-24 truncate text-right flex-shrink-0">
                        {String(fc.value)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
