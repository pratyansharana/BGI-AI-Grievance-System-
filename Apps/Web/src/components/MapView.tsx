import { reports } from "@/lib/mockData";
import type { ReportStatus } from "@/lib/mockData";
import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { MapPin } from "lucide-react";

const COLORS: Record<ReportStatus, string> = {
  pending: "var(--color-status-pending)",
  assigned: "var(--color-status-assigned)",
  resolved: "var(--color-status-resolved)",
  rejected: "var(--color-status-rejected)",
};

const FILTERS: ("all" | ReportStatus)[] = ["all", "resolved", "assigned", "pending"];

export function MapView() {
  const { t } = useI18n();
  const [filter, setFilter] = useState<"all" | ReportStatus>("all");

  const filtered = useMemo(
    () => (filter === "all" ? reports : reports.filter((r) => r.status === filter)),
    [filter],
  );

  // Project lat/lng to 0..100% within visible bounds
  const lats = reports.map((r) => r.lat);
  const lngs = reports.map((r) => r.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);

  return (
    <div className="rounded-2xl border bg-card shadow-(--shadow-soft) overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b">
        <div className="flex items-center gap-2">
          <MapPin className="size-4 text-primary" />
          <h3 className="font-semibold">{t("mapView")}</h3>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition",
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/70",
              )}
            >
              {t(f === "all" ? "all" : f)}
            </button>
          ))}
        </div>
      </div>

      <div className="relative h-[420px] bg-[radial-gradient(circle_at_30%_20%,oklch(0.92_0.022_255),oklch(0.97_0.005_255))]">
        {/* grid */}
        <svg className="absolute inset-0 size-full opacity-40" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="oklch(0.55 0.11 255 / 0.15)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* roads */}
        <svg className="absolute inset-0 size-full" preserveAspectRatio="none" viewBox="0 0 100 100">
          <path d="M0,30 Q40,40 100,25" stroke="oklch(0.55 0.11 255 / 0.25)" strokeWidth="0.6" fill="none" />
          <path d="M20,0 Q30,50 25,100" stroke="oklch(0.55 0.11 255 / 0.25)" strokeWidth="0.6" fill="none" />
          <path d="M0,70 Q50,60 100,80" stroke="oklch(0.55 0.11 255 / 0.25)" strokeWidth="0.6" fill="none" />
          <path d="M70,0 Q60,50 80,100" stroke="oklch(0.55 0.11 255 / 0.25)" strokeWidth="0.6" fill="none" />
        </svg>

        {filtered.map((r) => {
          const x = ((r.lng - minLng) / (maxLng - minLng || 1)) * 88 + 6;
          const y = (1 - (r.lat - minLat) / (maxLat - minLat || 1)) * 80 + 8;
          return (
            <div
              key={r.id}
              className="absolute -translate-x-1/2 -translate-y-full group cursor-pointer"
              style={{ left: `${x}%`, top: `${y}%` }}
              title={`${r.id} • ${r.category}`}
            >
              <div className="relative">
                <div
                  className="size-3.5 rounded-full ring-2 ring-white shadow-md animate-pulse"
                  style={{ background: COLORS[r.status] }}
                />
                <div className="opacity-0 group-hover:opacity-100 transition absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[color:var(--color-brand-deep)] text-white text-xs px-2 py-1 shadow-lg">
                  {r.id} · {r.category}
                </div>
              </div>
            </div>
          );
        })}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 flex flex-wrap gap-3 rounded-lg bg-white/85 backdrop-blur px-3 py-2 text-xs shadow">
          {(["resolved", "assigned", "pending", "rejected"] as ReportStatus[]).map((s) => (
            <div key={s} className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full" style={{ background: COLORS[s] }} />
              <span className="capitalize text-foreground/70">{t(s)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
