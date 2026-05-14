import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { AppSidebar } from "@/components/AppSidebar";
import { StatusBadge } from "@/components/StatusBadge";
import { MapView } from "@/components/MapView";
import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import {
  FileText,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useReports } from "@/hooks/useReports";

type ReportStatus =
  | "pending"
  | "assigned"
  | "resolved"
  | "rejected"
  | "manual_review_required";

type CategoryFilter =
  | "Electricity"
  | "Water Supply"
  | "Sanitation"
  | "Roads"
  | "Uncategorized";

export const Route = createFileRoute("/")({
  component: DashboardRoute,
});

const COLORS: Record<ReportStatus, string> = {
  pending: "var(--color-status-pending)",
  assigned: "var(--color-status-assigned)",
  resolved: "var(--color-status-resolved)",
  rejected: "var(--color-status-rejected)",
  manual_review_required: "#a855f7",
};

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

function getPriorityStyle(priority?: string) {
  const p = priority?.toLowerCase().trim();

  if (p === "high") return "bg-red-100 text-red-700 ring-red-200";
  if (p === "medium") return "bg-yellow-100 text-yellow-700 ring-yellow-200";
  if (p === "low") return "bg-green-100 text-green-700 ring-green-200";

  return "bg-secondary text-secondary-foreground ring-border";
}

function getStatusLabel(status: ReportStatus, lang: string) {
  if (lang === "hi") {
    if (status === "pending") return "अनसुलझी";
    if (status === "assigned") return "सौंपी गई";
    if (status === "resolved") return "हल";
    if (status === "rejected") return "अस्वीकृत";
    if (status === "manual_review_required") return "मैनुअल समीक्षा आवश्यक";
  }

  if (status === "manual_review_required") return "Manual Review Required";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function DashboardRoute() {
  const { isAuthed, ready } = useAuth();

  if (!ready) return <div className="min-h-screen bg-background" />;
  if (!isAuthed) return <Navigate to="/login" />;

  return (
    <div className="min-h-screen flex bg-[linear-gradient(180deg,rgba(255,153,51,0.08)_0%,rgba(255,255,255,0.96)_48%,rgba(19,136,8,0.08)_100%)]">
      <AppSidebar />
      <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden">
        <DashboardPage />
      </main>
    </div>
  );
}

function DashboardPage() {
  const { t, lang } = useI18n();
  const { reports, loading } = useReports();

  const counts = useMemo(() => {
    const c = {
      pending: 0,
      assigned: 0,
      resolved: 0,
      rejected: 0,
      manual_review_required: 0,
      uncategorized: 0,
    };

    reports.forEach((r) => {
      const status = normalizeStatus(r.status);
      const category = normalizeCategory(r.category);

      c[status] += 1;

      if (category === "Uncategorized") {
        c.uncategorized += 1;
      }
    });

    return { ...c, total: reports.length };
  }, [reports]);

  const pieData = (
    [
      "pending",
      "assigned",
      "resolved",
      "rejected",
      "manual_review_required",
    ] as ReportStatus[]
  ).map((s) => ({
    name: getStatusLabel(s, lang),
    value: counts[s],
    status: s,
  }));

  const recent = [...reports]
    .sort((a, b) => {
      const aDate = a.createdAt?.toDate?.() || new Date(0);
      const bDate = b.createdAt?.toDate?.() || new Date(0);
      return +bDate - +aDate;
    })
    .slice(0, 6);

  const cards = [
    {
      key: "totalReports" as const,
      label: t("totalReports"),
      val: counts.total,
      icon: FileText,
      tone: "var(--color-brand-mid)",
    },
    {
      key: "pending" as const,
      label: lang === "hi" ? "अनसुलझी" : "Unresolved",
      val: counts.pending,
      icon: Clock,
      tone: "var(--color-status-pending)",
    },
    {
      key: "assigned" as const,
      label: t("assigned"),
      val: counts.assigned,
      icon: UserCheck,
      tone: "var(--color-status-assigned)",
    },
    {
      key: "resolved" as const,
      label: t("resolved"),
      val: counts.resolved,
      icon: CheckCircle2,
      tone: "var(--color-status-resolved)",
    },
    {
      key: "uncategorized" as const,
      label: lang === "hi" ? "मैनुअल वर्गीकरण" : "Manual Categorization",
      val: counts.uncategorized,
      icon: AlertTriangle,
      tone: "#a855f7",
    },
  ];

  if (loading) {
    return <div className="p-8 text-muted-foreground">Loading dashboard...</div>;
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1500px] mx-auto">
      <header>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {t("overview")}
        </p>
        <h1 className="text-2xl font-bold mt-1">{t("dashboard")}</h1>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-5">
        {cards.map((c) => (
          <div
            key={c.key}
            className="rounded-2xl bg-card border p-5 shadow-(--shadow-soft) hover:shadow-(--shadow-elev) transition group"
          >
            <div className="flex items-start justify-between">
              <div
                className="size-10 rounded-xl flex items-center justify-center"
                style={{
                  background: `color-mix(in oklab, ${c.tone} 15%, transparent)`,
                  color: c.tone,
                }}
              >
                <c.icon className="size-5" />
              </div>
            </div>

            <p className="mt-4 text-3xl font-bold tracking-tight">{c.val}</p>
            <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
          </div>
        ))}
      </section>

      <section className="grid lg:grid-cols-3 gap-6">
        <div className="rounded-2xl bg-card border shadow-(--shadow-soft) p-5 lg:col-span-1">
          <h3 className="font-semibold mb-1">{t("distribution")}</h3>
          <p className="text-xs text-muted-foreground mb-4">
            {lang === "hi" ? "स्थिति के अनुसार" : "By status"}
          </p>

          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
                stroke="none"
              >
                {pieData.map((d) => (
                  <Cell key={d.status} fill={COLORS[d.status]} />
                ))}
              </Pie>

              <Tooltip
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />

              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-2">
          <MapView />
        </div>
      </section>

      <section className="rounded-2xl bg-card border shadow-(--shadow-soft) overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-semibold">{t("recentReports")}</h3>

          <Link
            to="/reports"
            className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
          >
            {t("viewAll")} <ArrowUpRight className="size-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
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
              {recent.map((r, i) => {
                const normalizedStatus = normalizeStatus(r.status);
                const normalizedCategory = normalizeCategory(r.category);

                return (
                  <tr
                    key={r.id}
                    className={cn(
                      "border-t hover:bg-secondary/30 transition",
                      i % 2 && "bg-secondary/10"
                    )}
                  >
                    <td className="px-5 py-3 font-medium">
                      {r.citizenName || r.userId}
                    </td>

                    <td className="px-5 py-3">
                      <img
                        src={r.imageUrl}
                        alt=""
                        className="size-12 rounded-lg object-cover"
                      />
                    </td>

                    <td className="px-5 py-3 font-mono text-xs">
                      {r.location?.latitude ?? 0},{" "}
                      {r.location?.longitude ?? 0}
                    </td>

                    <td className="px-5 py-3">
                      <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium">
                        {getCategoryLabel(normalizedCategory, lang)}
                      </span>
                    </td>

                    <td className="px-5 py-3">
                      <StatusBadge status={normalizedStatus} />
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

                    <td className="px-5 py-3 text-muted-foreground">
                      {r.createdAt?.toDate?.().toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}