import { useState, useEffect, useRef, useMemo } from "react";
import {
  useGetEventsSummary,
  useGetEvents,
  useGetHotspots,
} from "@workspace/api-client-react";
import {
  AlertTriangle, Clock, MapPin, TrendingUp, Shield, Zap,
  ChevronUp, ChevronDown, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    mappls: any;
  }
}

const GEOHASH_NAMES: Record<string, string> = {
  tdr1v: "MG Road / Shivajinagar",
  tdr4h: "Malleshwaram / Rajajinagar",
  tdr4j: "Hebbal / Nagavara",
  tdr1t: "Koramangala",
  tdr1m: "Jayanagar / JP Nagar",
  tdr1s: "Basavanagudi / Kanakapura Road",
  tdr1y: "Indiranagar / Old Airport Road",
  tdr4n: "Kalyan Nagar / HBR Layout",
  tdr1w: "HSR Layout / Sarjapur Road",
  tdr1q: "BTM Layout / Bommanahalli",
  tdr1u: "Sadashivanagar / Palace Road",
  tdr1z: "Marathahalli / Outer Ring Road",
  tdr4m: "Yelahanka / Thanisandra",
  tdr45: "Peenya / Tumkur Road",
  tdr1g: "Rajajinagar / Chord Road",
  tdr1x: "Bellandur / Sarjapur ORR",
  tdr3b: "Whitefield / Hope Farm",
  tdr4t: "Yelahanka New Town",
  tdr38: "Marathahalli / Varthur Road",
  tdr46: "Peenya Industrial Area",
  tdr60: "Hoodi / Whitefield Entry",
  tdr1e: "Kanakapura Road / Banashankari",
  tdr4w: "Yelahanka Satellite Town",
  tdr39: "Varthur / Kadugodi",
  tdr4p: "Banaswadi / Hoodi",
  tdr1p: "Electronic City / Bommasandra",
  tdr3c: "ITPL / Whitefield",
  tdr4q: "Nagawara / Judicial Layout",
  tdr1k: "Uttarahalli / Padmanabhanagar",
  tdr1j: "Electronic City Phase 1",
  tdr4k: "Hesaraghatta Road / BEL Layout",
  tdr17: "Kengeri / Mysore Road",
  tdr1r: "Electronic City Phase 2",
  tdr33: "Anekal / Chandapura",
  tdr4y: "Devanahalli / Bellary Road",
  tdr1n: "Begur / Hulimavu",
  tdr47: "Jalahalli / Mysore Road North",
  tdr16: "Kengeri Satellite Town",
  tdr32: "Chandapura / EC Phase 2",
  tdr1h: "Bannerghatta Road / JP Nagar 8th Phase",
  tdr0z: "Anekal / Attibele",
  tdr1f: "Magadi Road / RR Nagar",
  tdr61: "Varthur / Whitefield Lake",
  tdr1d: "Kanakapura Road South",
  tdr15: "Banashankari 6th Stage",
  tdr4v: "BIAL Road / Devanahalli",
  tdr43: "Tumkur Road / Nelamangala",
  tdr63: "Budigere / Old Madras Road",
  tdr4r: "Hennur Road / Bagalur",
  tdr4s: "Yelahanka / BEL Road",
  tdr6b: "BIAL / Kempegowda Airport",
  tdr2b: "Chandapura / Anekal Road",
  tdr4x: "Hoskote / Old Madras Road",
  tdr4z: "BIAL / Airport Zone",
};

