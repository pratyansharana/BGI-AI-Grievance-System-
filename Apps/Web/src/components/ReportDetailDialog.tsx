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
import { db } from "@/firebase";
import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { toast } from "sonner";
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
  CheckCircle2,
  Clock,
  Mail,
  Briefcase,
  ImageIcon,
} from "lucide-react";

interface Props {
  report: any;
  onClose: () => void;
  onDelete: (id: string) => void;
}

type FieldStaff = {
  id: string;
  fsid?: string;
  name?: string;
  email?: string;
  department?: string;
  designation?: string;
  assignedTask?: string;
  resolvedCount?: number;
  duty_status?: boolean;
  location?: {
    latitude?: number;
    longitude?: number;
  };
};

export function ReportDetailDialog({ report, onClose, onDelete }: Props) {
  const { t } = useI18n();
  const [selectedCategory, setSelectedCategory] = useState("");
  const [assignedWorker, setAssignedWorker] = useState<FieldStaff | null>(null);

  useEffect(() => {
    const fetchAssignedWorker = async () => {
      if (!report) return;

      try {
        const snapshot = await getDocs(collection(db, "field_staff"));

        const staff = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as FieldStaff[];

        const matchedWorker =
          staff.find(
            (worker) =>
              worker.id === report.assignedWorkerId ||
              worker.fsid === report.assignedWorkerId ||
              worker.id === report.workerId ||
              worker.fsid === report.workerId ||
              worker.id === report.fieldStaffId ||
              worker.fsid === report.fieldStaffId ||
              worker.assignedTask === report.id
          ) || null;

        setAssignedWorker(matchedWorker);
      } catch (error) {
        console.error("Error fetching assigned field staff:", error);
        setAssignedWorker(null);
      }
    };

    fetchAssignedWorker();
  }, [report]);

  if (!report) return null;

  const image = report.image || report.imageUrl;
  const completionImage =
    report.completionImageUrl ||
    report.completionImage ||
    report.proofImage ||
    "";

  const user = report.citizenName || report.userId;
  const firestoreStatus =
    report.originalStatus || report.firestoreStatus || report.status || "N/A";

  const normalizedStatus = report.status?.toLowerCase?.();

  const isManualReview =
    normalizedStatus === "manual_review_required" ||
    normalizedStatus === "manual review required" ||
    normalizedStatus === "manual-review-required";

  const priority = report.priority || "N/A";
  const category = report.category || "N/A";
  const description = report.description || "N/A";

  const isUncategorized =
    category?.toLowerCase?.().trim() === "uncategorized";

  const date =
    report.createdAt?.toLocaleString?.() ||
    report.createdAt?.toDate?.()?.toLocaleString?.() ||
    "N/A";

  const completedDate =
    typeof report.completedAt === "number"
      ? new Date(report.completedAt).toLocaleString()
      : report.completedAt?.toDate?.()?.toLocaleString?.() || "N/A";

  const updateReportStatus = async (newStatus: "Resolved" | "Pending") => {
    try {
      await updateDoc(doc(db, "grievances", report.id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });

      toast.success(`Report marked as ${newStatus}`);
      onClose();
    } catch (error) {
      console.error("Error updating report status:", error);
      toast.error("Failed to update report status");
    }
  };

  const updateReportCategory = async () => {
    if (!selectedCategory) {
      toast.error("Please select a category");
      return;
    }

    try {
      await updateDoc(doc(db, "grievances", report.id), {
        category: selectedCategory,
        updatedAt: serverTimestamp(),
      });

      toast.success(`Category updated to ${selectedCategory}`);
      onClose();
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error("Failed to update category");
    }
  };

  return (
    <Dialog open={!!report} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4 pr-6">
            <div>
              <DialogTitle className="text-xl">
                {category !== "N/A" ? category : "Civic Report"}
                </DialogTitle>
                <DialogDescription className="mt-1">
                  Report details, status, location, assignment, and verification proof.
                  </DialogDescription>
            </div>

            <StatusBadge status={report.status} />
          </div>
        </DialogHeader>

        {isManualReview && (
          <section className="mt-4 rounded-xl border border-purple-200 bg-purple-50 p-4">
            <h4 className="mb-3 text-sm font-semibold text-purple-800">
              Manual Review Required
            </h4>

            <p className="mb-4 text-sm text-purple-700">
              Review this report and choose whether it should be marked as
              resolved or sent back to pending.
            </p>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => updateReportStatus("Resolved")}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                <CheckCircle2 className="size-4" />
                Resolved
              </Button>

              <Button
                variant="outline"
                onClick={() => updateReportStatus("Pending")}
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
              >
                <Clock className="size-4" />
                Pending
              </Button>
            </div>
          </section>
        )}

        {isUncategorized && (
          <section className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
            <h4 className="mb-3 text-sm font-semibold text-blue-800">
              Categorize Report
            </h4>

            <p className="mb-4 text-sm text-blue-700">
              This report is currently uncategorized. Please assign it to the
              correct category.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-10 flex-1 rounded-lg border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select category</option>
                <option value="Electricity">Electricity</option>
                <option value="Water Supply">Water Supply</option>
                <option value="Sanitation">Sanitation</option>
                <option value="Roads">Roads</option>
              </select>

              <Button onClick={updateReportCategory}>Update Category</Button>
            </div>
          </section>
        )}

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
              value={`${report.lat || report.location?.latitude || 0}, ${
                report.lng || report.location?.longitude || 0
              }`}
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
            Assigned Field Staff
          </h4>

          {assignedWorker ? (
            <div className="rounded-xl border bg-background p-4">
              <div className="flex items-center gap-4">
                <div className="flex size-14 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700">
                  {assignedWorker.name?.charAt(0)?.toUpperCase() || "F"}
                </div>

                <div className="flex-1">
                  <p className="font-semibold">
                    {assignedWorker.name || "Field Staff"}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {assignedWorker.designation || "Field Worker"}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <Row
                  icon={<Mail className="size-4" />}
                  label="Email"
                  value={assignedWorker.email || "N/A"}
                />

                <Row
                  icon={<Briefcase className="size-4" />}
                  label="Department"
                  value={assignedWorker.department || "N/A"}
                />

                <Row
                  icon={<Hash className="size-4" />}
                  label="Field Staff ID"
                  value={assignedWorker.fsid || assignedWorker.id}
                />

                <Row
                  icon={<CheckCircle2 className="size-4" />}
                  label="Resolved Count"
                  value={`${assignedWorker.resolvedCount ?? 0}`}
                />

                <Row
                  icon={<MapPin className="size-4" />}
                  label="Live Location"
                  value={
                    assignedWorker.location?.latitude &&
                    assignedWorker.location?.longitude
                      ? `${assignedWorker.location.latitude}, ${assignedWorker.location.longitude}`
                      : "N/A"
                  }
                />
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No assigned field staff found for this report.
            </p>
          )}
        </section>

        <section className="mt-4">
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <ImageIcon className="size-4 text-primary" />
            Completion Proof
          </h4>

          {completionImage ? (
            <div className="space-y-3">
              <img
                src={completionImage}
                alt="completion proof"
                className="w-full h-64 object-cover rounded-xl border"
              />

              <p className="text-xs text-muted-foreground">
                Completed At: {completedDate}
              </p>
            </div>
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