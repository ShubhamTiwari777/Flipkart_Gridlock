import {
  useGetCorridorAnalytics,
  useGetTemporalAnalytics,
  useGetCauseAnalytics,
} from "@workspace/api-client-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Cell, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import { BarChart3, Clock, MapPin, AlertTriangle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const CHART_COLORS = ["#3b82f6","#22c55e","#f59e0b","#8b5cf6","#ef4444","#06b6d4"];

function SectionHeader({ icon: Icon, title, sub }: { icon: any; title: string; sub: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label, unit = "" }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-mono">
          {p.name}: {typeof p.value === "number" ? p.value.toFixed(1) : p.value}{unit}
        </p>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const { data: corridors, isLoading: corLoading } = useGetCorridorAnalytics();
  const { data: temporal, isLoading: tempLoading } = useGetTemporalAnalytics();
  const { data: causes, isLoading: causeLoading } = useGetCauseAnalytics();

  const top15Corridors = (corridors ?? []).slice(0, 15);
  const top10Causes = (causes ?? []).slice(0, 10);
  const maxRisk = top15Corridors.length > 0
    ? Math.max(...top15Corridors.map((c: any) => c.risk_score as number))
    : 1;
  const byHour = temporal?.by_hour ?? [];
  const byDay = temporal?.by_day ?? [];

  const radarData = top10Causes.slice(0, 6).map((c: any) => ({
    cause: c.cause.replace(/_/g, " "),
    count: c.count,
    high_sev: Math.round(c.high_severity_frac * 100),
    closure: Math.round(c.road_closure_frac * 100),
    duration: Math.round(c.avg_duration_mins),
  }));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" />
          Traffic Analytics
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Corridor performance · temporal patterns · event cause breakdown
        </p>
      </div>

      {/* Corridor bar chart */}
      <div className="rounded-xl border border-border bg-card p-5">
        <SectionHeader
          icon={MapPin}
          title="Corridor Event Volume"
          sub="Total incidents per corridor — color intensity = risk score"
        />
        {corLoading ? (
          <div className="h-56 bg-muted/20 animate-pulse rounded-lg" />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={top15Corridors} margin={{ top: 0, right: 0, left: -10, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 14%)" vertical={false} />
              <XAxis
                dataKey="corridor"
                tick={{ fontSize: 10, fill: "hsl(215 15% 55%)" }}
                angle={-45}
                textAnchor="end"
                interval={0}
              />
              <YAxis tick={{ fontSize: 10, fill: "hsl(215 15% 55%)" }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Events" radius={[3,3,0,0]}>
                {top15Corridors.map((c: any, i: number) => (
                  <Cell
                    key={i}
                    fill={`hsl(${217 - Math.round(c.risk_score * 150)} 91% ${65 - Math.round(c.risk_score * 30)}%)`}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Corridor detail table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Corridor Risk Breakdown</h2>
          <p className="text-xs text-muted-foreground">ML-predicted duration, severity counts, closure frequency</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                {["Corridor","Events","Avg Duration","High Severity","Closures","Top Cause","Risk"].map((h) => (
                  <th key={h} className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {corLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/50">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-3 bg-muted animate-pulse rounded" />
                        </td>
                      ))}
                    </tr>
                  ))
                : top15Corridors.map((c: any, i: number) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-2.5 text-xs font-medium text-foreground">{c.corridor}</td>
                      <td className="px-4 py-2.5 text-xs font-mono text-foreground">{c.count.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-xs font-mono text-foreground">{c.avg_duration_mins} min</td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs font-mono text-red-400">{c.high_severity_count}</span>
                      </td>
                      <td className="px-4 py-2.5 text-xs font-mono text-amber-400">{c.road_closure_count}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground capitalize">
                        {c.top_cause?.replace(/_/g, " ")}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-14 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.round((c.risk_score / maxRisk) * 100)}%`,
                                background: c.risk_score / maxRisk > 0.7 ? "#ef4444" : c.risk_score / maxRisk > 0.4 ? "#f59e0b" : "#22c55e",
                              }}
                            />
                          </div>
                          <span className="text-xs font-mono text-muted-foreground">{c.risk_score.toFixed(2)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Temporal charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly */}
        <div className="rounded-xl border border-border bg-card p-5">
          <SectionHeader
            icon={Clock}
            title="Hourly Incident Distribution"
            sub={temporal ? `Peak hour: ${temporal.peak_hour}:00` : "Loading..."}
          />
          {tempLoading ? (
            <div className="h-48 bg-muted/20 animate-pulse rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byHour} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 14%)" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 9, fill: "hsl(215 15% 55%)" }} />
                <YAxis tick={{ fontSize: 9, fill: "hsl(215 15% 55%)" }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Events" radius={[2,2,0,0]}>
                  {byHour.map((h: any, i: number) => (
                    <Cell
                      key={i}
                      fill={
                        (h.hour >= 7 && h.hour <= 9) || (h.hour >= 16 && h.hour <= 22)
                          ? "#ef4444"
                          : "#3b82f6"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" />Rush hour (7–9, 16–22)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" />Off-peak
            </span>
          </div>
        </div>

        {/* Day of week */}
        <div className="rounded-xl border border-border bg-card p-5">
          <SectionHeader
            icon={Zap}
            title="Day-of-Week Distribution"
            sub={temporal ? `Peak day: ${temporal.peak_day}` : "Loading..."}
          />
          {tempLoading ? (
            <div className="h-48 bg-muted/20 animate-pulse rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byDay} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 14%)" vertical={false} />
                <XAxis dataKey="day_name" tick={{ fontSize: 9, fill: "hsl(215 15% 55%)" }} />
                <YAxis tick={{ fontSize: 9, fill: "hsl(215 15% 55%)" }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Events" radius={[2,2,0,0]}>
                  {byDay.map((d: any, i: number) => (
                    <Cell
                      key={i}
                      fill={d.day >= 5 ? "#22c55e" : "#3b82f6"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" />Weekday
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block" />Weekend
            </span>
          </div>
        </div>
      </div>

      {/* Cause analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Cause bar */}
        <div className="lg:col-span-3 rounded-xl border border-border bg-card p-5">
          <SectionHeader
            icon={AlertTriangle}
            title="Event Cause Analysis"
            sub="Top 10 causes by frequency"
          />
          {causeLoading ? (
            <div className="h-72 bg-muted/20 animate-pulse rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={top10Causes} layout="vertical" margin={{ top: 0, right: 60, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 14%)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 9, fill: "hsl(215 15% 55%)" }} />
                <YAxis
                  type="category"
                  dataKey="cause"
                  width={110}
                  tick={{ fontSize: 9, fill: "hsl(215 15% 55%)" }}
                  tickFormatter={(v) => v.replace(/_/g, " ")}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Events" radius={[0,3,3,0]}>
                  {top10Causes.map((c: any, i: number) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Cause radar */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
          <SectionHeader
            icon={BarChart3}
            title="Cause Multi-Axis Profile"
            sub="Severity · Closure · Duration (top 6 causes)"
          />
          {causeLoading ? (
            <div className="h-72 bg-muted/20 animate-pulse rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(220 20% 16%)" />
                <PolarAngleAxis dataKey="cause" tick={{ fontSize: 8, fill: "hsl(215 15% 55%)" }} />
                <PolarRadiusAxis tick={{ fontSize: 8, fill: "hsl(215 15% 55%)" }} />
                <Radar name="High Sev %" dataKey="high_sev" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} />
                <Radar name="Closure %" dataKey="closure" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          )}
          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground justify-center">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />High Severity %</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />Closure %</span>
          </div>
        </div>
      </div>

      {/* Cause detail table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Cause Resource Requirements</h2>
          <p className="text-xs text-muted-foreground">ML-derived manpower, severity and closure rates per cause type</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                {["Cause","Events","Avg Duration","High Sev %","Closure %","Manpower"].map((h) => (
                  <th key={h} className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {causeLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="h-3 bg-muted animate-pulse rounded" /></td></tr>
                  ))
                : top10Causes.map((c: any, i: number) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-2.5 text-xs font-medium text-foreground capitalize">
                        {c.cause.replace(/_/g, " ")}
                      </td>
                      <td className="px-4 py-2.5 text-xs font-mono text-foreground">{c.count.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-xs font-mono text-foreground">{c.avg_duration_mins} min</td>
                      <td className="px-4 py-2.5">
                        <span className={cn(
                          "text-xs font-mono font-semibold",
                          c.high_severity_frac > 0.5 ? "text-red-400" : c.high_severity_frac > 0.2 ? "text-amber-400" : "text-green-400"
                        )}>
                          {(c.high_severity_frac * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={cn(
                          "text-xs font-mono font-semibold",
                          c.road_closure_frac > 0.4 ? "text-red-400" : c.road_closure_frac > 0.15 ? "text-amber-400" : "text-muted-foreground"
                        )}>
                          {(c.road_closure_frac * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs font-semibold text-cyan-400 font-mono">
                          {c.typical_manpower} officers
                        </span>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