const ROAD_COORDS: Record<string, { lat: number; lng: number }> = {
  tdr1v: { lat: 12.9767, lng: 77.6099 },
  tdr4h: { lat: 13.0035, lng: 77.5698 },
  tdr4j: { lat: 13.0358, lng: 77.5970 },
  tdr1t: { lat: 12.9352, lng: 77.6244 },
  tdr1m: { lat: 12.9250, lng: 77.5833 },
  tdr1s: { lat: 12.9429, lng: 77.5735 },
  tdr1y: { lat: 12.9784, lng: 77.6408 },
  tdr4n: { lat: 13.0233, lng: 77.6411 },
  tdr1w: { lat: 12.9116, lng: 77.6472 },
  tdr1q: { lat: 12.9166, lng: 77.6101 },
  tdr1u: { lat: 13.0024, lng: 77.5800 },
  tdr1z: { lat: 12.9591, lng: 77.6972 },
  tdr4m: { lat: 13.1005, lng: 77.5925 },
  tdr45: { lat: 13.0302, lng: 77.5196 },
  tdr1g: { lat: 12.9858, lng: 77.5535 },
  tdr1x: { lat: 12.9258, lng: 77.6763 },
  tdr3b: { lat: 12.9698, lng: 77.7499 },
  tdr4t: { lat: 13.0998, lng: 77.5969 },
  tdr38: { lat: 12.9555, lng: 77.7012 },
  tdr46: { lat: 13.0198, lng: 77.5225 },
  tdr60: { lat: 12.9968, lng: 77.7138 },
  tdr1e: { lat: 12.9009, lng: 77.5704 },
  tdr4w: { lat: 13.0978, lng: 77.5555 },
  tdr39: { lat: 12.9416, lng: 77.7352 },
  tdr4p: { lat: 13.0105, lng: 77.6527 },
  tdr1p: { lat: 12.8453, lng: 77.6601 },
  tdr3c: { lat: 12.9851, lng: 77.7261 },
  tdr4q: { lat: 13.0459, lng: 77.6212 },
  tdr1k: { lat: 12.8960, lng: 77.5475 },
  tdr1j: { lat: 12.8501, lng: 77.6641 },
  tdr4k: { lat: 13.0525, lng: 77.5266 },
  tdr17: { lat: 12.9103, lng: 77.4843 },
  tdr1r: { lat: 12.8455, lng: 77.6741 },
  tdr33: { lat: 12.7157, lng: 77.6965 },
  tdr4y: { lat: 13.2457, lng: 77.7173 },
  tdr1n: { lat: 12.8729, lng: 77.6152 },
  tdr47: { lat: 13.0478, lng: 77.5073 },
  tdr16: { lat: 12.9095, lng: 77.4780 },
  tdr32: { lat: 12.8024, lng: 77.6753 },
  tdr1h: { lat: 12.8648, lng: 77.5997 },
  tdr0z: { lat: 12.6977, lng: 77.6980 },
  tdr1f: { lat: 12.9501, lng: 77.5204 },
  tdr61: { lat: 12.9380, lng: 77.7509 },
  tdr1d: { lat: 12.8701, lng: 77.5529 },
  tdr15: { lat: 12.8972, lng: 77.5301 },
  tdr4v: { lat: 13.1985, lng: 77.7085 },
  tdr43: { lat: 13.0960, lng: 77.3950 },
  tdr63: { lat: 13.0608, lng: 77.7775 },
  tdr4r: { lat: 13.0670, lng: 77.6475 },
  tdr4s: { lat: 13.0633, lng: 77.5793 },
  tdr6b: { lat: 13.1979, lng: 77.7063 },
  tdr2b: { lat: 12.8050, lng: 77.6990 },
  tdr4x: { lat: 13.0712, lng: 77.7984 },
  tdr4z: { lat: 13.1580, lng: 77.7175 },
};

