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
import {
  Search,
  Filter,
  Tag,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
} from "lucide-react";
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

type PrioritySort = "desc" | "asc";

type ReportItem = any;

const getStatusFilters = (
  lang: string
): { label: string; value: StatusFilter }[] => [
  { label: lang === "hi" ? "सभी स्थिति" : "All Status", value: "all" },
  { label: lang === "hi" ? "अनसुलझी" : "Unresolved", value: "pending" },
  { label: lang === "hi" ? "सौंपी गई" : "Assigned", value: "assigned" },
  { label: lang === "hi" ? "हल" : "Resolved", value: "resolved" },
  { label: lang === "hi" ? "अस्वीकृत" : "Rejected", value: "rejected" },
  {
    label: lang === "hi" ? "मैनुअल समीक्षा आवश्यक" : "Manual Review Required",
    value: "manual_review_required",
  },
];

const getCategoryFilters = (
  lang: string
): { label: string; value: CategoryFilter }[] => [
  { label: lang === "hi" ? "सभी श्रेणियां" : "All Categories", value: "all" },
  { label: lang === "hi" ? "बिजली" : "Electricity", value: "Electricity" },
  {
    label: lang === "hi" ? "जल आपूर्ति" : "Water Supply",
    value: "Water Supply",
  },
  { label: lang === "hi" ? "स्वच्छता" : "Sanitation", value: "Sanitation" },
  { label: lang === "hi" ? "सड़कें" : "Roads", value: "Roads" },
  {
    label: lang === "hi" ? "अवर्गीकृत" : "Uncategorized",
    value: "Uncategorized",
  },
];

function getCategoryLabel(category: string, lang: string) {
  if (lang !== "hi") return category;

  if (category === "Electricity") return "बिजली";
  if (category === "Water Supply") return "जल आपूर्ति";
  if (category === "Sanitation") return "स्वच्छता";
  if (category === "Roads") return "सड़कें";
  if (category === "Uncategorized") return "अवर्गीकृत";

  return category;
}

function getPriorityLabel(priority?: string, lang?: string) {
  const p = priority?.toLowerCase().trim();

  if (lang !== "hi") return priority || "N/A";

  if (p === "high") return "उच्च";
  if (p === "medium") return "मध्यम";
  if (p === "low") return "निम्न";

  return "N/A";
}

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

function getPriorityValue(priority?: string) {
  const p = priority?.toLowerCase().trim();

  if (p === "high") return 3;
  if (p === "medium") return 2;
  if (p === "low") return 1;

  return 0;
}

function getPriorityStyle(priority?: string) {
  const p = priority?.toLowerCase().trim();

  if (p === "high") return "bg-red-100 text-red-700 ring-red-200";
  if (p === "medium") return "bg-yellow-100 text-yellow-700 ring-yellow-200";
  if (p === "low") return "bg-green-100 text-green-700 ring-green-200";

  return "bg-secondary text-secondary-foreground ring-border";
}

function ReportsRoute() {
  const { isAuthed, ready } = useAuth();

  if (!ready) return <div className="min-h-screen bg-background" />;
  if (!isAuthed) return <Navigate to="/login" />;

  return (
    <div className="min-h-screen flex bg-[linear-gradient(180deg,rgba(255,153,51,0.08)_0%,rgba(255,255,255,0.96)_48%,rgba(19,136,8,0.08)_100%)]">
      <AppSidebar />

      <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden">
        <ReportsPage />
      </main>
    </div>
  );
}

