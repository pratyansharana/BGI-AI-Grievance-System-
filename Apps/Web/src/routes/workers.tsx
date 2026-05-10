import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { AppSidebar } from "@/components/AppSidebar";
import { useI18n } from "@/lib/i18n";
import { workers, reports } from "@/lib/mockData";
import { Phone, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/workers")({
  component: WorkersRoute,
  head: () => ({
    meta: [
      { title: "Workers — LokAwaaz" },
      { name: "description", content: "Field staff directory and assignments." },
    ],
  }),
});

function WorkersRoute() {
  const { isAuthed, ready } = useAuth();
  if (!ready) return <div className="min-h-screen bg-background" />;
  if (!isAuthed) return <Navigate to="/login" />;
  return (
    <div className="min-h-screen flex bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-x-hidden">
        <WorkersPage />
      </main>
    </div>
  );
}

const statusStyles: Record<string, string> = {
  available: "bg-[color:var(--color-status-resolved)]/15 text-[color:var(--color-status-resolved)] ring-[color:var(--color-status-resolved)]/30",
  busy: "bg-[color:var(--color-status-pending)]/15 text-[color:var(--color-status-pending)] ring-[color:var(--color-status-pending)]/30",
  offline: "bg-muted text-muted-foreground ring-border",
};

function WorkersPage() {
  const { t } = useI18n();

  const liveCounts = workers.map((w) => ({
    ...w,
    liveAssigned: reports.filter((r) => r.workerId === w.id && r.status === "assigned").length,
  }));

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1500px] mx-auto">
      <header>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("workers")}</p>
        <h1 className="text-2xl font-bold mt-1">{t("workerDirectory")}</h1>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {liveCounts.map((w) => (
          <div
            key={w.id}
            className="rounded-2xl bg-card border p-5 shadow-(--shadow-soft) hover:shadow-(--shadow-elev) transition"
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <img src={w.avatar} alt={w.name} className="size-14 rounded-full object-cover ring-2 ring-secondary" />
                <span
                  className={cn(
                    "absolute bottom-0 right-0 size-3.5 rounded-full ring-2 ring-card",
                    w.status === "available" && "bg-[color:var(--color-status-resolved)]",
                    w.status === "busy" && "bg-[color:var(--color-status-pending)]",
                    w.status === "offline" && "bg-muted-foreground/60",
                  )}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{w.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{w.id}</p>
              </div>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset capitalize",
                  statusStyles[w.status],
                )}
              >
                {t(w.status as never)}
              </span>
            </div>

            <div className="mt-5 space-y-2.5 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="size-4" />
                <span>{w.contact}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Briefcase className="size-4" />
                <span>
                  <span className="font-semibold text-foreground">{w.activeTasks}</span> {t("activeTasks")}
                </span>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{t("liveLocation")}</span>
              <span className="font-mono">{w.lat}, {w.lng}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