function StatCard({
  icon: Icon, label, value, sub, color = "blue",
}: {
  icon: any; label: string; value: string | number; sub?: string; color?: string;
}) {
  const colors: Record<string, string> = {
    blue: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    red: "text-red-400 bg-red-400/10 border-red-400/20",
    amber: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    green: "text-green-400 bg-green-400/10 border-green-400/20",
    purple: "text-purple-400 bg-purple-400/10 border-purple-400/20",
    cyan: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
  };
  return (
    <div className="rounded-xl border border-border bg-card p-5 flex gap-4 items-start">
      <div className={cn("rounded-lg p-2.5 border", colors[color])}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">{label}</p>
        <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function SeverityBadge({ sev }: { sev: string }) {
  const cls: Record<string, string> = {
    HIGH: "bg-red-400/15 text-red-400 border-red-400/30",
    MEDIUM: "bg-amber-400/15 text-amber-400 border-amber-400/30",
    LOW: "bg-green-400/15 text-green-400 border-green-400/30",
  };
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border", cls[sev] ?? cls.LOW)}>
      {sev}
    </span>
  );
}

function MapplsHotspotMap({ hotspots }: { hotspots: any[] }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialCenter = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || hotspots.length === 0) return;

    const MAP_ID = "mappls-map-container";
    let attempts = 0;
    const MAX_ATTEMPTS = 48;

    const showError = (reason?: string) => {
      if (!wrapperRef.current) return;
      const msg = reason === "webgl"
        ? "Vector map requires WebGL — renders correctly in a real browser or deployed app"
        : "SDK could not load — verify API key at auth.mappls.com/console";
      wrapperRef.current.innerHTML = `
        <div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:#9ca3af;padding:24px;text-align:center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="1.5" opacity="0.6"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <p style="font-size:14px;font-weight:600;color:#f3f4f6;margin:0">MapMyIndia map — preview unavailable</p>
          <p style="font-size:12px;margin:0">${msg}</p>
        </div>`;
    };

    const SDK_SCRIPT_ID = "mappls-sdk-script";
    if (!document.getElementById(SDK_SCRIPT_ID) && !window.mappls) {
      const apiKey = (import.meta as any).env?.VITE_MAPPLS_API_KEY ?? "";
      const script = document.createElement("script");
      script.id = SDK_SCRIPT_ID;
      script.src = `https://sdk.mappls.com/map/sdk/web?v=3.0&access_token=${apiKey}`;
      document.head.appendChild(script);
    }

    wrapper.innerHTML = "";
    const mapDiv = document.createElement("div");
    mapDiv.id = MAP_ID;
    mapDiv.style.height = "100%";
    mapDiv.style.width = "100%";
    wrapper.appendChild(mapDiv);

    const centerLat = hotspots.reduce((s, h) => s + h.lat, 0) / hotspots.length;
    const centerLon = hotspots.reduce((s, h) => s + h.lon, 0) / hotspots.length;
    const maxRisk = hotspots[0]?.risk_score ?? 1;

    const tryInit = () => {
      if (!window.mappls) {
        attempts++;
        if (attempts >= MAX_ATTEMPTS) { showError(); return; }
        pollRef.current = setTimeout(tryInit, 250);
        return;
      }

      if (mapRef.current) {
        try { mapRef.current.remove(); } catch (_) {}
        mapRef.current = null;
      }

      initialCenter.current = { lat: centerLat, lng: centerLon };
      let map: any;
      try {
        map = new window.mappls.Map(MAP_ID, {
          center: { lat: centerLat, lng: centerLon },
          zoom: 11,
        });
      } catch (err: any) {
        const isWebGL = String(err?.message ?? err).toLowerCase().includes("webgl");
        showError(isWebGL ? "webgl" : undefined);
        return;
      }
      mapRef.current = map;

      const addMarkers = () => {
        let activeInfoWindow: any = null;

        hotspots.forEach((h) => {
          const ratio = h.risk_score / maxRisk;
          const color = ratio > 0.6 ? "#ef4444" : ratio > 0.3 ? "#f59e0b" : "#22c55e";
          const riskLabel = ratio > 0.6 ? "HIGH" : ratio > 0.3 ? "MEDIUM" : "LOW";
          const label = GEOHASH_NAMES[h.geohash] ?? h.geohash;
          const pos = ROAD_COORDS[h.geohash] ?? { lat: h.lat, lng: h.lon };

          const popupHtml = `<div style="min-width:210px;max-width:250px;font-family:Inter,system-ui,sans-serif;padding:6px 4px;background:#ffffff;color:#1f2937;border-radius:4px">
  <div style="display:flex;align-items:center;gap:7px;margin-bottom:10px;padding-bottom:8px;border-bottom:2px solid ${color}">
    <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};flex-shrink:0"></span>
    <span style="font-weight:700;font-size:13px;color:${color};line-height:1.2">${label}</span>
  </div>
  <table style="font-size:12px;border-collapse:collapse;width:100%;line-height:1.9;color:#1f2937">
    <tr>
      <td style="color:#6b7280;padding-right:14px;font-weight:400">Risk Level</td>
      <td style="color:${color};font-weight:700">${riskLabel}</td>
    </tr>
    <tr>
      <td style="color:#6b7280;padding-right:14px;font-weight:400">Events</td>
      <td style="color:#1f2937;font-weight:700">${h.count.toLocaleString()}</td>
    </tr>
    <tr>
      <td style="color:#6b7280;padding-right:14px;font-weight:400">Risk Score</td>
      <td style="color:#1f2937;font-weight:700">${h.risk_score.toFixed(1)}</td>
    </tr>
    <tr>
      <td style="color:#6b7280;padding-right:14px;font-weight:400">Top Cause</td>
      <td style="color:#1f2937;font-weight:700">${(h.top_cause ?? "").replace(/_/g, " ")}</td>
    </tr>
    <tr>
      <td style="color:#6b7280;padding-right:14px;font-weight:400">High Severity</td>
      <td style="color:${color};font-weight:700">${(h.high_severity_frac * 100).toFixed(0)}%</td>
    </tr>
  </table>
</div>`;

          const openPopup = () => {
            try { map.setCenter({ lat: pos.lat, lng: pos.lng }); } catch (_) {}
            try { map.setZoom(15); } catch (_) {}
            try { activeInfoWindow?.close?.(); } catch (_) {}
            try { activeInfoWindow?.setMap?.(null); } catch (_) {}
            activeInfoWindow = null;
            try {
              activeInfoWindow = new window.mappls.InfoWindow({
                map,
                content: popupHtml,
                position: { lat: pos.lat, lng: pos.lng },
              });
            } catch (_) {}
          };

          try {
            const circle = new window.mappls.Circle({
              map,
              center: { lat: pos.lat, lng: pos.lng },
              position: { lat: pos.lat, lng: pos.lng },
              radius: 450,
              fillColor: color,
              fillOpacity: 0.55,
              strokeColor: color,
              strokeOpacity: 1,
              strokeWeight: 2,
              clickable: true,
            });
            try { circle.addListener("click", openPopup); } catch (_) {
              try { window.mappls.event.addListener(circle, "click", openPopup); } catch (__) {}
            }
          } catch (_) {}

          const svgPin = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="30" viewBox="0 0 22 30"><path d="M11 0C4.925 0 0 4.925 0 11c0 7.333 11 19 11 19S22 18.333 22 11C22 4.925 17.075 0 11 0z" fill="${color}" stroke="white" stroke-width="1.5"/><circle cx="11" cy="11" r="4" fill="white" opacity="0.9"/></svg>`;
          const iconUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgPin)}`;
          try {
            const marker = new window.mappls.Marker({
              map,
              position: { lat: pos.lat, lng: pos.lng },
              icon: { url: iconUrl, size: { width: 22, height: 30 }, anchor: { x: 11, y: 30 } },
              draggable: false,
            });
            try { marker.addListener("click", openPopup); } catch (_) {
              try { window.mappls.event.addListener(marker, "click", openPopup); } catch (__) {}
            }
          } catch (_) {}
        });
      };

      try {
        if (map.isStyleLoaded?.()) addMarkers();
        else map.on("load", addMarkers);
      } catch (_) {
        addMarkers();
      }
    };

    pollRef.current = setTimeout(tryInit, 0);

    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
      if (mapRef.current) {
        try { mapRef.current.remove(); } catch (_) {}
        mapRef.current = null;
      }
    };
  }, [hotspots]);

  const resetView = () => {
    const m = mapRef.current;
    const c = initialCenter.current;
    if (!m || !c) return;
    try { m.setCenter({ lat: c.lat, lng: c.lng }); } catch (_) {}
    try { m.setZoom(11); } catch (_) {}
  };

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      <div ref={wrapperRef} style={{ height: "100%", width: "100%" }} />
      <button
        onClick={resetView}
        title="Reset to full Bengaluru view"
        style={{
          position: "absolute",
          bottom: "12px",
          left: "12px",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: "5px",
          padding: "5px 10px",
          borderRadius: "6px",
          background: "rgba(15,23,42,0.85)",
          border: "1px solid rgba(255,255,255,0.15)",
          color: "#f3f4f6",
          fontSize: "12px",
          fontWeight: 600,
          cursor: "pointer",
          backdropFilter: "blur(4px)",
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
        Reset view
      </button>
    </div>
  );
}

