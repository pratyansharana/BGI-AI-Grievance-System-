import type { ReportStatus } from "@/lib/mockData";
import { useI18n, type TKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const styles: Record<ReportStatus, string> = {
  pending: "bg-[color:var(--color-status-pending)]/15 text-[color:var(--color-status-pending)] ring-[color:var(--color-status-pending)]/30",
  assigned: "bg-[color:var(--color-status-assigned)]/15 text-[color:var(--color-status-assigned)] ring-[color:var(--color-status-assigned)]/30",
  resolved: "bg-[color:var(--color-status-resolved)]/15 text-[color:var(--color-status-resolved)] ring-[color:var(--color-status-resolved)]/30",
  rejected: "bg-[color:var(--color-status-rejected)]/15 text-[color:var(--color-status-rejected)] ring-[color:var(--color-status-rejected)]/30",
};

export function StatusBadge({ status, className }: { status: ReportStatus; className?: string }) {
  const { t } = useI18n();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset capitalize",
        styles[status],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {t(status as TKey)}
    </span>
  );
}
