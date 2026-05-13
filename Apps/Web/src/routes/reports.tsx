import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { AppSidebar } from "@/components/AppSidebar";
import { useI18n } from "@/lib/i18n";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "@/firebase";
import { useReports } from "@/hooks/useReports";
import { StatusBadge, type ReportStatus } from "@/components/StatusBadge";
import { ReportDetailDialog } from "@/components/ReportDetailDialog";
import { MapView } from "@/components/MapView";
import { useMemo, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search, Eye, Filter, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/reports")({
  component: ReportsRoute,
  head: () => ({
    meta: [
      { title: "Reports — LokAwaaz" },
      {
        name: "description",
        content: "Browse and manage all civic issue reports.",
      },
    ],
  }),
});

type StatusFilter = "all" | ReportStatus;

type CategoryFilter =
  | "all"
  | "Electricity"
  | "Water Supply"
  | "Sanitation"
  | "Roads"
  | "Uncategorized";

type ReportItem = any;

const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: "All Status", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Assigned", value: "assigned" },
  { label: "Resolved", value: "resolved" },
  { label: "Rejected", value: "rejected" },
  { label: "Manual Review Required", value: "manual_review_required" },
];

const CATEGORY_FILTERS: { label: string; value: CategoryFilter }[] = [
  { label: "All Categories", value: "all" },
  { label: "Electricity", value: "Electricity" },
  { label: "Water Supply", value: "Water Supply" },
  { label: "Sanitation", value: "Sanitation" },
  { label: "Roads", value: "Roads" },
  { label: "Uncategorized", value: "Uncategorized" },
];

function normalizeStatus(status?: string): ReportStatus {
  const s = status?.toLowerCase().trim();

  if (s === "active" || s === "pending") return "pending";
  if (s === "assigned") return "assigned";
  if (s === "resolved") return "resolved";
  if (s === "rejected") return "rejected";

  if (
    s === "manual review required" ||
    s === "manual_review_required" ||
    s === "manual-review-required"
  ) {
    return "manual_review_required";
  }

  return "pending";
}

function normalizeCategory(category?: string): CategoryFilter {
  const c = category?.trim().toLowerCase();

  if (c === "electricity") return "Electricity";
  if (c === "water supply" || c === "watersupply") return "Water Supply";
  if (c === "sanitation") return "Sanitation";
  if (c === "roads" || c === "road") return "Roads";
  if (c === "uncategorized") return "Uncategorized";

  return "Uncategorized";
}

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

