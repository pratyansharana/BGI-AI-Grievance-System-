import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { AppSidebar } from "@/components/AppSidebar";
import { useI18n } from "@/lib/i18n";
import { useReports } from "@/hooks/useReports";
type ReportStatus =
  | "pending"
  | "assigned"
  | "resolved"
  | "rejected";
import { StatusBadge } from "@/components/StatusBadge";
import { ReportDetailDialog } from "@/components/ReportDetailDialog";
import { MapView } from "@/components/MapView";
import { useMemo, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/reports")({
  component: ReportsRoute,
  head: () => ({
    meta: [
      { title: "Reports — LokAwaaz" },
      { name: "description", content: "Browse and manage all civic issue reports." },
    ],
  }),
});

function ReportsRoute() {
  const { isAuthed, ready } = useAuth();
  if (!ready) return <div className="min-h-screen bg-background" />;
  if (!isAuthed) return <Navigate to="/login" />;
  return (
    <div className="min-h-screen flex bg-background">
      <AppSidebar />
      <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden">
        <ReportsPage />
      </main>
    </div>
  );
}

const FILTERS: ("all" | ReportStatus)[] = ["all", "pending", "assigned", "resolved", "rejected"];

function ReportsPage() {
  const { t } = useI18n();
  const { reports: firestoreReports } = useReports();
  const [list, setList] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | ReportStatus>("all");
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<Report | null>(null);
  useEffect(() => {
    const mapped = firestoreReports.map((r) => ({
      ...r,
      image: r.imageUrl,
      originalStatus: r.status,
      status:
        r.status?.toLowerCase() === "active"
          ? "pending"
          : r.status?.toLowerCase(),
      createdAt: r.createdAt?.toDate?.() || new Date(),
      lat: r.location?.latitude || 0,
      lng: r.location?.longitude || 0,
    }));

    setList(mapped);
  }, [firestoreReports]);

  const filtered = useMemo(() => {
    return list.filter((r) => {
      const matchesStatus = filter === "all" || r.status === filter;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        r.id.toLowerCase().includes(q) ||
        r.userId.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [list, filter, search]);

  const onDelete = (id: string) => {
    setList((l) => l.filter((r) => r.id !== id));
    toast.success(t("reportDeleted"));
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1500px] mx-auto">
      <header>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("reports")}</p>
        <h1 className="text-2xl font-bold mt-1">{t("allReports")}</h1>
      </header>

      <MapView />

      <div className="rounded-2xl bg-card border shadow-(--shadow-soft) overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("search")}
              className="pl-9 h-10"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition capitalize",
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

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-3">ID</th>
                <th className="text-left px-5 py-3">{t("user")}</th>
                <th className="text-left px-5 py-3">{t("image")}</th>
                <th className="text-left px-5 py-3">{t("location")}</th>
                <th className="text-left px-5 py-3">{t("status")}</th>
                <th className="text-left px-5 py-3">{t("dateTime")}</th>
                <th className="text-right px-5 py-3">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr
                  key={r.id}
                  onClick={() => setActive(r)}
                  className={cn(
                    "border-t hover:bg-secondary/30 transition cursor-pointer",
                    i % 2 && "bg-secondary/10",
                  )}
                >
                  <td className="px-5 py-3 font-mono text-xs font-semibold">{r.id}</td>
                  <td className="px-5 py-3">{r.userId}</td>
                  <td className="px-5 py-3">
                    <img src={r.image} alt="" className="size-12 rounded-lg object-cover" />
                  </td>
                  <td className="px-5 py-3 font-mono text-xs">{r.lat}, {r.lng}</td>
                  <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-5 py-3 text-muted-foreground text-xs">
                    {new Date(r.createdAt).toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActive(r);
                      }}
                      className="inline-flex items-center gap-1 text-primary hover:underline text-xs font-medium"
                    >
                      <Eye className="size-3.5" /> View
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground text-sm">
                    No reports match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ReportDetailDialog
        report={active}
        onClose={() => setActive(null)}
        onDelete={onDelete}
      />
    </div>
  );
}