export default function OverviewPage() {
  const { data: summary, isLoading: sumLoading, refetch } = useGetEventsSummary();
  const { data: hotspotData, isLoading: hotLoading } = useGetHotspots({ query: { staleTime: Infinity } });
  const { data: eventsData, isLoading: evLoading } = useGetEvents({ limit: 50, offset: 0 }, { query: { staleTime: Infinity } });

  const [sevFilter, setSevFilter] = useState<string>("ALL");
  const [sortField, setSortField] = useState<string>("ml_duration_pred");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [showMapTip, setShowMapTip] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowMapTip(false), 4000);
    return () => clearTimeout(t);
  }, []);

  const hotspots = hotspotData ?? [];
  const allEvents = eventsData?.events ?? [];
  const events = allEvents
    .filter((e) => sevFilter === "ALL" || e.ml_severity === sevFilter)
    .sort((a: any, b: any) => {
      const av = a[sortField] ?? 0;
      const bv = b[sortField] ?? 0;
      return sortDir === "desc" ? bv - av : av - bv;
    });

  function toggleSort(field: string) {
    if (sortField === field) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortField(field); setSortDir("desc"); }
  }

  const SortIcon = ({ field }: { field: string }) =>
    sortField === field
      ? sortDir === "desc" ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />
      : null;

  const validHotspots = useMemo(
    () => (hotspots as any[]).filter((h) => h.lat && h.lon),
    [hotspots]
  );

  return (
    <div className="p-6 space-y-6">

      {/* Map tip popup */}
      {showMapTip && (
        <div style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          zIndex: 9999,
          maxWidth: "340px",
          background: "rgba(15,23,42,0.96)",
          border: "1px solid rgba(99,102,241,0.5)",
          borderRadius: "12px",
          padding: "16px 20px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          backdropFilter: "blur(8px)",
          animation: "gridlockFadeIn 0.4s ease",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
            <span style={{ fontSize: "22px", lineHeight: "1", flexShrink: 0 }}>🗺️</span>
            <div>
              <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: "14px", color: "#e2e8f0" }}>
                Map not visible?
              </p>
              <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8", lineHeight: 1.5 }}>
                If the Bengaluru hotspot map doesn't appear, please{" "}
                <strong style={{ color: "#818cf8" }}>refresh the page 2–3 times</strong>.
                The MapMyIndia SDK may take a moment to initialize.
              </p>
            </div>
            <button
              onClick={() => setShowMapTip(false)}
              style={{
                background: "none",
                border: "none",
                color: "#64748b",
                cursor: "pointer",
                fontSize: "16px",
                lineHeight: 1,
                padding: "0",
                flexShrink: 0,
              }}
            >
              ×
            </button>
          </div>
          <div style={{ marginTop: "12px", height: "3px", borderRadius: "99px", background: "rgba(99,102,241,0.2)", overflow: "hidden" }}>
            <div style={{ height: "100%", background: "#6366f1", animation: "gridlockShrink 4s linear forwards" }} />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Traffic Intelligence Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Bengaluru event-driven congestion analysis — 8,173 events, 3 ML models
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard icon={Zap} label="Total Events" value={sumLoading ? "—" : (summary?.total_events ?? 0).toLocaleString()} sub="v13 dataset" color="blue" />
        <StatCard icon={AlertTriangle} label="High Severity" value={sumLoading ? "—" : (summary?.high_severity_labels ?? 0).toLocaleString()} sub="Training labels" color="red" />
        <StatCard icon={TrendingUp} label="Medium Severity" value={sumLoading ? "—" : (summary?.medium_severity_labels ?? 0).toLocaleString()} sub="Training labels" color="amber" />
        <StatCard icon={Shield} label="Road Closures" value={sumLoading ? "—" : (summary?.road_closure_count ?? 0).toLocaleString()} sub="8.3% of events" color="purple" />
        <StatCard icon={MapPin} label="Hotspot Cells" value={sumLoading ? "—" : (summary?.total_hotspots ?? 0).toLocaleString()} sub="Geohash-5 risk zones" color="cyan" />
        <StatCard icon={TrendingUp} label="Model F1" value={sumLoading ? "—" : `${((summary?.model_accuracy ?? 0) * 100).toFixed(1)}%`} sub="Severity classifier" color="green" />
      </div>

      {/* Map + Risk zones */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Mappls Hotspot Map */}
        <div className="xl:col-span-3 rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Bengaluru Hotspot Map</h2>
              <p className="text-xs text-muted-foreground">{validHotspots.length} risk zones — colour = risk level</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> High risk</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Medium</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" /> Low</span>
            </div>
          </div>
          <div className="h-80">
            {hotLoading ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                Loading map data...
              </div>
            ) : validHotspots.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No hotspot data available
              </div>
            ) : (
              <MapplsHotspotMap hotspots={validHotspots} />
            )}
          </div>
        </div>

        {/* Top hotspots list */}
        <div className="xl:col-span-2 rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Top Risk Zones</h2>
            <p className="text-xs text-muted-foreground">Ranked by composite risk score</p>
          </div>
          <div className="divide-y divide-border overflow-y-auto max-h-80">
            {hotLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="px-5 py-3 animate-pulse">
                    <div className="h-3 bg-muted rounded w-2/3 mb-1" />
                    <div className="h-2 bg-muted rounded w-1/3" />
                  </div>
                ))
              : validHotspots.slice(0, 15).map((h: any, i: number) => (
                  <div key={i} className="px-5 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{GEOHASH_NAMES[h.geohash] ?? h.geohash}</p>
                      <p className="text-xs text-muted-foreground truncate">{h.top_cause?.replace(/_/g, " ")} · {h.count} events</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="h-1.5 rounded-full w-16 bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={(() => {
                            const ratio = h.risk_score / (validHotspots[0]?.risk_score ?? 1);
                            return {
                              width: `${Math.min(100, ratio * 100)}%`,
                              background: ratio > 0.7 ? "#ef4444" : ratio > 0.4 ? "#f59e0b" : "#22c55e",
                            };
                          })()}
                        />
                      </div>
                      <span className="text-xs font-mono text-muted-foreground w-8 text-right">
                        {h.risk_score.toFixed(1)}
                      </span>
                    </div>
                  </div>
                ))}
          </div>
        </div>
      </div>

      {/* Recent events table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border flex-wrap gap-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Recent Events with ML Predictions</h2>
            <p className="text-xs text-muted-foreground">Latest 50 events · click column headers to sort</p>
          </div>
          <div className="flex gap-1">
            {["ALL", "HIGH", "MEDIUM", "LOW"].map((s) => (
              <button
                key={s}
                onClick={() => setSevFilter(s)}
                className={cn(
                  "px-3 py-1 text-xs rounded-md font-medium border transition-colors",
                  sevFilter === s
                    ? s === "HIGH"
                      ? "bg-red-400/15 text-red-400 border-red-400/30"
                      : s === "MEDIUM"
                      ? "bg-amber-400/15 text-amber-400 border-amber-400/30"
                      : s === "LOW"
                      ? "bg-green-400/15 text-green-400 border-green-400/30"
                      : "bg-primary/15 text-primary border-primary/30"
                    : "bg-muted text-muted-foreground border-border hover:text-foreground"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Cause</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Corridor</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Status</th>
                <th
                  className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => toggleSort("ml_severity")}
                >
                  <span className="flex items-center gap-1">Severity <SortIcon field="ml_severity" /></span>
                </th>
                <th
                  className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => toggleSort("ml_duration_pred")}
                >
                  <span className="flex items-center gap-1">Duration <SortIcon field="ml_duration_pred" /></span>
                </th>
                <th
                  className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => toggleSort("ml_closure_prob")}
                >
                  <span className="flex items-center gap-1">Closure Prob <SortIcon field="ml_closure_prob" /></span>
                </th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Zone</th>
              </tr>
            </thead>
            <tbody>
              {evLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/50">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-3 bg-muted rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : events.slice(0, 20).map((e: any, i: number) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-2.5 text-xs font-medium text-foreground capitalize">
                        {e.event_cause?.replace(/_/g, " ")}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-[120px] truncate">
                        {e.corridor}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium",
                          e.status === "active" ? "bg-blue-400/15 text-blue-400" : "bg-muted text-muted-foreground"
                        )}>
                          {e.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <SeverityBadge sev={e.ml_severity} />
                      </td>
                      <td className="px-4 py-2.5 text-xs font-mono text-foreground">
                        {e.ml_duration_pred?.toFixed(0)} min
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-12 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${(e.ml_closure_prob ?? 0) * 100}%`,
                                background: e.ml_closure_prob > 0.6 ? "#ef4444" : e.ml_closure_prob > 0.3 ? "#f59e0b" : "#22c55e",
                              }}
                            />
                          </div>
                          <span className="text-xs font-mono text-muted-foreground">
                            {((e.ml_closure_prob ?? 0) * 100).toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-[100px] truncate">
                        {e.zone || "—"}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-2 border-t border-border bg-muted/10">
          <p className="text-xs text-muted-foreground">
            Showing {Math.min(events.length, 20)} of {events.length} filtered events
            {sevFilter !== "ALL" && ` (filter: ${sevFilter})`}
          </p>
        </div>
      </div>
    </div>
  );
}
