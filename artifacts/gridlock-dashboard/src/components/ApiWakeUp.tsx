import { useEffect, useState } from "react";
import { Loader2, Wifi, WifiOff, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "checking" | "waking" | "online" | "offline";

export default function ApiWakeUp() {
  const [status, setStatus] = useState<Status>("checking");
  const [elapsed, setElapsed] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let attempts = 0;
    let timer: ReturnType<typeof setInterval>;
    let elapsedTimer: ReturnType<typeof setInterval>;
    let dismissed = false;

    async function ping() {
      try {
        const res = await fetch("/api/healthz", { signal: AbortSignal.timeout(4000) });
        if (res.ok) {
          setStatus("online");
          clearInterval(timer);
          clearInterval(elapsedTimer);
          setTimeout(() => {
            if (!dismissed) setVisible(false);
          }, 2500);
          return;
        }
      } catch {
        // still waking
      }
      attempts++;
      if (attempts === 1) setStatus("waking");
      if (attempts > 30) {
        setStatus("offline");
        clearInterval(timer);
        clearInterval(elapsedTimer);
      }
    }

    ping();
    timer = setInterval(ping, 3000);
    elapsedTimer = setInterval(() => setElapsed((e) => e + 1), 1000);

    return () => {
      dismissed = true;
      clearInterval(timer);
      clearInterval(elapsedTimer);
    };
  }, []);

  if (!visible) return null;

  if (status === "checking") {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-muted/60 border-b border-border text-xs text-muted-foreground">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Connecting to API server…
      </div>
    );
  }

  if (status === "waking") {
    const pct = Math.min(100, Math.round((elapsed / 45) * 100));
    return (
      <div className="px-4 py-2.5 bg-amber-950/40 border-b border-amber-500/30 space-y-1.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-amber-300 font-medium">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            API server is waking up (Render free tier)… {elapsed}s
          </div>
          <span className="text-xs text-amber-400/70 font-mono">{pct}%</span>
        </div>
        <div className="h-1 rounded-full bg-amber-950 overflow-hidden">
          <div
            className="h-full rounded-full bg-amber-400 transition-all duration-1000"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-amber-400/60">
          Dashboard data will appear automatically once connected — usually within 30–45 seconds.
        </p>
      </div>
    );
  }

  if (status === "offline") {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 bg-red-950/40 border-b border-red-500/30 text-xs text-red-300">
        <WifiOff className="w-3.5 h-3.5 flex-shrink-0" />
        <span>
          Cannot reach the API server. Make sure it is running on port 5000 (locally) or check your Render deployment logs.
        </span>
      </div>
    );
  }

  if (status === "online") {
    return (
      <div className={cn(
        "flex items-center gap-2 px-4 py-2 border-b border-green-500/20 bg-green-950/30 text-xs text-green-400 transition-opacity duration-700",
      )}>
        <CheckCircle2 className="w-3.5 h-3.5" />
        API server connected — all data live
      </div>
    );
  }

  return null;
}
