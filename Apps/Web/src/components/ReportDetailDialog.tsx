import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import { useI18n } from "@/lib/i18n";
import { getWorker } from "@/lib/mockData";
import {
  Calendar,
  MapPin,
  ThumbsUp,
  Trash2,
  User,
  Radio,
  FileText,
  Tag,
  Flag,
  BadgeInfo,
  Hash,
} from "lucide-react";

interface Props {
  report: any;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export function ReportDetailDialog({ report, onClose, onDelete }: Props) {
  const { t } = useI18n();

  if (!report) return null;

  const worker = report.workerId ? getWorker(report.workerId) : null;

  const image = report.image || report.imageUrl;
  const user = report.citizenName || report.userId;
  const firestoreStatus = report.originalStatus || report.firestoreStatus || report.status || "N/A";
  const priority = report.priority || "N/A";
  const category = report.category || "N/A";
  const description = report.description || "N/A";
  const date =
    report.createdAt?.toLocaleString?.() ||
    report.createdAt?.toDate?.()?.toLocaleString?.() ||
    "N/A";

  return (
    <Dialog open={!!report} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4 pr-6">
            <div>
              <DialogTitle className="text-xl">
                {report.id} · {report.category}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {report.description}
              </DialogDescription>
            </div>
            <StatusBadge status={report.status} />
          </div>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-5 mt-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              {t("image")}
            </p>
            <img
              src={image}
              alt={report.category}
              className="w-full h-56 object-cover rounded-xl border"
            />
          </div>

          <div className="space-y-3 text-sm">
            <Row icon={<Hash className="size-4" />} label="Report ID" value={report.id} />

            <Row icon={<User className="size-4" />} label="Citizen Name" value={user} />

            <Row icon={<BadgeInfo className="size-4" />} label="User ID" value={report.userId || "N/A"} />

            <Row icon={<Tag className="size-4" />} label="Category" value={category} />

            <Row icon={<Flag className="size-4" />} label="Priority" value={priority} />

            <Row icon={<FileText className="size-4" />} label="Firestore Status" value={firestoreStatus} />

            <Row
              icon={<MapPin className="size-4" />}
              label={t("coordinates")}
              value={`${report.lat || 0}, ${report.lng || 0}`}
            />

            <Row
              icon={<Calendar className="size-4" />}
              label={t("submitted")}
              value={date}
            />

            <Row
              icon={<ThumbsUp className="size-4" />}
              label={t("upvotes")}
              value={`${report.upvotes || 0}`}
            />
          </div>
        </div>
        <section className="mt-5 rounded-xl border bg-secondary/30 p-4">
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <FileText className="size-4 text-primary" />
            Full Description
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </section>

        <section className="mt-5 rounded-xl border bg-secondary/40 p-4">
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Radio className="size-4 text-primary" />
            {t("workerAssignment")}
          </h4>

          {worker ? (
            <div className="flex items-center gap-4">
              <img
                src={worker.avatar}
                alt={worker.name}
                className="size-14 rounded-full ring-2 ring-white"
              />
              <div className="flex-1">
                <p className="font-medium">{worker.name}</p>
                <p className="text-xs text-muted-foreground">
                  {worker.id} · {worker.contact}
                </p>
                <p className="text-xs mt-1">
                  <span className="text-muted-foreground">{t("liveLocation")}: </span>
                  <span className="font-mono">
                    {worker.lat}, {worker.lng}
                  </span>
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("noWorker")}</p>
          )}
        </section>

        <section className="mt-4">
          <h4 className="font-semibold text-sm mb-2">{t("completionProof")}</h4>
          {report.proofImage ? (
            <img
              src={report.proofImage}
              alt="proof"
              className="w-full h-48 object-cover rounded-xl border"
            />
          ) : (
            <div className="h-32 rounded-xl border-2 border-dashed flex items-center justify-center text-sm text-muted-foreground">
              {t("noProof")}
            </div>
          )}
        </section>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            {t("close")}
          </Button>

          <Button
            variant="destructive"
            onClick={() => {
              if (confirm(t("confirmDelete"))) {
                onDelete(report.id);
                onClose();
              }
            }}
          >
            <Trash2 className="size-4" />
            {t("deleteReport")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-primary">{icon}</span>
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}