function ReportsPage() {
  const { t } = useI18n();
  const { reports: firestoreReports } = useReports();

  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [list, setList] = useState<ReportItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<ReportItem | null>(null);

  useEffect(() => {
    const mapped = firestoreReports.map((r) => ({
      ...r,
      image: r.imageUrl,
      originalStatus: r.status,
      status: normalizeStatus(r.status),
      normalizedCategory: normalizeCategory(r.category),
      createdAt: r.createdAt?.toDate?.() || new Date(),
      lat: r.location?.latitude ?? 0,
      lng: r.location?.longitude ?? 0,
    }));

    setList(mapped);
  }, [firestoreReports]);

  const filtered = useMemo(() => {
    return list.filter((r) => {
      const matchesStatus =
        statusFilter === "all" || r.status === statusFilter;

      const matchesCategory =
        categoryFilter === "all" || r.normalizedCategory === categoryFilter;

      const q = search.trim().toLowerCase();

      const matchesSearch =
        !q ||
        r.id?.toLowerCase?.().includes(q) ||
        r.userId?.toLowerCase?.().includes(q) ||
        r.citizenName?.toLowerCase?.().includes(q) ||
        r.category?.toLowerCase?.().includes(q) ||
        r.description?.toLowerCase?.().includes(q);

      return matchesStatus && matchesCategory && matchesSearch;
    });
  }, [list, statusFilter, categoryFilter, search]);

  const selectedVisibleCount = selectedReports.filter((id) =>
    filtered.some((r) => r.id === id)
  ).length;

  const onDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "grievances", id));
      setList((l) => l.filter((r) => r.id !== id));
      setSelectedReports((prev) => prev.filter((selectedId) => selectedId !== id));
      toast.success(t("reportDeleted"));
    } catch (error) {
      console.error("Error deleting report:", error);
      toast.error("Failed to delete report");
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedReports((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedVisibleCount === filtered.length && filtered.length > 0) {
      setSelectedReports((prev) =>
        prev.filter((id) => !filtered.some((r) => r.id === id))
      );
    } else {
      const filteredIds = filtered.map((r) => r.id);
      setSelectedReports((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const deleteSelectedReports = async () => {
    const idsToDelete = selectedReports.filter((id) =>
      list.some((r) => r.id === id)
    );

    if (idsToDelete.length === 0) {
      setSelectedReports([]);
      return;
    }

    const confirmDelete = window.confirm(
      `Delete ${idsToDelete.length} selected reports?`
    );

    if (!confirmDelete) return;

    try {
      await Promise.all(
        idsToDelete.map((id) => deleteDoc(doc(db, "grievances", id)))
      );

      setList((prev) => prev.filter((r) => !idsToDelete.includes(r.id)));
      setSelectedReports([]);
      toast.success("Selected reports deleted");
    } catch (error) {
      console.error("Error deleting reports:", error);
      toast.error("Failed to delete selected reports");
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1500px] mx-auto">
      <header>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {t("reports")}
        </p>
        <h1 className="text-2xl font-bold mt-1">{t("allReports")}</h1>
      </header>

      <MapView />

      <div className="rounded-2xl bg-card border shadow-(--shadow-soft) overflow-hidden">
        <div className="p-4 border-b bg-card">
          <div className="grid gap-3 xl:grid-cols-[1fr_230px_250px_auto]">
            <div className="relative">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search reports..."
                className="pl-9 h-11 rounded-xl"
              />
            </div>

            <div className="relative">
              <Filter className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="h-11 w-full appearance-none rounded-xl border bg-background pl-9 pr-4 text-sm font-medium outline-none transition focus:ring-2 focus:ring-primary"
              >
                {STATUS_FILTERS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Tag className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />

              <select
                value={categoryFilter}
                onChange={(e) =>
                  setCategoryFilter(e.target.value as CategoryFilter)
                }
                className="h-11 w-full appearance-none rounded-xl border bg-background pl-9 pr-4 text-sm font-medium outline-none transition focus:ring-2 focus:ring-primary"
              >
                {CATEGORY_FILTERS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleSelectAll}
                disabled={filtered.length === 0}
                className="h-11 rounded-xl bg-secondary px-4 text-sm font-medium text-secondary-foreground transition hover:bg-secondary/70 disabled:opacity-50"
              >
                {selectedVisibleCount === filtered.length && filtered.length > 0
                  ? "Unselect All"
                  : "Select All"}
              </button>

              {selectedReports.length > 0 && (
                <button
                  onClick={deleteSelectedReports}
                  className="h-11 rounded-xl bg-red-600 px-4 text-sm font-medium text-white transition hover:bg-red-700"
                >
                  Delete ({selectedReports.length})
                </button>
              )}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-secondary px-3 py-1">
              Showing {filtered.length} of {list.length} reports
            </span>

            {statusFilter !== "all" && (
              <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">
                Status:{" "}
                {
                  STATUS_FILTERS.find((item) => item.value === statusFilter)
                    ?.label
                }
              </span>
            )}

            {categoryFilter !== "all" && (
              <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">
                Category: {categoryFilter}
              </span>
            )}

            {selectedReports.length > 0 && (
              <span className="rounded-full bg-red-50 px-3 py-1 text-red-600">
                Selected: {selectedReports.length}
              </span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-3">Select</th>
                <th className="text-left px-5 py-3">ID</th>
                <th className="text-left px-5 py-3">{t("user")}</th>
                <th className="text-left px-5 py-3">{t("image")}</th>
                <th className="text-left px-5 py-3">{t("location")}</th>
                <th className="text-left px-5 py-3">Category</th>
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
                    i % 2 && "bg-secondary/10"
                  )}
                >
                  <td className="px-5 py-3">
                    <input
                      type="checkbox"
                      checked={selectedReports.includes(r.id)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => toggleSelect(r.id)}
                      className="h-4 w-4 cursor-pointer"
                    />
                  </td>

                  <td className="px-5 py-3 font-mono text-xs font-semibold">
                    {r.id}
                  </td>

                  <td className="px-5 py-3">{r.citizenName || r.userId}</td>

                  <td className="px-5 py-3">
                    <img
                      src={r.image}
                      alt=""
                      className="size-12 rounded-lg object-cover"
                    />
                  </td>

                  <td className="px-5 py-3 font-mono text-xs">
                    {r.lat}, {r.lng}
                  </td>

                  <td className="px-5 py-3">
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium">
                      {r.normalizedCategory}
                    </span>
                  </td>

                  <td className="px-5 py-3">
                    <StatusBadge status={r.status} />
                  </td>

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
                      <Eye className="size-3.5" />
                      View
                    </button>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="text-center py-12 text-muted-foreground text-sm"
                  >
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