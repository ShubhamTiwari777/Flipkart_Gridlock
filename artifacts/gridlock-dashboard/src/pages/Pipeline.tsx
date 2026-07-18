import { useGetMlPipeline } from "@workspace/api-client-react";
import { Cpu, CheckCircle2, BarChart3, Zap, Target, GitBranch } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";

function MetricPill({ label, value, color = "blue" }: { label: string; value: string; color?: string }) {
  const colors: Record<string, string> = {
    blue: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    green: "text-green-400 bg-green-400/10 border-green-400/20",
    amber: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    purple: "text-purple-400 bg-purple-400/10 border-purple-400/20",
    red: "text-red-400 bg-red-400/10 border-red-400/20",
    cyan: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
  };
  return (
    <div className={cn("rounded-lg border px-3 py-2 text-center", colors[color])}>
      <p className="text-xs font-semibold opacity-80 mb-0.5">{label}</p>
      <p className="text-sm font-black">{value}</p>
    </div>
  );
}

function ModelCard({ model, index }: { model: any; index: number }) {
  const isClassifier = model.type !== "regression";
  const iconBg = ["bg-blue-500/20 border-blue-500/40", "bg-cyan-500/20 border-cyan-500/40", "bg-purple-500/20 border-purple-500/40"][index] ?? "bg-primary/20 border-primary/40";

  const topFeatures = (model.feature_importances ?? []).slice(0, 10).map((f: any) => ({
    name: f.feature.replace(/_enc$/, "").replace(/_/g, " "),
    value: typeof f.importance === "number" ? f.importance : 0,
  }));
  const maxFI = Math.max(...topFeatures.map((f: any) => f.value), 1);
  const normalizedFI = topFeatures.map((f: any) => ({
    ...f,
    pct: Math.round((f.value / maxFI) * 100),
  }));

  const COLORS = ["#3b82f6","#22c55e","#f59e0b","#8b5cf6","#ef4444","#06b6d4","#f97316","#14b8a6","#e879f9","#a3e635"];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-border flex items-start gap-4">
        <div className={cn("w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0", iconBg)}>
          {index === 0 ? <Target className="w-5 h-5 text-blue-400" /> :
           index === 1 ? <BarChart3 className="w-5 h-5 text-cyan-400" /> :
           <GitBranch className="w-5 h-5 text-purple-400" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-foreground">{model.name}</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border font-medium">
              Model {index + 1}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{model.algorithm}</p>
          <p className="text-xs text-primary/80 mt-0.5">Target: {model.target}</p>
        </div>
      </div>

      {/* Metrics */}
      <div className="p-5 border-b border-border">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Performance Metrics</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {isClassifier ? (
            <>
              <MetricPill label="Macro F1" value={model.f1_score != null ? model.f1_score.toFixed(4) : "—"} color="blue" />
              <MetricPill label="Accuracy" value={model.accuracy != null ? `${(model.accuracy * 100).toFixed(1)}%` : "—"} color="green" />
              <MetricPill label="Train N" value={model.training_samples?.toLocaleString() ?? "—"} color="amber" />
              <MetricPill label="Features" value={model.n_features ?? "—"} color="purple" />
            </>
          ) : (
            <>
              <MetricPill label="R² Score" value={model.r2_score != null ? model.r2_score.toFixed(4) : "—"} color="blue" />
              <MetricPill label="RMSE" value={model.rmse != null ? `${model.rmse.toFixed(1)} min` : "—"} color="green" />
              <MetricPill label="Train N" value={model.training_samples?.toLocaleString() ?? "—"} color="amber" />
              <MetricPill label="Features" value={model.n_features ?? "—"} color="purple" />
            </>
          )}
        </div>
        {/* M3 blend breakdown */}
        {model.blend_details && (
          <div className="mt-3 rounded-lg border border-purple-400/20 bg-purple-400/5 p-3">
            <p className="text-xs font-semibold text-purple-400 mb-2">LGB + XGB Blend Breakdown</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">LGB solo F1</span>
                <span className="font-mono text-foreground">{model.blend_details.lgb_solo_f1.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">XGB solo F1</span>
                <span className="font-mono text-foreground">{model.blend_details.xgb_solo_f1.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-semibold">Blend F1</span>
                <span className="font-mono font-bold text-purple-400">{model.blend_details.blend_f1.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">PR threshold</span>
                <span className="font-mono text-foreground">{model.blend_details.threshold.toFixed(3)}</span>
              </div>
              <div className="flex justify-between col-span-2">
                <span className="text-muted-foreground">Positive rate (closures)</span>
                <span className="font-mono text-foreground">{(model.blend_details.positive_rate * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Class distribution (for classifiers) */}
      {isClassifier && model.class_distribution && (
        <div className="px-5 py-3 border-b border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Class Distribution</p>
          <div className="flex gap-3">
            {Object.entries(model.class_distribution).map(([cls, cnt]: [string, any]) => {
              const total = Object.values(model.class_distribution).reduce((a: any, b: any) => a + b, 0);
              const colors: Record<string, string> = { HIGH: "bg-red-400", MEDIUM: "bg-amber-400", LOW: "bg-green-400" };
              const pct = Math.round((cnt / (total as number)) * 100);
              return (
                <div key={cls} className="flex-1 text-center">
                  <div className={cn("h-1 rounded-full mb-1.5", colors[cls] ?? "bg-primary")}
                       style={{ opacity: pct / 100 + 0.3 }} />
                  <p className="text-xs font-semibold text-foreground">{(cnt as number).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{cls} ({pct}%)</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Feature importances */}
      <div className="p-5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Top Feature Importances
        </p>
        <div className="space-y-2">
          {normalizedFI.map((f: any, i: number) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-28 text-xs text-muted-foreground truncate capitalize flex-shrink-0">{f.name}</div>
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${f.pct}%`,
                    background: COLORS[i % COLORS.length],
                  }}
                />
              </div>
              <span className="text-xs font-mono text-muted-foreground w-8 text-right flex-shrink-0">
                {f.pct}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PipelineStep({ step, i, total }: { step: any; i: number; total: number }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-primary">{i + 1}</span>
        </div>
        {i < total - 1 && (
          <div className="w-px flex-1 bg-border mt-1 mb-0" />
        )}
      </div>
      <div className="pb-4 min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
          <p className="text-xs font-semibold text-foreground">{step.step}</p>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
      </div>
    </div>
  );
}

export default function PipelinePage() {
  const { data: pipeline, isLoading } = useGetMlPipeline();

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[0,1,2].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-card h-96 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!pipeline) return null;

  const trainedAt = pipeline.trained_at
    ? new Date(pipeline.trained_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
    : "—";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Cpu className="w-6 h-6 text-primary" />
            ML Pipeline Architecture
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            3 production models · {pipeline.total_events?.toLocaleString()} training events ·
            {pipeline.feature_count}–{pipeline.feature_count_m3 ?? pipeline.feature_count} engineered features (M1/M2 · M3)
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-2.5 text-right">
          <p className="text-xs text-muted-foreground">Last trained</p>
          <p className="text-sm font-semibold text-foreground">{trainedAt}</p>
        </div>
      </div>

      {/* Architecture overview */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Pipeline Architecture</h2>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch gap-2">
          {[
            { label: "Raw Data", sub: "8,173 events", color: "bg-muted/40 border-border" },
            { label: "Feature Eng.", sub: `${pipeline.feature_count} features`, color: "bg-blue-400/10 border-blue-400/20" },
            { label: "Model 1", sub: "Severity (3-class)", color: "bg-red-400/10 border-red-400/20" },
            { label: "Model 2", sub: "Duration (reg)", color: "bg-cyan-400/10 border-cyan-400/20" },
            { label: "Model 3", sub: "Closure (binary)", color: "bg-purple-400/10 border-purple-400/20" },
            { label: "Resource API", sub: "Real-time inference", color: "bg-green-400/10 border-green-400/20" },
          ].map((node, i, arr) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={cn("flex-1 rounded-lg border px-3 py-2.5 text-center min-w-0", node.color)}>
                <p className="text-xs font-bold text-foreground">{node.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{node.sub}</p>
              </div>
              {i < arr.length - 1 && (
                <div className="text-muted-foreground text-lg leading-none flex-shrink-0">→</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Model cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {(pipeline.models ?? []).map((model: any, i: number) => (
          <ModelCard key={i} model={model} index={i} />
        ))}
      </div>

      {/* Training pipeline steps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-5 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            Training Pipeline Steps
          </h2>
          <div>
            {(pipeline.pipeline_steps ?? []).map((step: any, i: number) => (
              <PipelineStep key={i} step={step} i={i} total={pipeline.pipeline_steps?.length ?? 0} />
            ))}
          </div>
        </div>

        {/* Combined feature importance comparison */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Severity Model — Feature Importance
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            Which signals matter most to the severity classifier
          </p>
          {pipeline.models?.[0]?.feature_importances ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={pipeline.models[0].feature_importances.slice(0, 10).map((f: any) => ({
                  name: f.feature.replace(/_enc$/, "").replace(/_/g, " "),
                  value: typeof f.importance === "number" ? f.importance : 0,
                }))}
                layout="vertical"
                margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 14%)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 9, fill: "hsl(215 15% 55%)" }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={90}
                  tick={{ fontSize: 9, fill: "hsl(215 15% 55%)" }}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg">
                        <p className="font-semibold text-foreground">{label}</p>
                        <p className="text-primary font-mono">{Number(payload[0]?.value).toLocaleString()}</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="value" radius={[0,3,3,0]}>
                  {pipeline.models[0].feature_importances.slice(0, 10).map((_: any, i: number) => (
                    <Cell key={i} fill={`hsl(${217 - i * 12} 80% ${65 - i * 3}%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 bg-muted/20 animate-pulse rounded-lg" />
          )}

          {/* Tech stack summary */}
          <div className="mt-5 pt-4 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Tech Stack</p>
            <div className="flex flex-wrap gap-2">
              {[
                "LightGBM GBDT","XGBoost Histogram","5-fold CV",
                "5-seed ensemble","StratifiedKFold","pygeohash","scikit-learn","pandas / numpy",
              ].map((t) => (
                <span key={t} className="text-xs px-2 py-1 rounded-md bg-muted border border-border text-muted-foreground font-mono">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