function ReportsPage() {
  const { t, lang } = useI18n();
  const { reports: firestoreReports } = useReports();

  const statusFilters = getStatusFilters(lang);
  const categoryFilters = getCategoryFilters(lang);

  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [list, setList] = useState<ReportItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [prioritySort, setPrioritySort] = useState<PrioritySort>("desc");
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<ReportItem | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "map">("table");

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
    const filteredList = list.filter((r) => {
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

    return [...filteredList].sort((a, b) => {
      const aPriority = getPriorityValue(a.priority);
      const bPriority = getPriorityValue(b.priority);

      return prioritySort === "desc"
        ? bPriority - aPriority
        : aPriority - bPriority;
    });
  }, [list, statusFilter, categoryFilter, prioritySort, search]);

  const selectedVisibleCount = selectedReports.filter((id) =>
    filtered.some((r) => r.id === id)
  ).length;

  const onDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "grievances", id));
      setList((l) => l.filter((r) => r.id !== id));
      setSelectedReports((prev) =>
        prev.filter((selectedId) => selectedId !== id)
      );
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
    if (filtered.length === 0) return;

    if (selectedVisibleCount === filtered.length) {
      setSelectedReports((prev) =>
        prev.filter((id) => !filtered.some((r) => r.id === id))
      );
    } else {
      const filteredIds = filtered.map((r) => r.id);
      setSelectedReports((prev) =>
        Array.from(new Set([...prev, ...filteredIds]))
      );
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
      lang === "hi"
        ? `${idsToDelete.length} चुनी गई रिपोर्ट हटाएं?`
        : `Delete ${idsToDelete.length} selected reports?`
    );

    if (!confirmDelete) return;

    try {
      await Promise.all(
        idsToDelete.map((id) => deleteDoc(doc(db, "grievances", id)))
      );

      setList((prev) => prev.filter((r) => !idsToDelete.includes(r.id)));
      setSelectedReports([]);
      toast.success(
        lang === "hi" ? "चुनी गई रिपोर्ट हटाई गईं" : "Selected reports deleted"
      );
    } catch (error) {
      console.error("Error deleting reports:", error);
      toast.error(
        lang === "hi"
          ? "चुनी गई रिपोर्ट हटाने में समस्या हुई"
          : "Failed to delete selected reports"
      );
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

      <div className="inline-flex rounded-xl border bg-card p-1 shadow-sm mb-6">
        <button
          onClick={() => setViewMode("table")}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-medium transition",
            viewMode === "table"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          )}
        >
          {lang === "hi" ? "तालिका" : "Table"}
        </button>

        <button
          onClick={() => setViewMode("map")}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-medium transition",
            viewMode === "map"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          )}
        >
          {lang === "hi" ? "मानचित्र" : "Map"}
        </button>
      </div>

      {viewMode === "map" && (
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <MapView />
        </div>
      )}

      {viewMode === "table" && (
        <div className="rounded-2xl bg-card border shadow-(--shadow-soft) overflow-hidden">
          <div className="p-4 border-b bg-card">
            <div className="flex flex-col gap-3">
              <div className="grid gap-3 xl:grid-cols-[minmax(260px,1fr)_230px_250px_auto]">
                <div className="relative">
                  <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />

                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={
                      lang === "hi" ? "रिपोर्ट खोजें..." : "Search reports..."
                    }
                    className="pl-9 h-11 rounded-xl"
                  />
                </div>

                <div className="relative">
                  <Filter className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />

                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(e.target.value as StatusFilter)
                    }
                    className="h-11 w-full appearance-none rounded-xl border bg-background pl-9 pr-4 text-sm font-medium outline-none transition focus:ring-2 focus:ring-primary"
                  >
                    {statusFilters.map((item) => (
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
                    {categoryFilters.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() =>
                      setPrioritySort((prev) =>
                        prev === "desc" ? "asc" : "desc"
                      )
                    }
                    className="h-11 w-11 shrink-0 rounded-xl border bg-background flex items-center justify-center transition hover:bg-secondary/50"
                    title={
                      prioritySort === "desc"
                        ? lang === "hi"
                          ? "प्राथमिकता: उच्च से निम्न"
                          : "Priority: High to Low"
                        : lang === "hi"
                          ? "प्राथमिकता: निम्न से उच्च"
                          : "Priority: Low to High"
                    }
                  >
                    {prioritySort === "desc" ? (
                      <ArrowDownWideNarrow className="size-4" />
                    ) : (
                      <ArrowUpNarrowWide className="size-4" />
                    )}
                  </button>

                  <button
                    onClick={toggleSelectAll}
                    disabled={filtered.length === 0}
                    className="h-11 whitespace-nowrap rounded-xl bg-secondary px-4 text-sm font-medium text-secondary-foreground transition hover:bg-secondary/70 disabled:opacity-50"
                  >
                    {selectedVisibleCount === filtered.length &&
                    filtered.length > 0
                      ? lang === "hi"
                        ? "सभी हटाएं"
                        : "Unselect All"
                      : lang === "hi"
                        ? "सभी चुनें"
                        : "Select All"}
                  </button>

                  {selectedReports.length > 0 && (
                    <button
                      onClick={deleteSelectedReports}
                      className="h-11 whitespace-nowrap rounded-xl bg-red-600 px-4 text-sm font-medium text-white transition hover:bg-red-700"
                    >
                      {lang === "hi"
                        ? `हटाएं (${selectedReports.length})`
                        : `Delete (${selectedReports.length})`}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex h-9 items-center rounded-full bg-secondary px-4 text-muted-foreground">
                  {lang === "hi"
                    ? `${list.length} में से ${filtered.length} रिपोर्ट`
                    : `Showing ${filtered.length} of ${list.length} reports`}
                </span>

                {statusFilter !== "all" && (
                  <span className="inline-flex h-9 items-center rounded-full bg-primary/10 px-4 text-primary">
                    {lang === "hi" ? "स्थिति:" : "Status:"}{" "}
                    {
                      statusFilters.find((item) => item.value === statusFilter)
                        ?.label
                    }
                  </span>
                )}

                {categoryFilter !== "all" && (
                  <span className="inline-flex h-9 items-center rounded-full bg-primary/10 px-4 text-primary">
                    {lang === "hi" ? "श्रेणी:" : "Category:"}{" "}
                    {getCategoryLabel(categoryFilter, lang)}
                  </span>
                )}

                <span className="inline-flex h-9 items-center rounded-full bg-secondary px-4 text-muted-foreground">
                  {lang === "hi" ? "प्राथमिकता:" : "Priority:"}{" "}
                  {prioritySort === "desc"
                    ? lang === "hi"
                      ? "उच्च से निम्न"
                      : "High to Low"
                    : lang === "hi"
                      ? "निम्न से उच्च"
                      : "Low to High"}
                </span>

                {selectedReports.length > 0 && (
                  <span className="inline-flex h-9 items-center rounded-full bg-red-50 px-4 text-red-600">
                    {lang === "hi"
                      ? `चयनित: ${selectedReports.length}`
                      : `Selected: ${selectedReports.length}`}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-5 py-3">
                    {lang === "hi" ? "चयन" : "Select"}
                  </th>
                  <th className="text-left px-5 py-3">ID</th>
                  <th className="text-left px-5 py-3">{t("user")}</th>
                  <th className="text-left px-5 py-3">{t("image")}</th>
                  <th className="text-left px-5 py-3">{t("location")}</th>
                  <th className="text-left px-5 py-3">
                    {lang === "hi" ? "श्रेणी" : "Category"}
                  </th>
                  <th className="text-left px-5 py-3">{t("status")}</th>
                  <th className="text-left px-5 py-3">
                    {lang === "hi" ? "प्राथमिकता" : "Priority"}
                  </th>
                  <th className="text-left px-5 py-3">{t("dateTime")}</th>
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
                        {getCategoryLabel(r.normalizedCategory, lang)}
                      </span>
                    </td>

                    <td className="px-5 py-3">
                      <StatusBadge status={r.status} />
                    </td>

                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
                          getPriorityStyle(r.priority)
                        )}
                      >
                        {getPriorityLabel(r.priority, lang)}
                      </span>
                    </td>

                    <td className="px-5 py-3 text-muted-foreground text-xs">
                      {new Date(r.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="text-center py-12 text-muted-foreground text-sm"
                    >
                      {lang === "hi"
                        ? "इन फिल्टर से कोई रिपोर्ट नहीं मिली।"
                        : "No reports match your filters."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ReportDetailDialog
        report={active}
        onClose={() => setActive(null)}
        onDelete={onDelete}
      />
    </div>
  );
}