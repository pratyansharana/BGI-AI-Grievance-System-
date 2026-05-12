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
  XCircle,
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

function getStatusLabel(status: ReportStatus) {
  if (status === "manual_review_required") return "Manual Review Required";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function DashboardRoute() {
  const { isAuthed, ready } = useAuth();

  if (!ready) return <div className="min-h-screen bg-background" />;
  if (!isAuthed) return <Navigate to="/login" />;

  return (
    <div className="min-h-screen flex bg-background">
      <AppSidebar />
      <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden">
        <DashboardPage />
      </main>
    </div>
  );
}

function DashboardPage() {
  const { t } = useI18n();
  const { reports, loading } = useReports();

  const counts = useMemo(() => {
    const c = {
      pending: 0,
      assigned: 0,
      resolved: 0,
      rejected: 0,
      manual_review_required: 0,
    };

    reports.forEach((r) => {
      const status = normalizeStatus(r.status);
      c[status] += 1;
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
    name: getStatusLabel(s),
    value: counts[s],
    status: s,
  }));

  const recent = [...reports]
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
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
      label: t("pending"),
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
      key: "rejected" as const,
      label: t("rejected"),
      val: counts.rejected,
      icon: XCircle,
      tone: "var(--color-status-rejected)",
    },
    {
      key: "manual_review_required" as const,
      label: "Manual Review Required",
      val: counts.manual_review_required,
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

      <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
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
              <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-primary transition" />
            </div>

            <p className="mt-4 text-3xl font-bold tracking-tight">{c.val}</p>
            <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
          </div>
        ))}
      </section>

      <section className="grid lg:grid-cols-3 gap-6">
        <div className="rounded-2xl bg-card border shadow-(--shadow-soft) p-5 lg:col-span-1">
          <h3 className="font-semibold mb-1">{t("distribution")}</h3>
          <p className="text-xs text-muted-foreground mb-4">By status</p>

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
                <th className="text-left px-5 py-3">{t("status")}</th>
                <th className="text-left px-5 py-3">{t("dateTime")}</th>
              </tr>
            </thead>

            <tbody>
{recent.map((r, i) => {
  const normalizedStatus = normalizeStatus(r.status);

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
        <StatusBadge status={normalizedStatus} />
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